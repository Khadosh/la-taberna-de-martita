#!/usr/bin/env node
/**
 * Captura las pantallas principales de la app contra el stack local.
 *
 * Requiere `supabase start` + `supabase db reset` (para el seed) y `pnpm dev`.
 * Las capturas van a docs/screenshots/ en JPEG: son ilustraciones de documento,
 * no assets de la app, y en PNG pesarían cinco veces más.
 *
 * El idioma se fija explícitamente: sin eso, el navegador headless lo detecta de
 * `navigator.language` y las capturas dejan de ser reproducibles.
 *
 * El flujo de subida de nivel escribe en la base: el DM le otorga experiencia a
 * Thorin. Por eso conviene `supabase db reset` antes de cada corrida — si no, la
 * ficha arranca con la experiencia que le dejó la corrida anterior. El script
 * avisa cuando detecta eso, no falla.
 *
 * Uso:
 *   supabase db reset
 *   node scripts/capture-screenshots.mjs              # español (docs/screenshots/es)
 *   supabase db reset
 *   node scripts/capture-screenshots.mjs --locale en  # inglés  (docs/screenshots/en)
 *   node scripts/capture-screenshots.mjs --headed     # para depurar
 */

import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const HEADED = process.argv.includes('--headed')

const localeFlag = process.argv.indexOf('--locale')
const LOCALE = localeFlag !== -1 ? process.argv[localeFlag + 1] : 'es'
const OUT = join(ROOT, 'docs/screenshots', LOCALE)

/** Etiquetas de los controles que el script necesita accionar, por idioma. */
const UI = {
  es: {
    email: 'Email', password: 'Contraseña', signIn: /entrar/i,
    skills: /pericias/i, story: /historia/i, spells: /hechizos/i,
    startCombat: /iniciar combate/i, levelUp: /^subir al nivel/i,
    spellMode: /^conjuro$/i, bowMode: /^arco$/i, projectAoe: /proyectar área/i,
  },
  en: {
    email: 'Email', password: 'Password', signIn: /enter/i,
    skills: /skills/i, story: /story/i, spells: /spells/i,
    startCombat: /start combat/i, levelUp: /^level up to/i,
    spellMode: /^spell$/i, bowMode: /^bow$/i, projectAoe: /project area/i,
  },
}[LOCALE]

const CAMPAIGN = 'aaaaaaaa-0000-0000-0000-000000000001'
const THORIN = 'bbbbbbbb-0000-0000-0000-000000000001'
const LYRA = 'bbbbbbbb-0000-0000-0000-000000000002'

const ACCOUNTS = {
  dm: 'martita@taberna.test',
  guerrero: 'thorin@taberna.test',
  maga: 'lyra@taberna.test',
}
const PASSWORD = 'taberna123'

/** Umbral de nivel 4 en el SRD. Thorin arranca el seed en nivel 3 con 900 PX. */
const LEVEL_4_XP = 2700
/** Se usa solo si no se pudo leer la experiencia actual de la ficha. */
const XP_GRANT = 1800

/** Las rutas cargan datos del SRD por red; conviene esperar a que la red calme. */
async function settle(page, ms = 1200) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
}

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k))
  })
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder(UI.email).fill(email)
  await page.getByPlaceholder(UI.password).fill(PASSWORD)
  await page.getByRole('button', { name: UI.signIn }).click()
  await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 15000 })
  await settle(page)
}

async function shot(page, name) {
  await settle(page, 900)
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 88 })
  console.log(`  ✓ ${name}.jpg`)
}

/**
 * Click tolerante: una captura no debe abortar la corrida entera porque un
 * elemento no apareció (la API del SRD a veces tarda o cambia de orden).
 */
async function click(page, locator) {
  try {
    await locator.first().click({ timeout: 6000 })
    await page.waitForTimeout(900)
  } catch {
    console.log(`    (no se pudo interactuar, se captura el estado por defecto)`)
  }
}

/**
 * Clickea una ficha del tablero por su etiqueta.
 *
 * No se puede usar un locator de Playwright sobre el nombre: la etiqueta tiene
 * `pointerEvents: 'none'` para no robarle el arrastre a la ficha. Hay que ubicar
 * el círculo y clickear su centro con el mouse. Un click con menos de 5 px de
 * desplazamiento cuenta como tap; más que eso el tablero lo toma como arrastre.
 */
async function clickToken(page, label) {
  const point = await page.evaluate(name => {
    // Se busca el círculo y desde ahí la etiqueta, no al revés: el panel de
    // party de la izquierda repite los nombres de los personajes, así que
    // arrancar por el texto encuentra la tarjeta lateral en vez de la ficha.
    const circle = [...document.querySelectorAll('div')]
      .filter(d => {
        const st = getComputedStyle(d)
        const w = parseInt(st.width)
        return st.position === 'absolute' && st.borderRadius.includes('%') && w > 40 && w < 120
      })
      .find(c => c.parentElement?.parentElement?.querySelector('p')?.textContent?.trim().startsWith(name))
    if (!circle) return null
    const r = circle.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, label)
  if (!point) { console.log(`    (no se encontró la ficha ${label})`); return false }
  await page.mouse.click(point.x, point.y)
  await page.waitForTimeout(800)
  return true
}

/** Lee la experiencia que muestra la ficha abierta. Devuelve 0 si no la encuentra. */
async function readXp(page) {
  const raw = await page.getByText(/[\d,.]+\s*XP/).first().textContent().catch(() => null)
  return raw ? parseInt(raw.replace(/[^\d]/g, ''), 10) || 0 : 0
}

/** Scrollea el contenedor interno de la ruta: el scroll no vive en `window`. */
async function scrollRoute(page, top) {
  await page.evaluate(y => {
    const el = [...document.querySelectorAll('div')].find(
      e => e.scrollHeight > e.clientHeight + 100 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY)
    )
    if (el) el.scrollTop = y
  }, top)
  await page.waitForTimeout(400)
}

const run = async () => {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })

  const browser = await chromium.launch({ headless: !HEADED })
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  })
  // Fija el idioma antes de que arranque React, para no depender de la
  // detección por `navigator.language` del navegador headless.
  await context.addInitScript(l => localStorage.setItem('taberna-locale', l), LOCALE)
  const page = await context.newPage()

  // ── Público ────────────────────────────────────────────────────────────────
  console.log('\nPúblico')
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await shot(page, '01-login')

  // ── Jugador ────────────────────────────────────────────────────────────────
  console.log('\nJugador · Thorin')
  await login(page, ACCOUNTS.guerrero)
  await shot(page, '02-dashboard')

  await page.goto(`${BASE}/characters/${THORIN}`, { waitUntil: 'domcontentloaded' })
  await shot(page, '03-ficha-resumen')

  await page.getByRole('button', { name: UI.skills }).click().catch(() => {})
  await shot(page, '04-ficha-pericias')

  await page.getByRole('button', { name: UI.story }).click().catch(() => {})
  await shot(page, '05-ficha-historia')

  // ── Maga: conjuros ─────────────────────────────────────────────────────────
  console.log('\nJugadora · Lyra')
  await login(page, ACCOUNTS.maga)
  await page.goto(`${BASE}/characters/${LYRA}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: UI.spells }).click().catch(() => {})
  await shot(page, '06-ficha-hechizos')

  // ── DM ─────────────────────────────────────────────────────────────────────
  console.log('\nDM · Martita')
  await login(page, ACCOUNTS.dm)

  await page.goto(`${BASE}/campaigns/${CAMPAIGN}`, { waitUntil: 'domcontentloaded' })
  await shot(page, '07-campania-overview')

  await page.goto(`${BASE}/campaigns/${CAMPAIGN}/tablero`, { waitUntil: 'domcontentloaded' })
  await shot(page, '08-tablero-dm')

  // Con el combate iniciado aparecen la iniciativa y las fichas sobre la grilla.
  await click(page, page.getByRole('button', { name: UI.startCombat }))
  await shot(page, '08b-tablero-combate')

  // Atacante y objetivo: la resolución sale de elegir el par, así que la captura
  // necesita las dos selecciones hechas. Con el tablero en reposo no se ve nada
  // de lo que hace distinta a esta pantalla.
  // Se elige un par lejano —Pip con el arco corto contra Grishnak— en vez de un
  // cuerpo a cuerpo: el popup se ancla en el punto medio entre atacante y
  // objetivo, así que con las fichas separadas queda en el hueco del medio y se
  // ven las dos. Un par pegado lo deja justo encima de ellas.
  await clickToken(page, 'Pip')
  await clickToken(page, 'Grishnak')
  await click(page, page.getByRole('button', { name: UI.bowMode }))
  await shot(page, '08c-resolucion-de-ataque')

  // Plantilla de área: Lyra apunta a Grishnak y proyecta la esfera. Es el
  // ejemplo más claro de la tesis — el hechizo es una figura sobre el mapa con
  // los nombres de quién queda adentro, no "20 pies de radio" en una
  // descripción.
  // Se recarga la ruta en vez de deseleccionar a mano: el popup quedó encima de
  // las fichas y cualquier click de limpieza le pega a él.
  await page.goto(`${BASE}/campaigns/${CAMPAIGN}/tablero`, { waitUntil: 'domcontentloaded' })
  await settle(page)
  await click(page, page.getByRole('button', { name: UI.startCombat }))
  await clickToken(page, 'Lyra')
  await clickToken(page, 'Grishnak')
  await click(page, page.getByRole('button', { name: UI.spellMode }))
  await click(page, page.getByRole('button', { name: UI.projectAoe }))
  await shot(page, '08d-area-de-efecto')

  // El formulario de PNJ ocupa el alto completo; las fichas sembradas van debajo.
  await page.goto(`${BASE}/campaigns/${CAMPAIGN}/pnj`, { waitUntil: 'domcontentloaded' })
  await shot(page, '09-pnj-formulario')
  await scrollRoute(page, 1400)
  await shot(page, '09b-pnjs')

  await page.goto(`${BASE}/campaigns/${CAMPAIGN}/comercio`, { waitUntil: 'domcontentloaded' })
  await scrollRoute(page, 520)
  await click(page, page.getByRole('button', { name: /^Longsword$/ }))
  await shot(page, '10-comercio')

  await page.goto(`${BASE}/campaigns/${CAMPAIGN}/taberna`, { waitUntil: 'domcontentloaded' })
  await shot(page, '11-taberna')

  await page.goto(`${BASE}/campaigns/${CAMPAIGN}/notas`, { waitUntil: 'domcontentloaded' })
  await shot(page, '12-notas')

  // ── Compendios y wizard ────────────────────────────────────────────────────
  console.log('\nCompendios')
  // Sin selección, los compendios son solo una lista: hay que abrir una ficha.
  await page.goto(`${BASE}/bestiary`, { waitUntil: 'domcontentloaded' })
  await click(page, page.getByText('Adult Red Dragon', { exact: true }))
  await shot(page, '13-bestiario')

  await page.goto(`${BASE}/spellbook`, { waitUntil: 'domcontentloaded' })
  await click(page, page.getByText('Fireball', { exact: true }))
  await shot(page, '14-grimorio')

  await page.goto(`${BASE}/characters/new`, { waitUntil: 'domcontentloaded' })
  await settle(page, 2500)
  await shot(page, '15-wizard-creacion')

  // ── Subida de nivel: dos actores ───────────────────────────────────────────
  // El DM otorga la experiencia y el jugador decide qué gana con ella. Son dos
  // sesiones distintas sobre la misma ficha, así que van al final para no
  // interrumpir el resto del recorrido.
  console.log('\nSubida de nivel · DM → jugador')

  // El DM ya está logueado. `+ XP` solo aparece para él: el jugador no puede
  // darse experiencia a sí mismo.
  await page.goto(`${BASE}/characters/${THORIN}`, { waitUntil: 'domcontentloaded' })
  await settle(page)

  // Solo se otorga la diferencia hasta el umbral, no una cantidad fija: el DM
  // únicamente puede sumar, así que un delta fijo haría crecer la experiencia en
  // cada corrida y la captura terminaría mostrando un número absurdo.
  const currentXp = await readXp(page)
  const grant = Math.max(0, LEVEL_4_XP - currentXp)
  if (grant === 0) {
    console.log(`    ⚠ Thorin ya tiene ${currentXp} PX; corré 'supabase db reset' para volver al seed`)
  }

  await click(page, page.getByRole('button', { name: '+ XP' }))
  await page.locator('input[placeholder="0"]').fill(String(grant || XP_GRANT)).catch(() => {})
  await shot(page, '16-dm-otorga-xp')
  if (grant > 0) await click(page, page.getByRole('button', { name: 'OK' }))
  else await page.keyboard.press('Escape')

  // El umbral de nivel 4 son 2.700 PX; con el otorgamiento anterior Thorin
  // queda encima y le aparece el botón a él, no al DM.
  await login(page, ACCOUNTS.guerrero)
  await page.goto(`${BASE}/characters/${THORIN}`, { waitUntil: 'domcontentloaded' })
  await settle(page)
  await click(page, page.getByRole('button', { name: UI.levelUp }))
  await shot(page, '17-subida-de-nivel')
  // No se confirma a propósito: dejar el nivel sin subir mantiene el seed
  // estable y permite volver a correr el script sin resetear la base.

  await browser.close()
  console.log(`\n✅ capturas (${LOCALE}) en ${OUT}\n`)
}

run().catch(err => { console.error(err); process.exit(1) })
