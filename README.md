# New Era

Mobile app + web storefront platform that helps small business owners go digital.

Owners showcase products and services, chat with customers, and post status updates — similar to WhatsApp Business but simpler. The main differentiator is **customer discovery**: customers can find businesses they don't already know.

> Status: Planning (PRD v0.3, Sept 26 2026). MVP is a closed beta, launching in African countries first.

Full spec: [Docs/New-Era-PRD.md](Docs/New-Era-PRD.md)

## The loop we're proving

**A business lists itself → gets found → receives real chat inquiries.**

Anything that doesn't serve this loop waits.

## Who it's for

* **Business owners:** informal sellers (Instagram/WhatsApp vendors, home businesses), small physical shops, service providers (salons, tailors, caterers, freelancers). Needs fast setup, low-effort listing, works on weak connections and lower-end phones.
* **Customers:** people who want to find a relevant business, message it easily, and trust who they're dealing with.

One account works as both customer and business, with a mode switch. V1: one business per account.

## MVP features

* Email/phone sign-up with code, explicit country selection
* Business onboarding to a live, shareable storefront in ~5 minutes
* Product + service listings (30-sec flow, bulk add, availability toggle, inquiry brief for services)
* Photo/text status updates (5/day, 24h expiry)
* In-app + web chat (business inbox, quick replies, push + email/SMS alerts)
* Customer app: Chats (home), Updates, Discover
* Country-scoped discovery with search, categories, fair ranking (no follows/likes)
* Trust basics: report/block, prohibited-items policy, internal admin tool
* In-app help + analytics from day one
* Free basic Insights for owners (views + chats, last 7/30 days)

Out of MVP: verified tag, ratings/reviews, premium plans (deeper analytics, incl. trends/exports), video status (3 min, phase 2), voice notes, payments/orders, promoted placement, staff seats, web business dashboard.

## Platforms

* Mobile app (Android + iOS, one cross-platform codebase) — business + customer modes
* Public website — storefronts, listing pages with rich previews, web chat (no install needed)
* Internal admin web tool — moderation, accounts, support
* Backend — API + DB + managed services for chat, images/CDN, notifications

Built for real conditions: small app size, data-light, offline drafts, on-device image compression.

## Roadmap

* **Phase 0 Prep:** PRD sign-off, design, prototype tests, pick launch country/cities/categories, recruit first 100+ businesses
* **Phase 1 MVP beta:** closed beta in a small number of places
* **Phase 2 Expand:** verified tag, all-countries remote services, ratings on density, video status, voice notes, premium, more languages
* **Phase 3 Grow:** promoted placement (labeled), staff seats, payments/orders, web dashboard

## Repo layout

```
Docs/
  New-Era-PRD.md  # product requirements, source of truth
```

## Contributing

Private MVP repo. Pick a requirement ID from the PRD (e.g. `ONB-1`, `LST-1`, `CHT-4`) for branch names and commits.
