# New Era — Session Handoff
_Last updated: Sept 2026. Read this first, then `git log --oneline -8`._

## What this is
Mobile (Expo + React Native, Android + iOS) + web storefront platform for
small businesses. MVP loop: business lists itself → gets found → receives
real chat inquiries. PRD v0.3 + Design v1.3 + build plan live in `Docs/`.

## Stack (all decided, see PRD §6.2 + decision log)
- App: React Native + Expo (Expo Go for testing) · Web: Vite SPA (`web/`)
- API: Node + Fastify + Prisma, Postgres 16 + Redis via `infra/docker-compose.yml`
- Files: Cloudflare R2 (keys in `api/.env`, NEVER committed) with local
  `Docs/images/` fallback · Mail: console/Mailhog dev, ZeptoMail at beta
- Chat: own Socket.io-style endpoints now (Stream in Phase 2, schema matches)

## What works (all verified on a Samsung S22 + Expo web)
- OTP auth (email-first, 49 SSA countries, dial codes), customer/business modes
- Discover (country+city), storefront (cover, grid, certs, report, preview mode),
  listing detail + swipeable galleries, chat with dish tags, Updates + viewer +
  composer, business home + Insights, listings CRUD, onboarding wizard,
  certificates, profiles/avatars/bios/covers, drawer nav, dark mode,
  settings/FAQ, intro splash (plays once)
- Static previews in `Docs/` (deployed to Netlify for assessment)

## Local run (3 terminals, keep open)
1. `docker compose -f infra/docker-compose.yml up -d` then `cd api && node src/index.js`
2. `cd app && npx expo start` (phone) or `npx expo start --web` (`:8081`)
3. `cd web && npm run dev` (`:5173` or next free port)
- API env: copy `api/.env.example` → `api/.env`. `app/app.json` → `extra.apiUrl`
  must be the PC's LAN IP for physical phones (`10.0.2.2` = emulator only).
- shorthand: user says `docker running` = DB up; `keys in` = R2 keys saved.

## Repo conventions (follow strictly)
- One concern per commit, `git push` after every fix; NEVER commit `.env`,
  `node_modules/`, `Docs/images/uploads/`, `Docs/checks/`, phone screenshots.
- Typecheck app before push: `node node_modules/typescript/bin/tsc --noEmit`
  from `app/`; API: `node --check api/src/<file>` from root.
- PowerShell 5.1: no `&&`/`||`, use `npm.cmd`/`npx.cmd` full paths, quote paths.
- `npx`/`px`/`tsc` bare names resolve to wrong packages — always qualify.
- Edit tool often reports false "not found" while actually applying: ALWAYS
  re-grep before retrying an edit.
- User tests on S22 + Chrome/Expo Go, reads terminal output, pastes console
  errors; screenshots go to `Docs/checks/` (git-ignored) for me to read.

## Known recurring issues (check FIRST on any failure)
1. DB containers stopped (sleep/reboot) → `docker compose up -d`. Symptom:
   OTP "invalid", 500s on any write.
2. Stale bundle — user must RELOAD Expo Go / hard-refresh browser.
3. Old API process on :4000 — kill by port, restart fresh.
4. npm registry route from here is unusable (200s+/file) — user runs all
   installs (`expo install …`) themselves; never `npm audit fix --force`.

## Suggested next slices (in order)
1. Business onboarding polish (progress already in; QR share edge cases)
2. Web chat (Step 6 web side) + Discover page on Vite site
3. PWA packaging for the Vite site (manifest + icons + SW)
4. R2 custom domain + ZeptoMail domain verify (needs purchased domain)
5. Pick-list attachment (Phase 2, already in PRD roadmap)
