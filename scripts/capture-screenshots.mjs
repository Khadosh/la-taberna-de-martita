#!/usr/bin/env node
/**
 * Captura las pantallas principales de la app contra el stack local.
 *
 * Requiere `supabase start` + `supabase db reset` (para el seed) y `pnpm dev`.
 * Las capturas van a docs/screenshots/ en JPEG: son ilustraciones de documento,
 * no assets de la app, y en PNG pesarían cinco veces más.
 *
 * Uso:
 *   node scripts/capture-screenshots.mjs
 *   node scripts/capture-screenshots.mjs --headed    # para depurar
 */

import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs/screenshots')
const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const HEADED = process.argv.includes('--headed')

const CAMPAIGN = 'aaaaaaaa-0000-0000-0000-000000000001'
const THORIN = 'bbbbbbbb-0000-0000-0000-000000000001'
const LYRA = 'bbbbbbbb-0000-0000-0000-000000000002'

const ACCOUNTS = {
  dm: 'martita@taberna.test',
  guerrero: 'thorin@taberna.test',
  maga: 'lyra@taberna.test',
}
const PASSWORD = 'taberna123'

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
  await page.getByPlaceholder('Email').fill(email)
  await page.getByPlaceholder('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: /entrar/i }).click()
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

  await page.getByRole('button', { name: /pericias/i }).click().catch(() => {})
  await shot(page, '04-ficha-pericias')

  await page.getByRole('button', { name: /historia/i }).click().catch(() => {})
  await shot(page, '05-ficha-historia')

  // ── Maga: conjuros ─────────────────────────────────────────────────────────
  console.log('\nJugadora · Lyra')
  await login(page, ACCOUNTS.maga)
  await page.goto(`${BASE}/characters/${LYRA}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /hechizos/i }).click().catch(() => {})
  await shot(page, '06-ficha-hechizos')

  // ── DM ─────────────────────────────────────────────────────────────────────
  console.log('\nDM · Martita')
  await login(page, ACCOUNTS.dm)

  await page.goto(`${BASE}/campaigns/${CAMPAIGN}`, { waitUntil: 'domcontentloaded' })
  await shot(page, '07-campania-overview')

  await page.goto(`${BASE}/campaigns/${CAMPAIGN}/tablero`, { waitUntil: 'domcontentloaded' })
  await shot(page, '08-tablero-dm')

  // Con el combate iniciado aparecen la iniciativa y las fichas sobre la grilla.
  await click(page, page.getByRole('button', { name: /iniciar combate/i }))
  await shot(page, '08b-tablero-combate')

  // El formulario de PNJ ocupa el alto completo; las fichas sembradas van debajo.
  await page.goto(`${BASE}/campaigns/${CAMPAIGN}/pnj`, { waitUntil: 'domcontentloaded' })
  await scrollRoute(page, 1400)
  await shot(page, '09-pnjs')

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

  await browser.close()
  console.log(`\n✅ capturas en ${OUT}\n`)
}

run().catch(err => { console.error(err); process.exit(1) })
