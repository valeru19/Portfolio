# Frontend (Vite + React + TypeScript)

## Install

```bash
cd frontend
npm ci
```

Use `npm ci` (not a bare `npm install` without lock) so CI and local installs match `package-lock.json`. That file is committed on purpose.

### esbuild / Vite postinstall

On some machines npm may ask to approve an `esbuild` (or Vite-related) **postinstall** script. Building this project needs that native binary, so **allow the postinstall** when prompted (or configure your npm client to allow scripts for this repo). Leaving it blocked can make `vite` / `vitest` fail with missing binary errors even though the scaffold itself is fine.

We do **not** use `npm audit fix --force` here: it can jump major versions and break the stack.

### Current `npm audit`

`npm audit` is clean after bumping Vitest to **4.1.12**.

Why not stay on 3.x: latest `3.2.7` still pulls `tinypool@1.1.1` and a vulnerable `@vitest/mocker`; there is no patched `tinypool` 1.x, so a major Vitest bump was required. `4.1.12` drops `tinypool` and includes mocker fixes from `4.1.11`/`4.1.12`. Vitest 5 was not needed.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
```

## Layout

- `src/` — FSD React app
- `public/assets/` — logos for the new app
- `legacy/` — previous single-file landing (kept until acceptance); its own `legacy/assets/` copy
- Env: copy `.env.example` → `.env` (`VITE_API_BASE`, `VITE_SITE_URL`)

`vite.config.ts` sets `base: "/Portfolio/"` for GitHub Pages.
