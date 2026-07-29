#!/usr/bin/env node
/**
 * Audita accesibilidad básica recorriendo las rutas principales de la app.
 *
 * No reemplaza a axe ni a una revisión manual: mide las tres cosas que hoy
 * bloquean el uso por teclado y lector de pantalla, y que son las que la Fase 3
 * del roadmap se compromete a arreglar.
 *
 *   1. Controles sin nombre accesible (un botón de ícono sin `aria-label` se
 *      anuncia como "botón", sin más).
 *   2. Elementos clickeables que no son controles (`<div onClick>`): no reciben
 *      foco, no responden a Enter/Espacio y no se anuncian como accionables.
 *   3. Campos de formulario sin etiqueta asociada.
 *
 * Requiere el stack local + `pnpm dev`. Ver docs/verificacion-visual.md.
 *
 * Uso:
 *   node scripts/audit-a11y.mjs
 *   node scripts/audit-a11y.mjs --json    # salida para comparar entre corridas
 */

import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const JSON_OUT = process.argv.includes('--json')

const CAMPAIGN = 'aaaaaaaa-0000-0000-0000-000000000001'
const THORIN = 'bbbbbbbb-0000-0000-0000-000000000001'
const PASSWORD = 'taberna123'

const ROUTES = [
  ['Dashboard', '/'],
  ['Ficha de personaje', `/characters/${THORIN}`],
  ['Campaña · overview', `/campaigns/${CAMPAIGN}`],
  ['Tablero', `/campaigns/${CAMPAIGN}/tablero`],
  ['PNJs', `/campaigns/${CAMPAIGN}/pnj`],
  ['Comercio', `/campaigns/${CAMPAIGN}/comercio`],
  ['Taberna', `/campaigns/${CAMPAIGN}/taberna`],
  ['Notas', `/campaigns/${CAMPAIGN}/notas`],
  ['Bestiario', '/bestiary'],
  ['Grimorio', '/spellbook'],
  ['Creación de personaje', '/characters/new'],
]

/**
 * Se ejecuta dentro de la página. Acotado a `#app` a propósito: el panel del
 * navegador inyecta su propia UI y contaminaría los números.
 */
const AUDIT = () => {
  const root = document.getElementById('app')
  if (!root) return null

  const accessibleName = el => (
    el.getAttribute('aria-label') ||
    el.getAttribute('title') ||
    el.innerText.trim() ||
    el.querySelector('img')?.alt ||
    ''
  ).trim()

  const buttons = [...root.querySelectorAll('button')]
  const unnamed = buttons.filter(b => !accessibleName(b))

  // React no expone onClick como atributo, así que se aproxima por el cursor:
  // un div con `cursor: pointer` que no está dentro de un control real.
  const fakeButtons = [...root.querySelectorAll('div, span')].filter(el =>
    getComputedStyle(el).cursor === 'pointer' &&
    !el.closest('button, a, label, input, select, textarea') &&
    !el.getAttribute('role')
  )

  const fields = [...root.querySelectorAll('input, select, textarea')]
  const unlabelled = fields.filter(f =>
    !f.getAttribute('aria-label') &&
    !f.getAttribute('placeholder') &&
    !(f.labels && f.labels.length) &&
    !f.closest('label')
  )

  const focusable = [...root.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]

  return {
    buttons: buttons.length,
    unnamed: unnamed.length,
    unnamedSample: unnamed.slice(0, 4).map(b => b.className.split(' ').slice(0, 3).join(' ')),
    fakeButtons: fakeButtons.length,
    fields: fields.length,
    unlabelled: unlabelled.length,
    focusable: focusable.length,
    landmarks: root.querySelectorAll('main, nav, header, footer, aside, [role="main"], [role="navigation"]').length,
    headings: root.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
  }
}

const run = async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  await context.addInitScript(() => localStorage.setItem('taberna-locale', 'es'))
  const page = await context.newPage()

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('Email').fill('martita@taberna.test')
  await page.getByPlaceholder('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: /entrar/i }).click()
  await page.waitForURL(u => !u.pathname.includes('login'), { timeout: 15000 })

  const results = []
  for (const [name, path] of ROUTES) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(1200)
    const r = await page.evaluate(AUDIT)
    if (r) results.push({ ruta: name, ...r })
  }

  await browser.close()

  if (JSON_OUT) {
    console.log(JSON.stringify(results, null, 2))
    return
  }

  const sum = k => results.reduce((a, r) => a + r[k], 0)

  console.log('\n  RUTA                        BOTONES  SIN NOMBRE  FALSOS BTN  CAMPOS  SIN LABEL  LANDMARKS')
  console.log('  ' + '─'.repeat(94))
  for (const r of results) {
    console.log(
      '  ' + r.ruta.padEnd(26) +
      String(r.buttons).padStart(7) +
      String(r.unnamed).padStart(12) +
      String(r.fakeButtons).padStart(12) +
      String(r.fields).padStart(8) +
      String(r.unlabelled).padStart(11) +
      String(r.landmarks).padStart(11)
    )
  }
  console.log('  ' + '─'.repeat(94))
  console.log(
    '  ' + 'TOTAL'.padEnd(26) +
    String(sum('buttons')).padStart(7) +
    String(sum('unnamed')).padStart(12) +
    String(sum('fakeButtons')).padStart(12) +
    String(sum('fields')).padStart(8) +
    String(sum('unlabelled')).padStart(11) +
    String(sum('landmarks')).padStart(11)
  )

  const pct = sum('buttons') ? Math.round((1 - sum('unnamed') / sum('buttons')) * 100) : 100
  console.log(`\n  Botones con nombre accesible: ${pct}%`)
  console.log(`  Elementos clickeables que no son controles: ${sum('fakeButtons')}`)
  console.log(`  Regiones semánticas (main/nav/header): ${sum('landmarks')}\n`)
}

run().catch(err => { console.error(err); process.exit(1) })
