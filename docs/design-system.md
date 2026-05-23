# La Taberna de Martita — Sistema de Diseño y Coherencia Visual

Este documento define la **Dirección de Arte** y los lineamientos de diseño visual para el proyecto, configurados a través de **Tailwind CSS v4** en `src/styles.css`. 

> [!IMPORTANT]
> **Regla de oro para IAs:** Todas las futuras modificaciones o adiciones de interfaces de usuario DEBEN adherirse estrictamente a estas pautas visuales y utilizar los tokens semánticos aquí descritos en lugar de introducir estilos en línea o colores arbitrarios.

---

## 🎨 1. Dirección de Arte y Estética Visual

La estética del companion es medieval/fantasía premium (inspirada en la interfaz clásica de juegos de rol de mesa). Se estructura en dos metáforas visuales principales:

### A. La Mesa de Juego (Estética Oscura/Taberna)
*   **Concepto:** El tablero de madera oscura sobre el cual se disponen los componentes de juego.
*   **Cuándo usar:** Fondo global de la campaña, dashboard principal, login, pantalla del DM, y bordes/maniquíes de inventario.
*   **Tokens del Tema (Tailwind v4):**
    *   Fondo base: `bg-tavern-stone` (`#0c0a09`) o la textura global `bg-table-wood` (madera real).
    *   Paneles secundarios: `bg-tavern-wood-dark` (`#180e06`) o `bg-tavern-wood-black` (`#0f0804`).
    *   Detalles de bronce/oro: `text-tavern-gold` (`#d5b88a`) y `text-tavern-gold-light` (`#f5d9a8`).
    *   Brillo del fuego: `text-tavern-amber` (`#fbbf24`).
    *   Efecto de profundidad: `shadow-tavern-depth` y brillo perimetral cálido `shadow-tavern-glow`.

### B. Los Documentos de Aventura (Estética Clara/Pergamino)
*   **Concepto:** Las hojas de papiro, mapas e informes técnicos que los aventureros consultan.
*   **Cuándo usar:** Pestañas de la hoja de personaje (Resumen, Pericias, Hechizos, Historia), compendios (Bestiario, Spellbook), notas de sesión e informes del party.
*   **Tokens del Tema (Tailwind v4):**
    *   Fondo de papiro técnico: Clases unificadas `bg-parchment-grid` (degradado pergamino con una cuadrícula sepia de 24px) y `bg-papyrus-texture` (textura de papiro real con blend modo multiply).
    *   Textos: Utilizar colores de alto contraste que parezcan tinta sepia, como `text-parchment-chocolate` (`#6b4c24`) o `text-parchment-sienna` (`#7a5828`). **Evitar el negro puro (#000) o grises modernos sobre el papiro.**
    *   Bordes de papiro: `border-parchment-sienna/40`.
    *   Pills activos en pergamino: `bg-amber-900 text-amber-100 border-amber-800`.
    *   Pills inactivos en pergamino: `bg-transparent text-stone-700 border-stone-400/40`.

---

## ✍️ 2. Tipografía Semántica

*   **Títulos Narrativos / Display:** Clase `font-display` (fuente `Cinzel`, serif).
    *   *Uso:* Títulos de secciones, nombres de hechizos, nombres de personajes y encabezados principales en mayúsculas (`uppercase tracking-wider`).
*   **Textos descriptivos / Formularios:** Clase `font-serif` (fuente `Georgia`, serif).
    *   *Uso:* Descripciones de rasgos de clase, notas, backstory, descripciones de tiendas.
*   **Matemáticas de Juego / Datos del Sistema:** Clase `font-mono` (monospace).
    *   *Uso:* Puntos de golpe (HP), clase de armadura (CA), modificadores de características (ej: `+3`), distancias en pies (ej: `30 ft`), y niveles. Esto ayuda a separar el lore narrativo de los datos estadísticos.

---

## 📦 3. Patrones de Componentes en Código

### Botón Primario Rústico (Estilo Fuego/Chimenea)
Para acciones importantes (ej: "Guardar", "Consumir", "Crear"):
```tsx
<button className="px-4 py-2 font-serif text-sm tracking-wider uppercase border border-[#6B2C06] bg-gradient-to-b from-[#9B4A10] to-[#7B3408] text-[#f5d9a8] rounded-sm transition-all hover:brightness-110 active:scale-[0.98]">
  {children}
</button>
```

### Botón Secundario (Estilo Pergamino/Madera)
Para acciones de cancelación o secundarias:
```tsx
<button className="px-3 py-1 font-serif text-xs bg-stone-900 border border-stone-850 text-tavern-gold hover:bg-stone-800 transition-colors">
  {children}
</button>
```

### Campos de Entrada (Inputs)
*   **En Temas Oscuros (Mesa):** `bg-white/[0.04] border border-tavern-gold/30 rounded-sm text-stone-200 focus:border-tavern-gold/80 focus:bg-white/[0.08] focus:outline-none transition-all`
*   **En Temas Claros (Pergamino):** `bg-amber-50/50 border border-parchment-sienna/40 rounded-sm text-stone-950 focus:bg-white focus:outline-none transition-all`

---

## 🔒 4. Gotchas de Desarrollo

1.  **Evitar el mix CSS/React:** No usar estilos en línea (`style={{ backgroundColor: ... }}`) para paletas de colores del tema. Utilizar las clases semánticas indicadas en este manual.
2.  **Bordes y colores en Tailwind v4:** Recuerda que en v4, la clase `border` sin color explícito hereda `currentColor` del texto padre. Siempre especifica el color de borde usando clases del tema (ej: `border-parchment-sienna/40` o `border-stone-800`).
3.  **Scrolls:** El fondo `bg-table-wood` debe ser fijo a nivel de layout de campaña para evitar que la mesa de madera se mueva al hacer scroll en los outlets.
