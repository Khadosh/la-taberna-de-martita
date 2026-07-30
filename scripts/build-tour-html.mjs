#!/usr/bin/env node
/**
 * Genera `docs/product-tour.html` a partir de `docs/product-tour.md`.
 *
 * El markdown sigue siendo la fuente de verdad —se lee bien en GitHub y en
 * cualquier editor—; esto le pone encima el sistema de diseño de la app y deja
 * un archivo único que se abre de un doble click, sin servidor y sin red.
 *
 * Todo va embebido en base64: la tipografía Cinzel y las capturas, reescaladas
 * a 1000 px porque en la página se ven a 1120 como mucho y el original de
 * 1600 px triplica el peso sin agregar detalle.
 *
 * El conversor de markdown es a medida y cubre solo lo que este documento usa
 * (encabezados, párrafos, listas, tablas, citas, código, imágenes, énfasis).
 * Es deliberado: sumar una dependencia de 200 KB para un archivo propio de 300
 * líneas no se paga.
 *
 * Uso:
 *   node scripts/build-tour-html.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs'
import { execFileSync } from 'child_process'
import { dirname, join, basename } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'docs/product-tour.md')
const OUT = join(ROOT, 'docs/product-tour.html')
/** `--fragment <ruta>` emite solo estilos + contenido, sin `<html>` ni `<head>`,
 *  para incrustar la página en un host que aporta su propio esqueleto. */
const fragFlag = process.argv.indexOf('--fragment')
const FRAGMENT = fragFlag !== -1 ? process.argv[fragFlag + 1] : null
const TMP = join(ROOT, '.tour-build')
const FONT = join(ROOT, 'scripts/assets/cinzel-latin.woff2')

/** Ancho al que se reescalan las capturas antes de embeberlas. */
const IMG_WIDTH = 1000
const IMG_QUALITY = 68

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Énfasis, código y links dentro de una línea. */
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) =>
      `<a href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`)
}

/**
 * Reescala una captura y la devuelve como data URI.
 *
 * `sips` es la única herramienta de imagen disponible sin sumar dependencias;
 * escribe JPEG, que es lo que estas capturas ya son.
 */
const cache = new Map()
function embedImage(relPath) {
  if (cache.has(relPath)) return cache.get(relPath)
  const source = join(ROOT, 'docs', relPath)
  if (!existsSync(source)) {
    console.log(`    ⚠ falta ${relPath}`)
    return ''
  }
  const scaled = join(TMP, basename(relPath))
  execFileSync('sips', ['-Z', String(IMG_WIDTH), '-s', 'formatOptions', String(IMG_QUALITY),
    source, '--out', scaled], { stdio: 'ignore' })
  const uri = `data:image/jpeg;base64,${readFileSync(scaled).toString('base64')}`
  cache.set(relPath, uri)
  return uri
}

/** Markdown → HTML. Solo las construcciones que usa este documento. */
function render(md) {
  const lines = md.split('\n')
  const out = []
  let i = 0
  let inSection = false
  let figure = 0

  const closeSection = () => { if (inSection) { out.push('</section>'); inSection = false } }

  while (i < lines.length) {
    const line = lines[i]

    // Separador horizontal: en el markdown parte secciones, acá ya lo hace
    // el propio encabezado, así que se descarta.
    if (/^---\s*$/.test(line)) { i++; continue }

    if (/^#\s+/.test(line)) { i++; continue }  // el título va en el hero

    if (/^##\s+/.test(line)) {
      closeSection()
      const text = line.replace(/^##\s+/, '')
      out.push(`<section><h2>${inline(text)}</h2>`)
      inSection = true
      i++
      continue
    }

    if (/^###\s+/.test(line)) {
      out.push(`<h3>${inline(line.replace(/^###\s+/, ''))}</h3>`)
      i++
      continue
    }

    // Imagen suelta → figura con marcas de esquina y epígrafe
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
    if (img) {
      const [, alt, src] = img
      const uri = embedImage(src)
      figure++
      out.push(
        `<figure><div class="frame">` +
        `<img src="${uri}" alt="${esc(alt)}" loading="lazy" width="1000" />` +
        `<span class="br tl"></span><span class="br tr"></span>` +
        `<span class="br bl"></span><span class="br br-"></span>` +
        `</div><figcaption><span class="fignum">${String(figure).padStart(2, '0')}</span>${esc(alt)}</figcaption></figure>`
      )
      i++
      continue
    }

    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, '').trim()
      const body = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++])
      i++
      out.push(`<pre data-lang="${esc(lang)}"><code>${esc(body.join('\n'))}</code></pre>`)
      continue
    }

    if (/^>\s?/.test(line)) {
      const body = []
      while (i < lines.length && /^>\s?/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/, ''))
      out.push(`<blockquote>${inline(body.join(' '))}</blockquote>`)
      continue
    }

    if (/^\|/.test(line)) {
      const rows = []
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++])
      const cells = r => r.split('|').slice(1, -1).map(c => c.trim())
      const head = cells(rows[0])
      const body = rows.slice(2).map(cells)
      const empty = head.every(h => h === '')
      out.push(
        `<div class="tablewrap"><table>` +
        (empty ? '' : `<thead><tr>${head.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead>`) +
        `<tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>` +
        `</table></div>`
      )
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items = []
      while (i < lines.length && (/^[-*]\s+/.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
        if (/^[-*]\s+/.test(lines[i])) items.push(lines[i].replace(/^[-*]\s+/, ''))
        else items[items.length - 1] += ' ' + lines[i].trim()
        i++
      }
      out.push(`<ul>${items.map(t => `<li>${inline(t)}</li>`).join('')}</ul>`)
      continue
    }

    if (line.trim() === '') { i++; continue }

    const para = []
    while (i < lines.length && lines[i].trim() !== '' &&
           !/^(#{1,3}\s|!\[|```|>|\||[-*]\s|---)/.test(lines[i])) para.push(lines[i++])
    out.push(`<p>${inline(para.join(' '))}</p>`)
  }

  closeSection()
  return out.join('\n')
}

const md = readFileSync(SRC, 'utf8')
const title = md.match(/^#\s+(.+)$/m)?.[1] ?? 'Product tour'
const [, lede] = md.match(/^#\s+.+\n\n([\s\S]+?)\n\n/) ?? [, '']

rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })

const font = existsSync(FONT)
  ? `@font-face{font-family:'Cinzel';font-style:normal;font-weight:400 700;font-display:block;src:url(data:font/woff2;base64,${readFileSync(FONT).toString('base64')}) format('woff2')}`
  : ''
if (!font) console.log('    ⚠ sin Cinzel embebida; se usa Georgia')

const body = render(md)

const styles = `${font}

/* Las dos metáforas del sistema de diseño de la app son los dos temas de esta
   página: la mesa de juego oscura y los documentos de aventura en pergamino.
   No es una inversión de colores — son dos superficies reales del producto. */
:root{
  --ground:#0c0a09; --panel:#180e06; --raised:#1f130a;
  --rule:#4a3218; --display:#d5b88a; --bright:#f5d9a8;
  --body:#c4bbaf; --muted:#8b8177; --ember:#c2620f;
  --shadow:0 24px 60px rgba(0,0,0,.65);
}
@media (prefers-color-scheme: light){
  :root{
    --ground:#efe4cd; --panel:#e7d9bb; --raised:#f4ecda;
    --rule:#c3a97c; --display:#7a5828; --bright:#5c3f1a;
    --body:#4a3418; --muted:#836b46; --ember:#9b4a10;
    --shadow:0 20px 48px rgba(90,64,26,.22);
  }
}
:root[data-theme="dark"]{
  --ground:#0c0a09; --panel:#180e06; --raised:#1f130a;
  --rule:#4a3218; --display:#d5b88a; --bright:#f5d9a8;
  --body:#c4bbaf; --muted:#8b8177; --ember:#c2620f;
  --shadow:0 24px 60px rgba(0,0,0,.65);
}
:root[data-theme="light"]{
  --ground:#efe4cd; --panel:#e7d9bb; --raised:#f4ecda;
  --rule:#c3a97c; --display:#7a5828; --bright:#5c3f1a;
  --body:#4a3418; --muted:#836b46; --ember:#9b4a10;
  --shadow:0 20px 48px rgba(90,64,26,.22);
}

*{box-sizing:border-box}
body{
  margin:0; background:var(--ground); color:var(--body);
  font:400 17px/1.72 Georgia,'Times New Roman',serif;
  -webkit-font-smoothing:antialiased;
}
/* Cuadrícula sepia de 24 px, la misma del pergamino técnico de la app. */
body::before{
  content:''; position:fixed; inset:0; pointer-events:none; z-index:0; opacity:.5;
  background:
    linear-gradient(color-mix(in srgb,var(--rule) 22%,transparent) 1px,transparent 1px) 0 0/100% 24px,
    linear-gradient(90deg,color-mix(in srgb,var(--rule) 22%,transparent) 1px,transparent 1px) 0 0/24px 100%;
  mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,#000 10%,transparent 75%);
}
.wrap{position:relative; z-index:1; max-width:1120px; margin:0 auto; padding:0 28px 120px}

h1,h2,h3,.eyebrow,figcaption .fignum,th{
  font-family:'Cinzel',Georgia,serif; font-weight:600;
}

/* ── Portada ─────────────────────────────────────────────────────────── */
header{padding:100px 0 64px; max-width:70ch}
.eyebrow{
  font-size:11px; letter-spacing:.42em; text-transform:uppercase;
  color:var(--ember); display:block; margin-bottom:26px;
}
h1{
  font-size:clamp(34px,5.4vw,60px); line-height:1.06; margin:0 0 26px;
  color:var(--bright); letter-spacing:.06em; text-transform:uppercase;
  text-wrap:balance;
}
.lede{font-size:20px; line-height:1.62; color:var(--body); margin:0 0 30px; max-width:62ch}
.stack{
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:12.5px; color:var(--muted); letter-spacing:.02em; line-height:1.9;
  border-left:2px solid var(--rule); padding-left:16px;
}
.rule{height:1px; background:linear-gradient(90deg,var(--rule),transparent); margin:0 0 8px}

/* ── Secciones ───────────────────────────────────────────────────────── */
section{padding:56px 0 8px; border-top:1px solid color-mix(in srgb,var(--rule) 55%,transparent)}
section:first-of-type{border-top:none}
h2{
  font-size:clamp(21px,2.5vw,27px); letter-spacing:.15em; text-transform:uppercase;
  color:var(--display); margin:0 0 30px; text-wrap:balance;
}
h3{
  font-size:16px; letter-spacing:.13em; text-transform:uppercase;
  color:var(--bright); margin:48px 0 18px;
}
p{margin:0 0 22px; max-width:66ch}
strong{color:var(--bright); font-weight:700}
em{color:var(--body)}
a{color:var(--ember); text-decoration-color:color-mix(in srgb,var(--ember) 40%,transparent); text-underline-offset:3px}
a:hover{text-decoration-color:var(--ember)}
a:focus-visible,summary:focus-visible{outline:2px solid var(--ember); outline-offset:3px}

ul{margin:0 0 24px; padding:0; list-style:none; max-width:66ch}
li{padding-left:24px; position:relative; margin-bottom:12px}
li::before{
  content:'◆'; position:absolute; left:0; top:0;
  color:var(--rule); font-size:10px; line-height:2.3;
}

blockquote{
  margin:0 0 26px; padding:18px 24px; max-width:66ch;
  background:var(--panel); border-left:3px solid var(--ember);
  font-style:italic; color:var(--body);
}

/* Monoespaciada solo para datos del sistema y rutas de archivo — la misma
   regla semántica que usa la app para separar el lore de las estadísticas. */
code{
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.85em;
  background:var(--panel); color:var(--display);
  padding:2px 6px; border:1px solid color-mix(in srgb,var(--rule) 60%,transparent);
}
pre{
  background:var(--panel); border:1px solid var(--rule); padding:20px 22px;
  overflow-x:auto; margin:0 0 26px; max-width:66ch; position:relative;
}
pre code{background:none; border:none; padding:0; color:var(--body); font-size:13.5px; line-height:1.75}
pre[data-lang]:not([data-lang=""])::after{
  content:attr(data-lang); position:absolute; top:8px; right:12px;
  font-family:ui-monospace,monospace; font-size:10px; letter-spacing:.2em;
  text-transform:uppercase; color:var(--muted);
}

.tablewrap{overflow-x:auto; margin:0 0 30px; max-width:100%}
table{border-collapse:collapse; width:100%; font-size:15px}
th{
  text-align:left; font-size:11px; letter-spacing:.16em; text-transform:uppercase;
  color:var(--display); padding:0 18px 10px 0; border-bottom:1px solid var(--rule);
  white-space:nowrap;
}
td{padding:13px 18px 13px 0; border-bottom:1px solid color-mix(in srgb,var(--rule) 35%,transparent); vertical-align:top}
tr:last-child td{border-bottom:none}
td:first-child{color:var(--bright)}

/* ── Figuras: marcas de esquina del componente CornerBracket ─────────── */
figure{margin:38px 0 44px}
.frame{position:relative; padding:10px; background:var(--raised); box-shadow:var(--shadow)}
.frame img{display:block; width:100%; height:auto; border:1px solid var(--rule)}
.br{position:absolute; width:15px; height:15px; border-color:var(--display); border-style:solid; border-width:0}
.tl{top:-1px; left:-1px; border-top-width:2px; border-left-width:2px}
.tr{top:-1px; right:-1px; border-top-width:2px; border-right-width:2px}
.bl{bottom:-1px; left:-1px; border-bottom-width:2px; border-left-width:2px}
.br-{bottom:-1px; right:-1px; border-bottom-width:2px; border-right-width:2px}
figcaption{
  margin-top:14px; font-size:13px; color:var(--muted); font-style:italic;
  display:flex; gap:12px; align-items:baseline;
}
.fignum{
  font-family:ui-monospace,monospace; font-style:normal; font-size:11px;
  letter-spacing:.14em; color:var(--ember); font-weight:600;
  font-variant-numeric:tabular-nums;
}

footer{
  margin-top:80px; padding-top:32px; border-top:1px solid var(--rule);
  font-family:ui-monospace,monospace; font-size:12px; color:var(--muted);
  display:flex; justify-content:space-between; gap:20px; flex-wrap:wrap;
}

@media (max-width:640px){
  body{font-size:16px}
  .wrap{padding:0 20px 80px}
  header{padding:60px 0 44px}
  section{padding:44px 0 8px}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important; transition:none!important}}
`

const page = `<div class="wrap">
<header>
  <span class="eyebrow">Guided tour</span>
  <h1>${esc(title.replace(/\s*—.*$/, ''))}</h1>
  <p class="lede">${inline(lede.replace(/\n/g, ' '))}</p>
  <div class="rule"></div>
  <p class="stack">React 19 · TanStack Router + Query · Tailwind v4<br />Supabase — Postgres, RLS, Realtime, Storage · Vite · Vercel</p>
</header>
${body}
<footer>
  <span>SRD 5.1 content under CC-BY-4.0 · not affiliated with Wizards of the Coast</span>
  <span>Screenshots generated by scripts/capture-screenshots.mjs</span>
</footer>
</div>
`

if (FRAGMENT) {
  mkdirSync(dirname(FRAGMENT), { recursive: true })
  writeFileSync(FRAGMENT, `<style>\n${styles}\n</style>\n${page}`)
}

writeFileSync(OUT, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>
${styles}
</style>
</head>
<body>
${page}
</body>
</html>
`)


rmSync(TMP, { recursive: true, force: true })
const kb = Math.round(readFileSync(OUT).length / 1024)
console.log(`\n✅ docs/product-tour.html — ${kb} KB, ${cache.size} capturas embebidas\n`)
