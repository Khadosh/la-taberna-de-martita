# Roadmap — La Taberna de Martita

> Estado actual: MVP funcional en producción (`la-taberna-de-martita.quest`)

---

## Estado del MVP

| Área | Estado |
|------|--------|
| Auth (login, registro, recovery) | ✅ |
| Dashboard | ✅ |
| Creación de personaje (wizard D&D 5e API) | ✅ |
| Hoja de personaje (stats, hechizos, rasgos, pericias) | ✅ |
| Inventario con peso | ✅ |
| Estado de combate (HP optimista, CA, XP, condiciones) | ✅ |
| Retrato (subir o generar con IA) | ✅ |
| Campañas (crear, unirse por invite) | ✅ |
| Pantalla DM (iniciativa, NPCs, notas de sesión) | ✅ |
| Deploy producción + dominio custom + email | ✅ |

---

## Próximo paso lógico: lo que más duele ahora

### 🎲 Tirador de dados (prioridad alta)
No hay dados. Es una app de D&D sin dados — el gap más obvio.
- Tirador flotante: d4, d6, d8, d10, d12, d20, d100
- Historial de tiradas visible para todos en sesión (via Supabase Realtime)
- El GM ve las tiradas del party en la pantalla DM
- Tiradas con nombre ("Ataque con espada larga 1d20+5")

### 🔄 Realtime en sesión (prioridad alta)
Ahora el HP se sincroniza cada 5 segundos con polling.
- Reemplazar `refetchInterval: 5000` por Supabase Realtime channels
- GM ajusta HP → jugador ve el cambio al instante en su hoja
- Base para el chat y el dado compartido

### 💀 Spell slots (prioridad media)
Los personajes con magia no tienen dónde trackear sus slots.
- Slots por nivel (1–9) con contador de usados / disponibles
- Botón de descanso corto / largo para recuperarlos
- Guardado en `characters.sheet_json` (ya existe el campo)

### ⚔️ Descanso corto / largo (prioridad media)
Mecánica core de D&D 5e que falta completamente.
- Descanso corto: recuperar slots de Brujo, Dados de Golpe
- Descanso largo: recuperar todo el HP y slots
- Disponible desde la hoja de personaje y desde la pantalla DM

### 💀 Tiradas de muerte (prioridad media)
Cuando HP llega a 0:
- Modal con 3 círculos de éxito / 3 de fallo
- Guardado en `characters.sheet_json`
- GM lo ve en la pantalla DM

---

## Mejoras UX que no requieren backend

- **Onboarding**: pantalla de bienvenida para usuarios nuevos (sin personajes/campañas)
- **Móvil**: la hoja de personaje no está pensada para pantalla chica
- **Skeleton loaders**: reemplazar "Cargando..." por placeholders animados
- **Error boundaries**: si una query falla, mostrar mensaje útil en lugar de pantalla rota
- **"Sign out" → "Cerrar sesión"**: el botón está en inglés
- **Navegación**: falta botón "volver" en pantalla DM y en wizard
- **Feedback de guardado**: la hoja no avisa cuándo guardó (solo el HP tiene indicador)

---

## Features más grandes (post-MVP)

### 🗺 Mapas
- Subir imagen como mapa de sesión
- Visible para el party (solo GM puede cambiarla)

### 📖 Bestiario
- Buscar monstruos de D&D 5e API ("Goblin", "Dragon Rojo")
- Agregar al tracker de iniciativa desde el resultado con un click
- Reemplaza el input manual "Goblin 25"

### 💬 Chat de sesión
- Canal de texto por sesión
- GM puede hacer anuncios destacados
- Las tiradas de dado aparecen acá automáticamente

### 📜 Historial de sesiones
- Lista de sesiones pasadas por campaña
- Las notas de sesión quedan archivadas y son consultables

### 🎒 Distribución de loot
- GM crea un "tesoro" con items del catálogo
- Jugadores pueden tomar items y van directo a su inventario

### 📄 Export PDF
- Hoja de personaje exportable como PDF estilo D&D

---

## Deuda técnica

- `CONDITIONS_ES` / `CONDITIONS` duplicado en character sheet y session screen → extraer a `lib/dnd-constants.ts`
- `XP_THRESHOLDS` hardcodeado → mover al mismo lugar
- Sin tests (ni unit ni e2e)
- Sin Sentry (error monitoring — estaba en el roadmap original)
- Sin GitHub Actions CI (deploy es manual via push a main)
