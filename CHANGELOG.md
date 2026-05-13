# Changelog — La Taberna de Martita

Todos los cambios notables ordenados cronológicamente.

---

## [0.5.0] — 2026-05-13 · Producción & dominio custom

- Deploy en Vercel (`la-taberna-de-martita.vercel.app`)
- Dominio custom `la-taberna-de-martita.quest` vía Porkbun
- Email transaccional con Resend + dominio custom
  - SPF, DKIM, DMARC configurados
- Recovery de contraseña funcional vía email
- Fix: SPA 404 en refresh — `vercel.json` con rewrite a `index.html`

---

## [0.4.0] — 2026-05-13 · Pantalla de DM

- Nueva ruta `/campaigns/:id/session` (solo GM)
- Panel izquierdo: personajes del party con HP optimista, condiciones
- Tracker de iniciativa: agrega jugadores y NPCs, ordena por iniciativa, turno resaltado
- Input rápido de NPCs: `"Goblin 25"` → Enter (nombre + HP, iniciativa auto-roll)
- Edición inline de HP e iniciativa de NPCs
- Notas de sesión con guardado automático (debounce 1.5s) a tabla `session_notes`
- HP optimista en pantalla DM: igual que personaje, 600ms debounce al backend
- Botón "Pantalla DM" en la vista de campaña (solo visible para GM)

---

## [0.3.0] — 2026-05-13 · Hoja de personaje completa

### Estética
- Rediseño total: estilo pergamino antiguo con bordes quemados
- Fuente serif, fondo crema con gradiente radial, sombras internas

### Retrato
- Subir imagen propia (FileReader → Supabase Storage)
- Generar con IA: fal.ai `flux/schnell` vía Supabase Edge Function
  - Prompt automático basado en raza/clase/nombre
  - API key guardada en Supabase Secrets (nunca expuesta al cliente)

### Estado de combate
- HP actual con +/− optimista (600ms debounce al backend)
- CA (Armadura)
- Barra de XP con umbrales por nivel (1–20), botón de subir nivel
- 17 condiciones D&D 5e en español, badges removibles

### Inventario
- Tabla con nombre, cantidad, peso, notas
- Capacidad de carga basada en FUE (`STR × 15 lb`)
- Catálogo de equipamiento de D&D 5e API con búsqueda fuzzy
- RLS: dueño escribe, miembros de campaña leen

### Modales de info
- Hechizos: descripción completa, nivel, escuela, componentes
- Rasgos raciales: descripción de la API
- Pericias: descripción + atributo asociado

---

## [0.2.0] — 2026-05-13 · Campañas & personajes base

- Dashboard con personajes propios, campañas como GM y como jugador
- Creación de campaña (nombre)
- Invite link por campaña (`/join/:id`)
- Vista de campaña: jugadores, personajes, botón copiar invite
- Asignar personaje a campaña desde la hoja
- RLS: GM ve todos los personajes de su campaña; jugadores ven los de sus campañas
- Política para que el GM pueda actualizar HP/condiciones de personajes ajenos

---

## [0.1.0] — 2026-05-13 · Wizard de creación de personaje

- Wizard multi-paso integrado con D&D 5e API:
  1. Nombre y raza (rasgos raciales desde API)
  2. Clase (hit die, proficiencias, equipo inicial)
  3. Stats (método point-buy o tirada, valores sugeridos por clase)
  4. Trasfondo (descripción libre)
  5. Hechizos (clases con magia, búsqueda por nombre)
- Guarda en tabla `characters` con `sheet_json` flexible

---

## [0.0.1] — 2026-05-12 · Auth & setup

- Vite + React 19 + TanStack Router (file-based) + TanStack Query
- Supabase JS client, RLS base, tipos generados
- Login, registro, recuperación de contraseña
- Rutas protegidas con guard de sesión
- Husky + commitlint (conventional commits)
- Schema inicial: `profiles`, `campaigns`, `campaign_players`, `characters`, `character_inventory`, `session_notes`
