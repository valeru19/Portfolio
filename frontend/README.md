# Frontend (Vite + React + TypeScript)

## Install

```bash
cd frontend
cp .env.example .env
npm ci
```

Use `npm ci` (not a bare `npm install` without lock) so CI and local installs match `package-lock.json`.

### esbuild / Vite postinstall

On some machines npm may ask to approve an `esbuild` (or Vite-related) **postinstall** script. Building this project needs that native binary, so **allow the postinstall** when prompted. Leaving it blocked can make `vite` / `vitest` fail with missing binary errors.

Do **not** use `npm audit fix --force`: it can jump major versions and break the stack.

### Vitest

Current: **4.1.12** (latest within major 4). `npm audit` is clean. Vitest **5** is a major jump — not applied here.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
```

## Env

| Variable | Role |
| --- | --- |
| `VITE_API_BASE` | API origin. Empty → form/review sections hidden. |
| `VITE_SITE_URL` | Canonical site URL for SEO tags injected at build time. |

## Layout

- `src/` — FSD React app (`app`, `pages`, `widgets`, `features`, `shared`)
- `public/` — static assets (logos). Optional `og-image.png|jpg|webp` for Open Graph
- `vite-plugins/htmlSeo.ts` — injects meta / OG / canonical / JSON-LD into `dist/index.html`
- `legacy/` — previous single-file landing (kept until you verify and delete)
- `vite.config.ts` — `base: "/Portfolio/"` for GitHub Pages

CI and Pages: see root `DEPLOY.md` and `.github/workflows/frontend.yml`.

## First publish checklist

1. GitHub → **Settings → Pages → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables**:
   - `VITE_SITE_URL=https://valeru19.github.io/Portfolio`
   - leave `VITE_API_BASE` empty for the first deploy (forms stay hidden).
3. Push `main` and wait for the workflow; open the Pages URL.
4. When the backend is ready:
   - serve the API over **HTTPS** only (GitHub Pages cannot call plain `http://`);
   - set backend `CORS_ORIGINS=https://valeru19.github.io` (no `/Portfolio` path);
   - set repo var `VITE_API_BASE` to that HTTPS API URL and redeploy;
   - forms also need a visible reply contact in `contacts.ts` (email, else Telegram, else LinkedIn).
