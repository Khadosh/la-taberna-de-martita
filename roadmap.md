# 🗺 Roadmap — Tavern App

> Seguimiento de hitos y tareas pendientes para el desarrollo de la companion app de D&D 5e.

---

## 🚀 Próximos pasos

- [x] Scaffold SPA (Vite + TanStack Router file-based)
- [x] Instalar dependencias: TanStack Query/Form, Supabase, Sentry, Drizzle dev
- [x] `.env` con Supabase URL + anon key
- [x] `src/lib/supabase.ts` — cliente singleton
- [x] QueryClient cableado en `main.tsx` + context en router
- [ ] Configurar Supabase Auth (email/password, magic link)
- [ ] Tabla `profiles` + RLS básico
- [x] Schema Drizzle + primera migración (`drizzle-kit push`)
- [ ] Auth flow: login, registro, redirect post-login
- [ ] Rutas protegidas (guard con sesión Supabase)
- [ ] Wrapper dnd5eapi + primeras queries con TanStack Query
- [ ] Wizard de creación de personaje (pasos 1–5)
- [ ] Hoja de personaje (vista + edición)
- [ ] Notas de sesión
- [ ] Integrar módulo de dados existente
- [ ] Hechizos en personaje (paso 6 del wizard)
- [ ] Sentry configurado y probado

---

*Última actualización: Schema Drizzle definido*
