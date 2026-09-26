# New Era — Implementation Plan (local app+DB, cloud files+mail)
**PRD:** v0.3 (Sept 26 2026) · **Design:** v1.1 · **Goal:** prove listed → found → chatted, with app + DB locally, files on R2, mail via Resend/ZeptoMail

How to review: each Step has Goal → PRD IDs → Build → Test locally → Done. Steps run in order. Only R2 + mail need cloud keys; everything else runs on localhost.

---

## Proposed local stack (open to change before Step 0)

| Layer | Choice | Why | Notes |
|---|---|---|---|
| App | Flutter (Android + iOS, one codebase) | offline drafts, image compression, good on low-end Android | React Native is the only approved alternative |
| Web | Vite + React + React Router (static SPA, no Next.js) + tiny Cloudflare Worker for OG tags | `npm run dev` with no Node server, deploys to static hosting; Worker returns dynamic `<meta property=og:* >` for `/s/:slug` so LST-8/WEB-2 still unfurls | routes: `/`, `/s/:slug`, `/chat`, `/admin` (guarded) |
| API | Node 20 + Fastify + Prisma | shares types with web, easy local run | — |
| DB | Postgres 16 via Docker, localhost only | supports multiple-business model later (ACC-8), full-text search for DIS-2 | managed Postgres later, no code change |
| Files | Cloudflare R2 (S3-compatible, cloud) | zero local disk dependency, custom-domain CDN, same key layout in all envs; MinIO kept only as opt-in `offline` compose profile | keys: `business/:id/listing/:id/{orig,feed,thumb}.jpg`, `Cache-Control: public,max-age=31536000,immutable` |
| Realtime | Socket.io in API (message schema frozen) | runs locally | Stream / managed chat, same payload |
| Mail | Resend (primary) or ZeptoMail (budget alt), `EMAIL_PROVIDER=resend|zeptomail|console` | Resend = best DX/logs, ZeptoMail = cheaper at volume; local dev defaults to `console` + Mailhog catcher, staging uses Resend test key | OTP + chat alerts (CHT-6) via same `sendMail()` interface |
| Push | console + in-app badge stub | FCM/APNs need cloud | FCM/APNs in Step 11 |

Monorepo layout:
```
/app      # flutter
/web      # vite react (static) + /worker/og-tags.js (cloudflare worker)
/api      # fastify + prisma/schema.prisma
/infra/docker-compose.yml  # postgres, redis, mailhog (dev catcher only)
```

Tokens from `Docs/New-Era-Design-System.md` are hardcoded once: `app/lib/theme.dart` mirrors `:root`, `web/styles/tokens.css` imports it verbatim.

---

## Step 0 — Local foundation
**Goal:** anyone clones and runs in 10 min.
**PRD:** §6.2 (offline, server-side config, localization-ready)

Build:
- [ ] `infra/docker-compose.yml`: postgres, redis, mailhog (dev catcher only — no minio by default)
- [ ] `api/.env.example`: `DATABASE_URL`, `APP_URL=http://localhost:5173`, `STORAGE_DRIVER=r2`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=newera`, `R2_PUBLIC_URL=https://img.yourdomain.com`, `EMAIL_PROVIDER=console`, `RESEND_API_KEY=`, `ZEPTOMAIL_TOKEN=`, `OTP_MODE=console`
- [ ] `api/prisma/schema.prisma` empty + migrate pipeline
- [ ] `app` + `web` boot with theme tokens (light/dark, Inter variable font bundled in app, self-hosted woff2 in web per §1.5)
- [ ] `server_config` table: `status_per_day=5`, `discovery_min_items=3`, `video_max_sec=180`
- [ ] R2 bucket + custom domain connected, CORS allows `localhost:5173` for direct uploads; Worker route for `/s/:slug` OG tags stubbed

Test locally:
```
docker compose -f infra/docker-compose.yml up -d
cd api && npm i && npx prisma migrate dev && npm run dev
cd web && npm i && npm run dev   # vite on :5173
cd app && flutter run
```

Done: compose green, app opens, web `localhost:5173` renders, R2 test upload returns public URL, dark toggle follows system.

---

## Step 1 — Data model + migrations
**Goal:** ACC-8-ready schema (1 business/account now, N later).
**PRD:** ACC-8, ONB-5, DIS-7, ANA-1

Tables: `accounts`, `profiles`, `businesses` (owner FK, slug unique, country, category, area, delivery_area), `listings` (type product/service, price, currency, availability, photos[]), `collections`, `statuses` (expires_at), `threads`, `messages`, `reports`, `support_threads`, `events`, `server_config`.

Key constraints:
- `businesses.slug` unique, `listings.photos[1..5]`
- discovery eligibility = view, not column: `>=3 photos + category + location`
- `messages` store provider-agnostic fields: `thread_id, sender_id, body, image_key, listing_id, created_at`

Done: `npx prisma migrate dev` clean, seed creates 3 demo businesses (Lagos tailor, Accra salon, Nairobi cakes).

---

## Step 2 — Auth + country + mode switch
**Goal:** sign-in with code, explicit country, customer/business modes.
**PRD:** ACC-1..ACC-8

API: `POST /auth/request-code`, `POST /auth/verify`, `GET /me`, `PATCH /me/country`, rate-limit (ACC-6, Redis or memory).
Local OTP: `EMAIL_PROVIDER=console` logs code + `GET /dev/otp?to=...`; set `EMAIL_PROVIDER=resend` with test key to see real delivery in Resend logs / Mailhog catcher.

App: sign-in → country picker (suggest from SIM/device, never infer from email) → mode switch (ACC-3, remembers last) → preview-as-customer (ACC-7) + self-chat block.

Done: new user verified in <60s locally, country change persists, cannot message own store.

---

## Step 3 — Onboarding → live storefront link
**Goal:** live shareable link in ~5 min (ONB-1).
**PRD:** ONB-1..ONB-10, WEB-1..WEB-5

Flow: basics (name/category/location, optional logo → generated avatar) → first listing → you're-live (copy link + share sheet + QR) → checklist + `add N more to appear in discovery` (ONB-6) + offline resume (ONB-8).

Web: `/#/s/:slug` public (Vite SPA hash route for local), production canonical `GET /s/:slug` served via Worker with SSR meta, no login, no exact address unless opted-in (LST-12/WEB-5), rich preview meta via Worker (WEB-2), `Discover more` prompt (WEB-4).

Done: publish → `http://localhost:5173/#/s/mama-cakes` opens in incognito (prod: `/s/mama-cakes` unfurls via Worker), link works immediately, <3 items = live but hidden from discovery.

---

## Step 4 — Listings (products + services)
**Goal:** <30s listing, inquiry-only services.
**PRD:** LST-1..LST-12

API: `CRUD /businesses/:id/listings`, `POST /uploads/presign` (API returns R2 presigned PUT → app/web uploads direct to R2, then `POST /uploads/complete` stores key), availability toggle + `still available?` job stub.
App: camera-first form (1–5 photos, name, price collapsed optionals), Product/Service toggle (starting-from, what's-included, work gallery), bulk-add → drafts, share-to-New-Era intent, on-device compression + retry queue (LST-9).
Service brief (LST-3): date/area/budget/notes → prefills first chat message.

Done: airplane-mode draft → reconnect auto-uploads, share link unfurls photo+name+price in chat app.

---

## Step 5 — Discovery (country-scoped, fair)
**Goal:** find businesses you didn't know.
**PRD:** DIS-1..DIS-8 (DIS-9..11 deferred to phase 2), CUS-9

API: `GET /discover?q=&category=&area=&in_stock=&price=&delivery=` — `WHERE country=:user_country`, rank: relevance + proximity + completeness + freshness + responsiveness (DIS-4), no followers/likes (DIS-5), new-business boost + rotation (DIS-6). Thin results: widen area → related → notify-me + log unmet query as demand.

App/web: Discover page browsable without account (CUS-9), login walls only at first chat.

Done: seed + filter returns Lagos businesses for NG user first, empty query shows fallback not blank, no popularity field anywhere.

---

## Step 6 — Chat (app + web, same history)
**Goal:** the MVP loop closes here.
**PRD:** CHT-1..CHT-10 (text+images only)

API: `POST /threads (listing_id?)`, `GET /threads`, `WS /chat` + `POST /messages {text,image_key}`, quick-replies/business-hours/away (CHT-5), `first_reply_at` for metrics.
App: business inbox (unread, CHT-5), chat from product card (CHT-3) shows context header, report/block (CHT-7).
Web: lightweight code sign-in → chat without install (CHT-4), same thread appears in app after install. Support thread `New Era Support` (CHT-8).
Alerts: `sendMail()` via Resend/ZeptoMail (CHT-6) with reopen link; local `console` mode logs + Mailhog shows it. No WhatsApp links (CHT-1).

Done: customer web chat → owner app reply <10s locally, history identical both sides, images load <100KB via compressed variants.

---

## Step 7 — Status + Updates tab
**Goal:** lightweight demand signal, no popularity contest.
**PRD:** STA-1..STA-9 (STA-7/10 video deferred), CUS-5..CUS-8

API: `POST /statuses {photo|text+bg}` (5/day enforced from `server_config`), `expires_at=+24h`, templates (STA-4), `Share as status?` on restock (STA-5), export-as-image stub (STA-6).
App Updates: chatted-last-60-days first (per decision log), then nearby, hide action, no notifications by default (CUS-6), no likes/counts (STA-8/CUS-8).

Done: 6th post/day rejected locally, expired statuses vanish, no view counts in UI or API.

---

## Step 8 — Customer shell
**Goal:** Chats home, empty-state drives discovery.
**PRD:** CUS-1..CUS-10

Three tabs + top search. Chats ordered recency (CUS-2), empty state = search prompt + category shortcuts (CUS-3). Business-from-chat → profile/products (CUS-4). Notification permission only after first chat (CUS-10).

Done: fresh account sees empty Chats → tap search → Discover → chat → Chats populated.

---

## Step 9 — Trust, admin, help
**Goal:** shippable beta safety net.
**PRD:** TRU-1,2,5,6,7; HLP-1..3; CUS-9 gate

- Report/block on profiles/listings/statuses/chats → `reports` queue
- `web/admin`: moderation queue, take-down, account/business lookup, support reply (TRU-1)
- Prohibited-items page (static, TRU-2), private post-chat nudge `Did you get a reply?` (TRU-6, feeds ranking not stars), cross-border caution sheet (TRU-7)
- Help: per-step guides + searchable center + support chat (HLP-1), hours display (HLP-2), `help_opened {step}` event (HLP-3)

Done: report → appears in `/admin` → hide → gone from Discover + storefront, all without restart.

---

## Step 10 — Free Insights + events
**Goal:** private value proof, premium trigger measurable (§8).
**PRD:** ANA-1..ANA-4, PRM-2/3, §4.1 Insights

Events (ANA-1): onboarding steps, first listing, go-live, discovery-eligible, search, storefront view, chat started, first reply, status post — `POST /events`, no public counts (ANA-2).
Owner Insights (ANA-3, free): storefront views, listing views, chats started, status views, 7/30d. Premium (ANA-4) only stubbed behind flag.

Done: demo business shows 7-day chart locally, events visible in admin, zero public metrics.

---

## Step 11 — Local hardening → beta-ready
**Goal:** survive weak networks + budget phones; R2 + mail already cloud.

- [ ] Image variants (thumb 20KB, feed 80KB), lazy lists, cached Discover, offline queue E2E
- [ ] App size audit, cold start <3s on reference budget Android
- [ ] Light/dark contrast re-check (§1.3), 44/48px targets, font `swap` verified on throttled 3G
- [ ] Rate-limit + disposable-email block live, seed + reset scripts, staged rollout notes (§6.2)
- [ ] R2 CORS + `Cache-Control` + custom domain verified, Worker OG tags pass WhatsApp/Telegram unfurl test
- [ ] Resend (or ZeptoMail) domain verified, `sendMail()` failover to console logged

Exit criteria (PRD §8, no guessed targets): measure time-to-first-item, % live, % discovery-eligible, % with weekly chat, median first-reply, link-to-chat conversion — record baselines locally, set beta targets after prototype tests.

Explicitly deferred (do not build): DIS-9/10 remote-all-countries, TRU-3/4 verified docs, ratings (TRU-5), PRM billing, video (STA-7/10), voice notes, payments, promoted, staff seats, web business dashboard, i18n beyond English strings-externalized.

---

## Review checklist for you

- [ ] Stack OK? (Flutter + Vite React + Node + Postgres local, R2 cloud, Resend/ZeptoMail)
- [ ] Step order OK? (auth → onboarding → listings → discovery → chat → status → shell → trust → insights)
- [ ] Anything in Steps 0–10 you want cut to protect the loop?
- [ ] Confirm seed markets (e.g. Lagos/Accra/Nairobi) + categories for Step 1

Once approved, build starts at Step 0 and each step merges to `main` with `Step N: ...` commits.
