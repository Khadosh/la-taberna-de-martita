---
description: Hace commit y push actualizando CHANGELOG.md y roadmap.md antes de commitear. Usar cuando el usuario quiere commitear y pushear cambios al repo.
---

## Estado actual del repo

!`git status`

## Cambios pendientes

!`git diff HEAD`

## Instrucciones

Seguí estos pasos en orden:

1. **Revisá los cambios** mostrados arriba y presentá un resumen breve al usuario.

2. **Verificá CHANGELOG.md** — debe tener una entrada bajo `## [Unreleased]` que describa los cambios actuales. Si no existe o está desactualizada, actualizala antes de continuar.

3. **Verificá roadmap.md** — si algún ítem fue completado por estos cambios, marcalo con ✅. Si no aplica, dejalo como está.

4. **Corré tipos**: ejecutá `npx tsc --noEmit`. Si hay errores, reportalos al usuario y no continúes con el commit.

5. **Proponé un mensaje de commit** siguiendo Conventional Commits (`feat`, `fix`, `style`, `refactor`, `chore`, `docs`) en minúsculas sin punto final. Pedile confirmación al usuario antes de commitear.

6. **Commiteá** con `git add` de todos los archivos modificados (incluyendo CHANGELOG.md y roadmap.md) y luego `git commit`.

7. **Pusheá** con `git push origin main`.

Nunca saltees la verificación del CHANGELOG y el roadmap. Nunca uses `--no-verify`. Nunca pushees sin confirmación explícita del usuario.
