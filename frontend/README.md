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

### Current `npm audit` (devDependencies only)

As of step 2, `npm audit` reports issues only under the **Vitest** toolchain (not production runtime of the site):

| Package | Severity | Notes |
|---------|----------|--------|
| `tinypool` (via `vitest`) | critical | Prototype pollution → RCE in worker options ([GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3), [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr)) |
| `@vitest/mocker` (via `vitest`) | moderate | Path traversal / mock registration ([GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), [GHSA-qxg6-89mg-rqv8](https://github.com/advisories/GHSA-qxg6-89mg-rqv8)) |
| `vitest` | (depends on above) | Fixed upstream in newer Vitest; a clean bump may require Vitest 4.1.11+ / 5.x — do that deliberately later, not with `--force` |

These affect local/CI **test** tooling, not the static site served to visitors.

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
