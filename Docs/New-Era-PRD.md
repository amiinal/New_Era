# New Era

**Product Requirements Document**

| Item | Detail |
| --- | --- |
| Version | 0.3 (draft for review) |
| Date | September 26, 2026 |
| Status | Planning |
| MVP platforms | Android, iOS (one cross-platform codebase), and web |
| Launch market | African countries first; specific countries, cities, and categories still to be decided |

**How to read this document.** Items marked **Decided** were confirmed by the product owner during planning. Items marked **Proposed** are recommendations that still need confirmation. Requirement IDs are for reference in design, engineering, and testing.

## 1. Overview

### 1.1 Summary

New Era is a mobile app and web storefront platform that helps small business owners go digital. Owners showcase their products and services, talk to customers with ease, and post updates and status, similar to WhatsApp Business but simpler and more seamless. Its main differentiator is **customer discovery**: customers can find businesses on the platform.

### 1.2 Problem

Small business owners are going digital and need one platform where they can easily showcase what they sell, talk to clients, and post updates, without stitching together chat apps, social media, and photo galleries. Customers, meanwhile, have no simple place to find businesses they do not already know.

### 1.3 Vision

A simple, fair, and fast place for any small business to be found and to talk to its customers.

### 1.4 MVP goal

Prove one loop: **a business lists itself, gets found, and receives real chat inquiries from customers.** Anything that does not serve this loop waits.

## 2. Users

### 2.1 Business owners

A mix of informal sellers (Instagram or WhatsApp vendors and home businesses), small physical shops with staff, and service providers (salons, tailors, caterers, freelancers). They need fast setup, low-effort listing, reliable reach to customers, and an app that works on weak connections and lower-end phones.

### 2.2 Customers

People who want to find a relevant business, message it easily, and trust who they are dealing with.

### 2.3 One account, two modes

A single account works as both customer and business, with a switch between the two modes (Decided). Version 1 allows one business per account; the data model should allow multiple businesses and staff roles later (Proposed).

## 3. Product principles

- **Fair by design.** No follows, likes, or public popularity metrics, so every business has a chance. Quality decides visibility, and ratings once there is enough density.
- **Discovery is the differentiator.** Customers can find businesses on the platform.
- **Fast time to value.** A live, shareable storefront within about five minutes of opening the app.
- **Built for real conditions.** Weak connections, limited data, and lower-end phones.
- **Buy before build.** Use managed services for chat and image delivery (and video later) where possible.
- **Stay focused.** Prove one loop before adding features.

## 4. Scope and roadmap

### 4.1 In the MVP

- Sign-up with email or phone, explicit country selection, and one account with customer and business modes.
- Business onboarding to a live storefront, with a shareable web link.
- Product and service listings (fast flow, bulk add, availability toggle, service inquiry brief).
- Status updates as photo or text, up to 5 per day.
- In-app chat and web chat, with business inbox, quick replies, and reliable message alerts.
- Customer app with Chats, Updates, and Discover; country-scoped discovery with search and categories.
- Trust and safety basics: report and block, prohibited-items policy, and an internal admin tool.
- In-app help (guides, help center, support chat) and analytics events from day one.
- Free basic Insights for business owners (views and chats started, last 7/30 days).

### 4.2 Not in the MVP

- Verified business tag with document review (phase 2).
- All-countries visibility for remote services (proposed for phase 2).
- Ratings and reviews (once density is reached).
- Premium plans (after businesses are clearly getting value).
- Video status (up to 3 minutes), planned for phase 2 to keep the MVP lean.
- Voice notes, payments and orders, promoted placement, staff seats, a web dashboard for businesses, and additional languages.

### 4.3 Roadmap

| Phase | Focus |
| --- | --- |
| Phase 0: Prep | PRD sign-off, design, prototype tests with business owners, choose the launch country, cities, and categories, and recruit the first businesses. |
| Phase 1: MVP beta | The scope in section 4.1, released as a closed beta in a small number of places so density, support, and moderation can be managed. |
| Phase 2: Expand | Verified business tag, all-countries remote services, ratings once density is reached, video status (up to 3 minutes), voice notes, pick-list attachment (multi-item inquiry from the store, no checkout), premium (when value is proven), and more languages as markets require. |
| Phase 3: Grow | Promoted placement (clearly labeled), staff seats, payments and orders, and a web dashboard for businesses. Sponsored area placements: labeled in-status ads (promo/event), area-targeted, in-app links only at first, customer reshare with attribution, max 3 active per business per city, swipable where multiple. |

## 5. Functional requirements

### 5.1 Accounts and sign-up (ACC)

| ID | Requirement | Status |
| --- | --- | --- |
| ACC-1 | Sign-up requires an email address or a phone number, verified with a one-time code. | Decided |
| ACC-2 | Country is selected explicitly at sign-up (suggested from the phone country code or device where available) and can be changed. It cannot be inferred from an email address. | Proposed |
| ACC-3 | One account works as both customer and business, with an always-visible mode switch that remembers the last mode used. | Decided |
| ACC-4 | The entry path decides the first experience: shared storefront links lead to the customer experience; business invitations and a "Start your storefront" action lead to business setup. | Proposed |
| ACC-5 | Every business account has at least one verified contact method (email or phone) so it can receive message alerts. | Proposed |
| ACC-6 | Abuse controls: block known disposable email domains, rate-limit sign-ups and codes, and rate-limit new accounts that message many businesses. | Proposed |
| ACC-7 | A business cannot chat with, review, or otherwise interact with its own storefront as a customer. A "preview as customer" view is provided instead. | Proposed |
| ACC-8 | One business per account in the MVP, with a data model that supports multiple businesses and staff roles later. | Decided |

### 5.2 Business onboarding (ONB)

| ID | Requirement | Status |
| --- | --- | --- |
| ONB-1 | Goal: a live, shareable storefront within about five minutes of opening the app. | Decided |
| ONB-2 | Interactive rather than a tutorial: every step is a real action, and the owner sees their public storefront build in real time. | Decided |
| ONB-3 | Flow: sign-in, business basics (name, category, location; logo optional with a generated avatar), products, services, or both, first listing, a "you're live" moment, then a progressive checklist. | Decided |
| ONB-4 | A personal name may serve as a business name. No business documents are required to go live. | Decided |
| ONB-5 | The storefront link works immediately after publishing. Appearing in discovery requires 3 or more items with photos, a category, and a location. | Decided |
| ONB-6 | Show progress toward discovery (for example "add 2 more items to appear in discovery") and send reminders to owners who stall. | Decided |
| ONB-7 | The "you're live" moment offers one-tap sharing (copy link and the share sheet) and a QR code. | Decided |
| ONB-8 | Progress saves automatically and can be resumed; drafts work offline. | Decided |
| ONB-9 | Services can qualify for discovery through a mix of service listings and portfolio photos (for example one service with three or more work photos). | Proposed |
| ONB-10 | Businesses that serve online or by delivery can set a service or delivery area instead of a physical address. | Proposed |
| ONB-11 | Optional self-reported certificates after onboarding: up to 3, photo required per certificate plus title, issuer, and year. Shown on the storefront under a "Certificates" section labeled "Self-reported — not verified by New Era". No checkmark or verified styling; the Phase 2 verified tag (TRU-3) stays separate. Fake certificates are handled through the normal report flow. | Decided |

### 5.3 Listings (LST)

| ID | Requirement | Status |
| --- | --- | --- |
| LST-1 | Listing takes under 30 seconds: the camera opens, the owner adds 1 to 5 photos, a name, and a price, then publishes. All other fields are optional and collapsed. | Decided |
| LST-2 | Products and services use one form with a Product or Service toggle. Services show "starting from" pricing, "what's included", and a gallery of past work. | Decided |
| LST-3 | Services are inquiry-only in v1 (no in-app booking). A short optional inquiry brief (date needed, area, budget, notes) prefills the first chat message. | Decided |
| LST-4 | Bulk add: select several photos to create draft listings at once. | Decided |
| LST-5 | One-tap availability (in stock, limited, sold out, made to order) with periodic "still available?" reminders. | Decided |
| LST-6 | Price on request and price ranges are allowed. | Decided |
| LST-7 | Collections (for example "New arrivals" or "Cakes") appear as tabs on the storefront. | Decided |
| LST-8 | Every listing and storefront has a shareable link with a rich preview (photo, name, price) that displays well in chat apps and social media. | Decided |
| LST-9 | Built for low bandwidth: on-device image compression, offline drafts, and automatic upload retries. | Decided |
| LST-10 | "Share to New Era": send a photo from the device gallery or another app into a new draft listing. | Decided |
| LST-11 | Listing and photo limits exist as configurable settings but are not enforced at launch. | Proposed |
| LST-12 | Business location is shown at area or neighborhood level; exact addresses are not shown publicly unless the owner chooses to. | Proposed |

### 5.4 Storefront and web (WEB)

| ID | Requirement | Status |
| --- | --- | --- |
| WEB-1 | Each business has a public web storefront with its profile, listings, collections, and current statuses, viewable without an account. | Proposed |
| WEB-2 | Listing pages carry rich link previews (see LST-8). | Decided |
| WEB-3 | Customers on the web can start a chat without installing the app (see CHT-4). | Decided |
| WEB-4 | Web storefronts include a discreet prompt to discover more businesses and an option to open in the app. | Proposed |
| WEB-5 | Web storefronts respect country scope and never expose private data such as exact addresses or personal contact details. | Proposed |

### 5.5 Chat (CHT)

| ID | Requirement | Status |
| --- | --- | --- |
| CHT-1 | In-app chat replaces WhatsApp linking as the way customers contact businesses. | Decided |
| CHT-2 | MVP chat supports text and images. Voice notes and other media come in phase 2. | Proposed |
| CHT-3 | A chat can begin from a product or service card so the business immediately knows what the customer is asking about. | Proposed |
| CHT-4 | Customers arriving from a shared link can chat on the web without installing the app, after a lightweight sign-in (email or phone code). The same account and chat history are available in the app after installation. | Decided |
| CHT-5 | Business inbox with unread counts, quick replies, business hours, and away messages. | Proposed |
| CHT-6 | Reliable notifications: push notifications, plus an email (or SMS for phone-only accounts) when a message is waiting, with a link that reopens the chat. | Proposed |
| CHT-7 | Report and block on every chat and profile, with basic spam protections. | Proposed |
| CHT-8 | Support is delivered as a chat thread with a "New Era Support" account inside the same messaging system. | Proposed |
| CHT-9 | Use a managed chat service with mobile and web SDKs instead of building messaging infrastructure. | Proposed |
| CHT-10 | Response data (time to first reply and reply rate) is measured from in-app chat for use in ranking and analytics. | Proposed |

### 5.6 Status updates (STA)

| ID | Requirement | Status |
| --- | --- | --- |
| STA-1 | Businesses post status updates as a photo or as text on a colored background, at their convenience. Video is deferred to phase 2 to reduce MVP scope. | Decided |
| STA-2 | Each business may post up to 5 statuses per day. The limit is a server-side setting that can change without an app release. | Decided |
| STA-3 | Statuses expire after 24 hours. | Proposed |
| STA-4 | Templates for common updates: New arrival, Back in stock, Sale, Open today or Closed today, Booking slots open. | Proposed |
| STA-5 | Product-linked status: when a listing is added or restocked, prompt "Share as status?" and generate a status with a Message button. | Proposed |
| STA-6 | Statuses can be exported as an image with the business link for sharing in other apps. | Proposed |
| STA-7 | Video status ships in phase 2, with a maximum length of 3 minutes per video. | Decided |
| STA-8 | No likes, view-count leaderboards, or other public popularity metrics on statuses. | Decided |
| STA-9 | Reports on statuses feed the moderation queue. | Proposed |
| STA-10 | When video ships: compress on-device with a file-size cap, use adaptive playback quality (lower by default on mobile data), no autoplay on cellular or in data-saver mode, and add a managed video service. | Proposed |

### 5.7 Customer app structure (CUS)

| ID | Requirement | Status |
| --- | --- | --- |
| CUS-1 | Three tabs: Chats, Updates, and Discover, with a search bar at the top. | Proposed |
| CUS-2 | Chats is the home screen: businesses appear as chat threads so customers can message in one tap, ordered by most recent conversation. | Decided |
| CUS-3 | A brand-new customer with no chats sees an empty chat list with a prominent search prompt. Category shortcuts and a clear route to Discover are recommended additions. | Decided |
| CUS-4 | Opening a business from a chat shows its profile, products, and services. | Decided |
| CUS-5 | Updates and Discover have their own pages: Updates shows statuses, Discover shows search and browsing. | Decided |
| CUS-6 | Updates has two sections: businesses the customer has chatted with appear first, then nearby businesses. No status notifications by default. | Decided |
| CUS-7 | The chatted-with section covers recent chats only (proposed window of 60 to 90 days), and customers can hide a business. | Proposed |
| CUS-8 | No follow feature and no public counts anywhere in the customer experience. | Decided |
| CUS-9 | Customers can browse Discover and web storefronts without an account. An account is required to chat. | Proposed |
| CUS-10 | Notification permission is requested at a meaningful moment (after the first chat), not at first launch. | Proposed |

### 5.8 Discovery (DIS)

| ID | Requirement | Status |
| --- | --- | --- |
| DIS-1 | Discovery is scoped by country: customers see businesses from their own country by default. | Decided |
| DIS-2 | Search covers business names, categories, and listing titles, tolerates typos and local terms, and offers filters: country, city, area or distance, category, in stock, price range, and delivery available. Country defaults to the customer's own country; city is optional and selectable. | Proposed |
| DIS-3 | Within the selected country, results are ranked with city then area proximity first. Country is the visibility boundary; city is a selectable filter and the primary ranking signal inside the country. | Proposed |
| DIS-4 | Ranking signals: relevance, proximity, profile completeness, freshness of listings and statuses, availability accuracy, responsiveness (from in-app chat), and later verification and ratings. | Proposed |
| DIS-5 | No popularity signals (followers, likes, view counts) are used in ranking. | Decided |
| DIS-6 | Fair exposure: a boost for newly joined businesses and rotation among comparable results so every active business gets a chance. | Proposed |
| DIS-7 | A store appears in discovery only with 3 or more items with photos, a category, and a location. | Decided |
| DIS-8 | Thin results never show an empty screen: widen the area, show related categories, and offer "notify me when businesses join". Unmet searches are recorded as demand data. | Proposed |
| DIS-9 | Remote services: at listing time a business chooses to be discoverable in its own country only, or in all countries. The all-countries option is offered only to services that do not require physical sales (for example graphic design). Eligibility is based on category plus owner confirmation, and these services appear in a separate Remote or online section. | Decided |
| DIS-10 | Remote services ship in phase 2, with a stronger trust baseline for the all-countries option (for example a portfolio of real work). | Proposed |
| DIS-11 | Promoted placement is a later premium feature. If introduced, it is clearly labeled, separate from organic ranking, and only launched once organic density exists. | Proposed |

### 5.9 Trust and safety (TRU)

| ID | Requirement | Status |
| --- | --- | --- |
| TRU-1 | Report and block on profiles, listings, statuses, and chats, with a moderation queue and an internal admin tool. | Proposed |
| TRU-2 | A prohibited-items and conduct policy is published from day one. | Proposed |
| TRU-3 | Verified business tag (phase 2): business documents are optional, but submitting them and passing review is required to receive the tag. Unverified businesses are not blocked from listing or discovery. | Decided |
| TRU-4 | Document review is done by people, with acceptable documents defined per country, secure storage, and a retention policy. | Proposed |
| TRU-5 | No ratings or reviews are shown until there is enough density. The trigger is defined per market and category, and ratings are tied to real conversations. | Decided |
| TRU-6 | In the meantime, collect private post-chat feedback (for example "Did you get a reply?") to build trust and ranking signals without public stars. | Proposed |
| TRU-7 | Show safety guidance before a customer's first chat with a business in another country and for remote services (for example, caution about paying in full upfront to unknown sellers). | Proposed |

### 5.10 In-app help (HLP)

| ID | Requirement | Status |
| --- | --- | --- |
| HLP-1 | Self-serve with in-app help: contextual guides on each setup step (short demos), a searchable help center, and human support chat. | Decided |
| HLP-2 | Show support hours and expected response times. Onboarding help stays free. | Proposed |
| HLP-3 | Track which steps generate the most support questions and review them weekly during the beta. | Proposed |

### 5.11 Premium (PRM)

| ID | Requirement | Status |
| --- | --- | --- |
| PRM-1 | Free base plan with paid premium features. | Decided |
| PRM-2 | Premium is introduced only after businesses are clearly getting value. The trigger is defined before the beta and measured (see section 8). | Decided |
| PRM-3 | Candidate premium features: deeper analytics (trends, per-listing performance, exports), higher listing and photo limits, scheduling, status highlights beyond 24 hours, custom link or branding, automated replies, staff seats, priority support, and later promoted placement. Basic Insights (ANA-3) stays free. | Decided |
| PRM-4 | App-store billing rules and commissions for subscriptions are reviewed before premium launches. | Proposed |

### 5.12 Analytics (ANA)

| ID | Requirement | Status |
| --- | --- | --- |
| ANA-1 | Instrument events from day one: onboarding steps, first listing, go-live, discovery-eligible, searches, storefront views, chats started, first reply, and status posts. | Proposed |
| ANA-2 | Business-facing analytics are private to the owner and never used in ranking. No public metrics. | Decided |
| ANA-3 | Free MVP Insights for owners: storefront views, listing views, chats started, and status views, for the last 7 and 30 days. | Decided |
| ANA-4 | Premium analytics (phase 2 or later): trends over time, per-listing performance, how customers found the business, search appearances, and exports. | Proposed |

## 6. Platforms and technical approach

### 6.1 What gets built

The MVP needs both an app and a website, but the website is a lighter, customer-facing piece and not a full web version of the app.

| Deliverable | What it covers |
| --- | --- |
| Mobile app (Android and iOS) | One cross-platform codebase with both modes: business (onboarding, listings, status, inbox) and customer (Chats, Updates, Discover). |
| Public website | Business storefronts, listing pages with rich link previews, and web chat so customers arriving from a shared link can message without installing the app. Business setup, listings, status, and inbox stay in the app. |
| Internal admin tool (web) | For the team only: moderation queue, reports, account and business management, and support. |
| Backend and services | API and database, plus managed services for chat, image storage and delivery, and notifications (push and email or SMS). |

### 6.2 Technical approach

- **Android and iOS from one codebase (Decided that iOS is supported now).** Framework decided: React Native with Expo (Decided September 26, 2026 — see note below). Flutter was the alternative.
- **Why React Native + Expo (owner decision):** budget first — one JavaScript/TypeScript skill set across app, web (React), and API (Node), so a solo/small team ships faster; React developers are more numerous and affordable in the launch markets; Expo provides managed camera, image, push, and OTA-update tooling that shortens the MVP. Flutter's low-end rendering edge was noted but did not outweigh shared-stack cost for the MVP.
- **Email provider decided: ZeptoMail (owner decision, budget).** ZeptoMail is the default for OTP codes and chat alerts; Resend stays as the fallback option. Rationale: lower cost at volume for African SMS-fallback-avoidant email-first flows, with an equivalent `sendMail()` interface so either provider works without code changes.
- **Design system companion (owner-reviewed, Sept 26, 2026).** `Docs/New-Era-Design-System.md` v1.2 plus visual `Docs/design-preview.html` are the visual source of truth: contrast-corrected palette (CTA, success, and error darkened to pass WCAG AA), dark mode supported from the start (not retrofitted), Lucide outline icons only, one CTA per screen, and no color/size/placement may imply popularity or ranking (fairness rule). Certificates render with a plain "Self-reported — not verified by New Era" label — never the verified styling reserved for the Phase 2 tag.
- **Local execution confirmed (Decided Sept 27, 2026).** Both the app and the database run locally for development: the mobile app via Expo/RN tooling, the API via Node, and Postgres 16 plus Redis via Docker Compose on localhost. Only file storage (Cloudflare R2) and email (ZeptoMail) require cloud keys; everything else runs without internet beyond package installs.
- **Accounts handling (Decided).** Email-first OTP sign-in with phone kept as an option (ACC-1); country chosen explicitly, never inferred (ACC-2); one account with customer/business modes and a remembered switch (ACC-3); one business per account in the MVP on a data model that supports many later (ACC-8); rate limits and disposable-mail blocks from day one (ACC-6).
- **Files handling (Decided).** All product, certificate, and status photos upload direct to Cloudflare R2 (S3-compatible) via presigned URLs under `business/:id/...` keys with immutable cache headers; thumb (~20KB) and feed (~80KB) variants keep data costs low; on-device compression plus offline retry queues cover weak networks (LST-9).
- **Tool review rationale (Decided Sept 27, 2026; detail in `Docs/New-Era-Implementation-Plan.md`).** React Native + Expo (shared JS/TS across app, web, API; affordable hiring pool); Vite static SPA instead of Next.js (no Node server to operate; a small Worker serves OG meta for link previews); Node + Fastify + Prisma + Postgres (shared types with web, full-text search path for discovery); Cloudflare R2 (zero local disk, custom image domain); ZeptoMail default with Resend fallback (cost at volume, one `sendMail()` interface); local Socket.io chat first reusing the managed-provider message schema so the CHT-9 swap needs no UI rework.
- **Web.** Public storefronts and customer web chat. The business dashboard stays app-only for the MVP.
- **Managed services** for chat and for image delivery through a CDN, with the specific providers left open for engineering to choose. A managed video service is added when video ships in phase 2.
- **Performance.** Design for lower-end Android phones: small app size, data-light behavior, lazy loading, caching, and offline drafts. Test image upload and chat early on budget devices as well as iPhones, and do the same for video when it ships.
- **Localization ready from day one.** Externalized strings and per-business currency formatting. English at launch.
- **Server-side configuration** for limits and thresholds: posts per day, listing limits, the discovery threshold, and video length once video ships.
- **Security and privacy.** Encrypted transport and storage, minimal personal data, secure handling of any documents (phase 2), and a basic compliance review for each active country.
- **Release approach.** Staged rollouts and a test matrix covering budget Android devices and iPhones.

## 7. Multi-country considerations

- **Launch market is undecided.** The MVP is planned as a closed beta in a small number of places so recruiting, support, and moderation stay manageable.
- **Country and currency.** Country is chosen explicitly. Prices display in the business's own currency.
- **Languages.** English only at launch (Decided). Additional languages are added in phase 2, chosen once the launch market is set. Search should understand local terms and slang.
- **Verification cost and fraud.** Email codes are cheap and reliable. SMS costs vary by country and carrier and attract fraud, so use rate limits and fallbacks.
- **Support.** Staff human support by market as countries open; guides and help articles scale across countries.
- **Rules differ by country.** Data protection and consumer rules vary, so review the basics for each country the product actively operates in.

## 8. Success metrics

Targets will be set after prototype testing and early beta data, not guessed in advance.

| Area | What to measure |
| --- | --- |
| Business activation | Time from install to first published item; share of owners reaching a live storefront; share reaching discovery-eligible; share who share their link in the first session. |
| Supply health | Share of live businesses receiving at least one chat per week; median time to first reply; share posting a status each week; time to a business's first discovery-sourced chat. |
| Demand health | Searches that lead to a click; chats started per session; day-7 and day-30 return; web link-to-chat conversion. |
| Quality and trust | Report rate, moderation turnaround, and rate of fake or copied listings. |
| Premium trigger | Defined before the beta from measures such as the share of live businesses getting weekly chats, repeat weekly use by businesses, and consistent posting. Premium starts only once these show businesses are clearly getting value. |

## 9. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Second-inbox problem: owners live in other chat apps, do not check New Era, and customers wait. | Reliable push plus email or SMS alerts, quick replies, business hours and away messages, in-app reminders, and tracking reply rates from day one. |
| Thin marketplace (not enough businesses in one place). | Concentrated beta, the 3-item discovery threshold, widen-area fallback, "notify me" waitlist, and deliberate recruiting. |
| Chat and media costs on a free tier. | Managed services, on-device image compression, server-side limits, 24-hour expiry, and monitoring cost per active business. |
| Scope is larger than a first release should be. | Protect the "listed, found, chatted" loop. Trim ranking polish first; delay Updates polish and remote services if needed. |
| Fake or copied listings and scams, especially across borders. | Report and block, prohibited-items policy, admin tool, verified tag in phase 2, and safety prompts. |
| Web visitors miss replies because they leave the page. | Email or SMS alerts with a link that reopens the chat; encourage adding an email address. |
| Fairness rules reduce the reason to post statuses. | Chatted-with ordering in Updates, easy export of statuses to other apps, and private analytics for owners. |
| Operational load (moderation, support, and later document review). | Internal admin tool, self-serve guides, and staffing by market. |
| Video (phase 2) is costly and heavy on low-end phones. | Ship video after the MVP with length and size caps, on-device compression, adaptive quality, and early testing on budget devices. |
| SMS cost and fraud. | Email codes as the default, rate limiting, and fallbacks. |

## 10. Open questions

- **Launch countries, cities, and categories** (undecided). Useful criteria: where 100 or more businesses can be recruited quickly, language fit, and where owners can be reached in person.
- Which cross-platform framework and which managed chat provider (and a video provider when video ships)? Left to engineering once the team is in place.
- Ratings trigger: what density, per market and category, switches ratings on? Best set once the launch market is known.
- Premium: trigger thresholds and pricing.
- Which categories qualify for the all-countries remote option? Best defined once the launch categories are known.
- Acceptable business documents per country for the verified tag. Depends on the launch market.
- Language sequence after English, once the launch market is set.
- When to allow multiple businesses per account and staff seats.

## 11. Decision log

| Area | Decision (confirmed by the product owner) |
| --- | --- |
| Users | A mix of informal sellers, small shops with staff, and service providers. |
| Differentiator | Customers can discover businesses on the platform. |
| Revenue | Free base plan with paid premium features, introduced only after businesses are clearly getting value. |
| Launch market | African countries first (phone or email sign-up). Specific countries, cities, and categories undecided. |
| Discovery scope | By country. Businesses choose their own country only, or all countries; all countries is only for services that do not require physical sales. |
| Discovery threshold | 3 or more items with photos, a category, and a location. |
| Chat | In-app chat instead of WhatsApp linking, plus chat on the web without installing. |
| Listings | Approved as planned; services are inquiry-only in v1. |
| Status | Photo and text in the MVP; video (up to 3 minutes) planned for phase 2; 5 posts per day. |
| Onboarding | Approved as planned. |
| Follows | No follow feature. No likes or public counts; quality and ratings decide. |
| Ratings | None until there is enough density. |
| Sign-up | Email or phone number required. |
| Verified business tag | Documents optional, but required to get the tag. Ships in phase 2. |
| Accounts | One account for both customer and business, with mode switching. |
| Customer home | Chats as home (businesses appear like chats); empty chat list with a search prompt for new customers; Updates and Discover on separate pages. |
| Updates tab | Chatted-with businesses first, then nearby; no status notifications by default. |
| Business help | Self-serve plus in-app help (guides and support chat). |
| Platforms | iOS supported alongside Android from the start. |
| Discover access | Customers can browse Discover and storefronts without an account; an account is required only to chat. |
| Business analytics | Free basic Insights (views and chats, last 7/30 days) in the MVP; deeper analytics reserved for premium. |
| Updates chat window | Businesses chatted with in the last 60 days appear first in Updates. |
| Languages | English only at launch; more languages added in phase 2 based on the launch market. |
| Multiple businesses per account | One business per account in the MVP; multiple businesses added later. |
| App framework | React Native with Expo (Decided Sept 26, 2026 — budget: shared JS stack, hiring pool, Expo tooling; Flutter was the alternative). |
| Email provider | ZeptoMail by default (Decided Sept 26, 2026 — budget at volume; Resend is the fallback). |
| Certificates | Optional self-reported certificates (max 3, photo required, "not verified" label) shown on storefronts pre-verification (Decided Sept 26, 2026). |
| Discovery city filter | Search by country and by city: country defaults to the customer's own, city is selectable and ranks first (Decided Sept 26, 2026; DIS-2/DIS-3). |
| Auth order | Email-first sign-in, phone kept as an option; stub token in dev, JWT before beta (Decided Sept 26, 2026). |
| Onboarding details | Business name required; online businesses pick a manual service area or nationwide; single-product sellers may list 3 variations to meet the discovery threshold (Decided Sept 26, 2026). |
| Bulk add | Flexible multi-select: owner picks any 2 or more photos, one draft each (Decided Sept 26, 2026; LST-4). |
| Listing photos | Max 5 photos per listing in a swipeable gallery, so variants need no separate listings (Decided Sept 30, 2026; supersedes the max-3 rule). |
| Support scope | Guides + FAQ first; human support for bug reports and important non-FAQ issues only, not onboarding (Decided Sept 26, 2026). |
| Pick-list (cart-lite) | Multi-item pick attached to the first chat message, no totals or checkout; Phase 2 after chat loop is proven (Decided Sept 27, 2026). |
| Pins (paid) | Pin-to-profile/storefront highlight + 7-day status pin; in-app links only; explicit "Share promo" button (system share sheet with attribution + install link); ships when chat value is proven (premium trigger). |
| Sponsored placements | Labeled in-status area ads (promo/event), density-gated per DIS-11; in-app links first, external links only with review; customers can reshare with attribution + install link; max 3 active per business per city, swipable; subtle new-dot, no enticement animation; Phase 3. |
| Design system | v1.1 tokens + preview: contrast-corrected colors, dark mode from start, one CTA per screen, no popularity styling; certificates use plain "not verified" label (Reviewed Sept 26, 2026). |
| Phone sign-up | Removed for MVP — email-only sign-up; contact phone stays as an optional unverified profile field. Revisit with Africa's Talking at beta (Decided Oct 6, 2026). |

## Appendix: Glossary

| Term | Meaning |
| --- | --- |
| Storefront | A business's public page: profile, listings, collections, and current statuses, with a shareable link. |
| Discovery | The way customers find businesses they do not already know: search, categories, and nearby results. |
| Discovery threshold | The minimum a store needs before it appears in discovery: 3 or more items with photos, a category, and a location. |
| Status | A 24-hour update (photo or text in the MVP, video later) posted by a business. |
| Remote service | A service that does not require physical sales or presence, such as graphic design. |
| Mode | Whether the account is currently being used as a customer or as a business. |

