---
description: Launches the La Taberna de Martita dev server (Vite SPA) and takes a screenshot via Playwright for visual verification.
---

# Run skill — La Taberna de Martita

## Problem

The system shell uses Node 18 (system default). Vite 8 requires Node ≥ 20.19. Must use Node from nvm.

## Launch

```bash
PATH="$HOME/.nvm/versions/node/v20.18.3/bin:$PATH" pnpm dev > /tmp/vite-taberna.log 2>&1 &
sleep 7
grep -E "Local:|error" /tmp/vite-taberna.log
```

Port is usually 5173 (5174 if 5173 is in use).

## Playwright is not available

There is no playwright or chromium-cli installed globally or in the project. To take screenshots, the user must open the browser manually. Ask the user to verify at `http://localhost:5174/` (or 5173).

## Teardown

```bash
kill $(lsof -ti:5173,5174) 2>/dev/null
```
