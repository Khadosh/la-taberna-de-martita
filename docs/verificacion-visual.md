# Verificación visual — migración de íconos y optimización de assets

Fecha: 29 de julio de 2026 · Rama `chore/fase-0-higiene`

Entorno: stack de Supabase local en Docker (`supabase start`) con el seed de
`supabase/seed.sql`, app en `vite dev`. Sin tocar el proyecto de Supabase cloud.

## Por qué existe este documento

Los commits de Fase 0 cambiaron cómo se renderizan **todos** los íconos de la app:
de `<img src>` con PNGs de color fijo a máscara CSS sobre `bg-current` con SVGs de
game-icons. El typecheck y el build no prueban nada sobre eso — un ícono puede
compilar perfecto y no verse. Esto registra qué se verificó a ojo y qué no.

---

## Qué se verificó

| Pantalla | Qué se comprobó | Estado |
|---|---|---|
| Login | Fondo `login_bg.jpg` (convertido de PNG) | ✅ |
| Dashboard | Personajes, stats, modificadores calculados, campañas por rol | ✅ |
| Ficha · Resumen | Características, HP, CA derivada, XP, monedas | ✅ |
| Ficha · Maniquí | Casco, cota, espada y escudo en sus slots, en ámbar sobre madera | ✅ |
| Ficha · Inventario | 10 ítems con ícono correcto, en crema sobre madera | ✅ |
| Ficha · Pericias | Competencias y modificadores (Atletismo +5 = FUE +3 + comp. +2) | ✅ |
| Ficha · Hechizos | Íconos por escuela + ranuras de conjuro | ✅ |
| Tablero DM | Party con HP/CA/condiciones, ranuras de Lyra, panel de PNJs | ✅ |
| Comercio | Catálogo del SRD con íconos resueltos, en oscuro sobre pergamino | ✅ |

### Lo más importante: la máscara CSS funciona en ambos temas

El mismo SVG se ve correcto sobre fondo oscuro (maniquí, inventario, tablero) y
sobre pergamino claro (comercio, hoja de personaje), heredando el color del texto
del contenedor. Los PNGs de BG3 no podían hacer esto: eran de color fijo.

### La cascada semántica resiste nombres reales del SRD

En Comercio, contra los nombres que devuelve la API en vivo:

`Scimitar` · `Shortsword` · `Trident` · `War pick` · `Warhammer` · `Whip` ·
`Blowgun` · `Crossbow, hand` · `Crossbow, heavy` · `Longbow` · `Net` ·
`Berserker Axe`

Todos resolvieron al ícono correcto, incluidos los que llegan con coma
(`Crossbow, hand`) y los que no existen literalmente en game-icons y caen por
categoría (`Blowgun` → dardo, `Net` → red de pesca).

### Conjuros por escuela

El cambio de 389 íconos por nombre a 8 por escuela se lee bien porque la escuela
aparece escrita debajo del conjuro:

- Fire Bolt · Magic Missile → Evocación
- Mage Hand → Conjuración
- Prestidigitation → Transmutación
- Shield → Abjuración

---

## Qué NO se verificó

- **Fichas en el tablero.** El seed deja seis tokens en `board_tokens` pero no se
  llegó a confirmar que se dibujen sobre la grilla. Requiere iniciar combate.
- **Plantillas de área de efecto.** Es uno de los hallazgos de nivel 1 de
  [dnd-beyond-comparison.md](./dnd-beyond-comparison.md) y sigue sin captura.
- **Drag & drop del maniquí.** Se vio el estado equipado, no la interacción.
- **Realtime entre dos clientes.** Necesita dos sesiones simultáneas.
- **Taberna y generador de encuentros.**
- **Wizard de creación de personaje**, incluidos los íconos nuevos de trasfondo.

---

## Detalles menores detectados

- Ambos personajes muestran *"Hay 1 elección de clase pendiente"*. Es del seed, no
  de la app: no se completó el estilo de combate del guerrero ni la elección
  equivalente de la maga.
- El scroll de las rutas vive en un contenedor interno con `overflow-y-auto`, no en
  `window`. Irrelevante para el usuario, pero importante si en la Fase 2 se
  automatizan capturas o tests de UI.
- El árbol de accesibilidad de la página vuelve vacío para las herramientas de
  automatización. Es consistente con el hallazgo de la Fase 3 — 1 atributo `aria`
  sobre 283 `<button>` — y significa que hoy la app es prácticamente opaca para un
  lector de pantalla.

---

## Cómo reproducir el entorno

```bash
supabase start          # levanta el stack en Docker
supabase db reset       # aplica las 17 migraciones + seed.sql
pnpm dev
```

`.env.local` apunta la app al stack local y tiene prioridad sobre `.env`; borralo
para volver a cloud. Está cubierto por `*.local` en `.gitignore`.

### Cuentas del seed

Contraseña única: `taberna123`

| Email | Rol |
|---|---|
| `martita@taberna.test` | DM de *La Maldición de Aguasprofundas* |
| `thorin@taberna.test` | Thorin Escudoférreo (guerrero) y Pip Dedoligero (pícara) |
| `lyra@taberna.test` | Lyra Cantavientos (maga) |

### Rutas útiles para capturar

| Pantalla | Ruta |
|---|---|
| Ficha con maniquí equipado | `/characters/bbbbbbbb-0000-0000-0000-000000000001` |
| Ficha de la maga (conjuros) | `/characters/bbbbbbbb-0000-0000-0000-000000000002` |
| Tablero del DM | `/campaigns/aaaaaaaa-0000-0000-0000-000000000001/tablero` |
| Comercio | `/campaigns/aaaaaaaa-0000-0000-0000-000000000001/comercio` |

---

## Para el README y el video

Las capturas de esta verificación se tomaron a 1600×900 dentro de la sesión de
trabajo y no se versionaron. Para el README conviene rehacerlas a resolución
completa; las tres que más muestran de un vistazo son:

1. **La ficha de Thorin** — pergamino, maniquí equipado e inventario en una sola
   toma. Es la pantalla que mejor comunica el proyecto entero.
2. **La pestaña de conjuros de Lyra** — ranuras, escuelas y hechizos preparados.
3. **El tablero del DM** — party, PNJs y mapa. Idealmente con combate iniciado y
   una plantilla de área desplegada, que es el hallazgo más fuerte de la
   comparación con D&D Beyond.
