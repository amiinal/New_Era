# New Era — Design System
**Version 1.2 — for engineering and build reference**

This document defines the visual foundations for New Era: color, typography, accessibility, dark mode, font-loading strategy, spacing, and grid. It is split into **Foundations** (shared everywhere), **App** (mobile and tablet, Android and iOS), and **Web** (public storefronts, web chat, and the internal admin tool). Follow the token values exactly — do not eyeball colors or spacing.

---

## 1. Foundations (shared by App and Web)

These values are the same everywhere. They are the single source of truth for brand consistency.

### 1.1 Color palette

| Token | Hex | Use for |
|---|---|---|
| `color-primary` | `#2C3E7A` (Deep Indigo) | Primary brand color: headers, nav bars, key icons, links |
| `color-primary-dark` | `#1F2C59` | Pressed/active state of primary elements |
| `color-cta` | `#C24E22` (Coral, contrast-corrected) | Primary action buttons only: "Message", "Publish", "Send" — always with white text |
| `color-cta-tint` | `#F2703C` | Icons, badges, and decorative accents only — never as a solid fill carrying white button text (see 1.3) |
| `color-cta-dark` | `#A33D1A` | Pressed/active state of CTA buttons |
| `color-success` | `#0A6B62` (Teal, contrast-corrected) | Success states, verified badge text, "delivered" indicators, and solid success fills |
| `color-warning-tint` | `#E8A639` (Amber) | Low-stock/caution icons and light background tints only — never as text color or a solid fill with white text |
| `color-warning-text` | `#8A5A12` | The actual readable label on a warning tint or on white (e.g., "Low stock" text) |
| `color-error` | `#B0362C` (Red-Orange, contrast-corrected) | Errors, failed uploads, blocked/report states |
| `color-ink` | `#1E1E24` | Primary text |
| `color-body-text` | `#5B5F6B` | Secondary text, captions, timestamps |
| `color-line` | `#E4E6EB` | Decorative dividers only (list separators, card outlines) |
| `color-line-strong` | `#8B8F9B` | Functional boundaries that must stay visible: input field borders, focus outlines |
| `color-surface` | `#FFFFFF` | Cards, chat bubbles (own message), input fields |
| `color-background` | `#F7F7F9` | Screen and page background |

**Rules:**
- Only **one** CTA color exists for buttons (`color-cta`). Never use it for anything other than the single primary action on a screen. `color-cta-tint` is a separate, brighter token for non-button uses (icons, badges) — it must never carry white text at button size, since it fails contrast (see 1.3).
- Never use `color-success` as a decorative brand color — it is reserved for verified/success meaning only.
- No color may be used to imply popularity, ranking, or "featured" status (e.g., no gold stars, no highlighted "top seller" backgrounds). This is a product rule, not just a style rule.
- Product photos are the visual focus. Backgrounds and cards stay on the neutral tokens above — never a saturated color — so photos are never fighting the UI for attention.
- `color-line` (light) is for decoration only. Anywhere a border communicates an interactive boundary (an input field, a focus ring, a selectable card), use `color-line-strong` instead — the light line token does not meet the visibility bar for functional elements (see 1.3).

### 1.2 Typography

**Font family: Inter** (single family, multiple weights). Do not introduce a second font into the product itself.

Fallback stack: `Inter, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`

| Style token | Size (px) | Weight | Used for |
|---|---|---|---|
| `type-display` | 40 | Bold | Web marketing headlines only — never in-app |
| `type-h1` | 28 | Bold | Screen titles |
| `type-h2` | 22 | Semibold | Section headers |
| `type-h3` | 18 | Semibold | Card titles, subsection headers |
| `type-body` | 16 | Regular | Default body text, listings, chat messages |
| `type-body-sm` | 14 | Regular | Secondary text, form labels |
| `type-micro` | 12 | Medium | Timestamps, tags, helper text |

Numbers (prices, quantities) always use Inter's tabular figures so they align in lists.

### 1.3 Accessibility and contrast

Every color pairing in this system has been checked against WCAG 2.1 AA: **4.5:1** minimum for normal text, **3:1** for large text (18px+ regular, or 14px+ bold) and for meaningful non-text elements like input borders and icon outlines. Some of the original color picks failed this check and have been corrected above — this is why `color-cta`, `color-success`, `color-warning-text`, and `color-error` differ slightly from the first draft.

**Measured contrast ratios (build reference):**

| Pairing | Ratio | Passes |
|---|---|---|
| `color-ink` on `color-background` | 15.5:1 | Yes |
| `color-body-text` on `color-background` | 6.0:1 | Yes |
| `color-primary` on white | 10.1:1 | Yes |
| `color-cta` (button fill) with white text | 4.8:1 | Yes |
| `color-cta-tint` with white text | 2.9:1 | **No — do not use this pairing** |
| `color-success` (fill) with white text | 6.4:1 | Yes |
| `color-success` as text on its light tint | 5.4:1 | Yes |
| `color-warning-text` on its light tint or white | 5.2–5.9:1 | Yes |
| `color-warning-tint` with white text | 2.1:1 | **No — never used this way** |
| `color-error` with white text | 5.1:1 | Yes |
| `color-line-strong` on white (input borders) | 3.2:1 | Yes |
| `color-line` on white (decorative only) | 1.3:1 | Fails — decorative use only, never functional |

**Rules for the builder:**
- Never place white text directly on `color-cta-tint` or `color-warning-tint` — both fail contrast. These two tokens exist for icons, small badges paired with dark text, and light decorative fills only.
- When text sits on a colored chip or badge (e.g., "Verified", "Low stock"), always use the darker `-text` or corrected semantic token, never the brighter tint token, and never plain black.
- Run every new color pairing through a contrast checker before shipping it — don't eyeball it. Any free WCAG contrast checker (for example WebAIM's) will do.
- Minimum tap target size is 44×44 (iOS) / 48×48dp (Android) for any interactive element, even if the visible icon or label is smaller.

### 1.4 Dark mode

The app should follow the device's system light/dark setting rather than shipping light-only. This matters in practice for this product: outdoor use in bright sunlight (glare on a light screen is harder to read) and battery life on the OLED screens common on mid-range Android phones both favor offering dark mode, not just aesthetics.

**Dark mode tokens** (add alongside the light tokens in section 4; do not replace them):

| Token | Light | Dark | Notes |
|---|---|---|---|
| `color-background` | `#F7F7F9` | `#121317` | Page background |
| `color-surface` | `#FFFFFF` | `#1C1F26` | Cards, bubbles, fields |
| `color-surface-raised` | — | `#24272F` | Modals, sheets (one step lighter than `color-surface` in dark mode) |
| `color-ink` | `#1E1E24` | `#F2F2F5` | Primary text |
| `color-body-text` | `#5B5F6B` | `#A9ACB6` | Secondary text |
| `color-line` | `#E4E6EB` | `#2E313A` | Decorative dividers |
| `color-primary-on-dark` | — | `#7B90D6` | Use for primary-colored **text, links, and icons** on dark backgrounds — the light-mode `color-primary` is too dark to read against a near-black background (1.8:1, fails) |
| `color-cta`, `color-success`, `color-error`, `color-warning-text` | unchanged | unchanged | These already have enough contrast against both light and dark backgrounds and do not need separate dark values |

**Rules:**
- Never hardcode a color anywhere in the codebase — always reference the token, so switching modes is automatic.
- `color-primary` (the deep indigo) stays correct for large **fills** (nav bars, filled buttons) in dark mode, but switches to `color-primary-on-dark` whenever it's used as text, a link, or a small icon on a dark background.
- Test both modes before shipping any new screen — a pairing that passes in light mode is not guaranteed to pass in dark mode.

### 1.5 Font-loading strategy (low-bandwidth markets)

Since much of the launch market will be on limited or costly mobile data, font delivery needs its own plan rather than defaulting to a typical web setup.

**In the app (Android and iOS):**
- Bundle Inter directly inside the app package as a single **variable font file** (one file covers every weight, roughly 300–340KB uncompressed, smaller after the app store's own compression), rather than shipping a separate static file per weight. This means the font never has to be downloaded at runtime — no user ever waits on it or burns data for it.
- Subset the bundled font to Latin characters for the English-only MVP. Add the extended Latin subset only when French or Portuguese are introduced in phase 2 — don't ship character ranges the app doesn't use yet.
- Limit the shipped weight range to what the type scale in 1.2 actually uses (Regular, Medium, Semibold, Bold). A variable font makes this a non-issue at the file level, but keep it in mind if a static fallback build is ever needed.

**On the web (storefronts, web chat, admin tool):**
- Self-host the font file rather than loading it from Google Fonts or another external host — this avoids an extra DNS lookup and connection round-trip, which is disproportionately expensive on slow mobile networks.
- Use the **woff2** format only (best compression available) and serve a single Latin-subset variable font file, same reasoning as the app.
- Set `font-display: swap` so text renders immediately in the fallback stack (`-apple-system, "Segoe UI", Roboto, Arial, sans-serif`) and swaps to Inter once it loads — a visitor never stares at invisible text on a slow connection.
- `<link rel="preload">` the font file on the storefront page (the page a customer is most likely to load cold, from a shared link), but don't preload it on secondary pages where it will already be cached.
- Set long cache lifetimes on the font file (it changes rarely, if ever) so repeat visitors never re-download it.
- Prefer inline SVG icons over an icon web-font on the storefront and admin tool. An icon font typically ships hundreds of icons the page never uses; a handful of inline SVGs for the icons actually needed is smaller and avoids a separate font request entirely.

### 1.6 Icon pack (Lucide, outline)

One pack everywhere: **Lucide** — outline style only, 2px stroke with round caps and joins on a 24px grid, so every icon speaks the same visual language. No second pack, no mixed fill/outline sets.

- **Packages:** `lucide-react-native` in the Expo app, `lucide-react` on web, raw inline SVGs where a package import is wasteful (storefront, admin). MIT licensed, tree-shakable — only used icons ship.
- **Sizes:** 24px default, 20px in list rows, 16px in chips and badges. Stroke 2px at 24/20px, 1.5px at 16px.
- **Color:** `currentColor` always — never hardcode an icon color, so dark mode and states follow automatically. Active nav and selected states use the `primary` outline icon; never swap to a filled variant to signal state.
- **Core set (start here, extend only from Lucide):** MessageCircle, Camera, ImagePlus, Search, Store, Bell, MapPin, Clock, Check, CheckCheck (delivered), Plus, Share2, QrCode, SlidersHorizontal (filters), ChevronRight, X, Trash2, Flag (report), Ban (block), BadgeCheck (verified only — never decorative), Package (listings), Truck (delivery), Globe (nationwide/remote), Award (certificates), CircleHelp (help/FAQ), Settings, LogOut.
- **Never:** emoji as functional icons; filled icons anywhere except the verified mark; star/ranking metaphors (fairness rule, §1.1).

---

## 2. App (Android and iOS — mobile only)

### 2.1 Spacing scale (base unit: 4)

| Token | Value (px) |
|---|---|
| `space-1` | 4 |
| `space-2` | 8 |
| `space-3` | 12 |
| `space-4` | 16 |
| `space-5` | 24 |
| `space-6` | 32 |
| `space-7` | 48 |
| `space-8` | 64 |

**How to apply:**
- `space-1`–`space-2`: gaps inside small components (icon-to-label, chip padding)
- `space-3`–`space-4`: padding inside cards, list items, chat bubbles
- `space-5`: spacing between related elements on a screen
- `space-6`: spacing between distinct sections
- `space-7`–`space-8`: full-screen padding on empty states and onboarding

### 2.2 Corner radius scale (base unit: 4)

| Token | Value (px) | Used for |
|---|---|---|
| `radius-sm` | 4 | Tags, small chips |
| `radius-md` | 8 | Input fields, buttons |
| `radius-lg` | 16 | Cards, chat bubbles |
| `radius-xl` | 24 | Sheets, modals |

### 2.3 Grid

The app uses two grids: **mobile** (phones) and **tablet** (larger screens, for business owners managing listings from a tablet). There is no separate design work needed beyond these two — the tablet grid is a scaled-up version of the mobile grid, using the same base-4 logic.

**Mobile grid** (default, phones)

| Property | Value |
|---|---|
| Breakpoint | below 600 |
| Columns | 4 |
| Margin (left/right) | 16 |
| Gutter (between columns) | 16 |

**Tablet grid** (600 and above)

| Property | Value |
|---|---|
| Breakpoint | 600 and above |
| Columns | 8 |
| Margin (left/right) | 24 |
| Gutter (between columns) | 16 |

8 is a clean multiple of the mobile grid's 4 columns, so a single-column mobile card becomes a 2-column tablet layout, and a 2-column mobile grid becomes 4 columns on tablet, with no half-columns anywhere. Every column width, margin, and gutter across both grids is a whole number.

### 2.4 Core components (quick reference)

| Component | Rule |
|---|---|
| Primary button | `color-cta` background, white text, `radius-md`, height 48, one per screen |
| Secondary button | `color-primary` outline, `color-primary` text, `radius-md` |
| Card (product/listing) | `color-surface` background, `radius-lg`, `space-4` internal padding |
| Chat bubble (own) | `color-primary` background, white text, `radius-lg` |
| Chat bubble (other) | `color-surface` background, `color-ink` text, `radius-lg` |
| Input field | `color-surface` background, `color-line-strong` border, `radius-md`, `space-4` padding |
| Verified badge | `color-success` icon + text, small icon only, never resized to draw extra attention |
| Low-stock / caution tag | `color-warning-tint` background at 15% opacity, `color-warning-text` label — never white text on solid amber |

---

## 3. Web (public storefronts, web chat, internal admin tool)

### 3.1 Spacing scale

Same base-4 scale as the app (`space-1` through `space-8`), plus two larger tokens for page-level web layout:

| Token | Value (px) |
|---|---|
| `space-9` | 96 |
| `space-10` | 128 |

Use `space-9`/`space-10` for hero sections and large page-level gaps on the web only — never in the app.

### 3.2 Grid

| Property | Value |
|---|---|
| Columns | 12 |
| Max content width | 1200 |
| Margin (left/right) | 32 |
| Gutter (between columns) | 24 |

At 1200px max width, each of the 12 columns is a whole 100px before gutters are applied. 12 divides evenly by 2, 3, 4, and 6, so any product grid (2, 3, 4, or 6 items per row) lines up exactly with no partial columns.

### 3.3 Typography on web

Same type tokens as section 1.2, with one addition: `type-display` (40px) is available for marketing landing-page headlines. Storefront pages (product listings, business profiles) use the same `type-h1`–`type-micro` scale as the app, so a business's storefront feels consistent whether viewed on web or in-app.

### 3.4 Core components (quick reference)

| Component | Rule |
|---|---|
| Primary button | Same as app: `color-cta`, `radius-md`, height 48 |
| Storefront product grid | 2, 3, 4, or 6 columns depending on viewport, using the 12-column grid |
| Nav bar | `color-primary` background or white with `color-primary` logo/text, height 64 |
| Card (storefront listing) | Same visual rules as the app card, so listings look identical across platforms |

---

## 4. Developer tokens

For direct use in code. Keep app and web implementations pointing at these same values so the brand never drifts between platforms.

```css
:root {
  /* Colors — light mode (all contrast-checked, see 1.3) */
  --color-primary: #2C3E7A;
  --color-primary-dark: #1F2C59;
  --color-cta: #C24E22;
  --color-cta-tint: #F2703C;
  --color-cta-dark: #A33D1A;
  --color-success: #0A6B62;
  --color-warning-tint: #E8A639;
  --color-warning-text: #8A5A12;
  --color-error: #B0362C;
  --color-ink: #1E1E24;
  --color-body-text: #5B5F6B;
  --color-line: #E4E6EB;
  --color-line-strong: #8B8F9B;
  --color-surface: #FFFFFF;
  --color-background: #F7F7F9;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;   /* web only */
  --space-10: 128px; /* web only */

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Grid — Web */
  --grid-web-columns: 12;
  --grid-web-max-width: 1200px;
  --grid-web-margin: 32px;
  --grid-web-gutter: 24px;

  /* Grid — App mobile (reference values; implement in native/Flutter/RN layout system) */
  --grid-app-mobile-columns: 4;
  --grid-app-mobile-margin: 16px;
  --grid-app-mobile-gutter: 16px;

  /* Grid — App tablet */
  --grid-app-tablet-columns: 8;
  --grid-app-tablet-margin: 24px;
  --grid-app-tablet-gutter: 16px;
}

/* Dark mode — overrides only; everything not listed here is unchanged (see 1.4) */
[data-theme="dark"] {
  --color-background: #121317;
  --color-surface: #1C1F26;
  --color-surface-raised: #24272F;
  --color-ink: #F2F2F5;
  --color-body-text: #A9ACB6;
  --color-line: #2E313A;
  --color-primary-on-dark: #7B90D6; /* use for primary text/links/icons on dark backgrounds */
}
```

App builders (Flutter or React Native) should replicate the same hex, spacing, and radius values above in their theme file — the numbers must match exactly, only the implementation syntax changes. Implement dark mode as a parallel theme object driven by the system setting, mirroring the override structure above.

---

## 5. Do's and don'ts

- **Do** keep backgrounds neutral so product photos stay the visual focus.
- **Do** snap every spacing and radius value to the scales above — no custom in-between numbers.
- **Don't** introduce a second font family into the product.
- **Don't** use color, size, or placement to make one business look more prominent or popular than another — this breaks a core product principle (no popularity contests, quality-based fairness).
- **Don't** reuse `color-cta` for more than one action on the same screen.
- **Don't** design bespoke tablet-only layouts beyond the 8-column grid in section 2.3 — tablet should feel like an expanded version of the mobile screens, not a different app. The web side targets desktop/responsive down to mobile web, using the 12-column grid throughout.
- **Do** support system dark mode from the start, using the token overrides in section 1.4 — don't ship a light-only app and retrofit dark mode later.
- **Don't** put white text on `color-cta-tint` or `color-warning-tint` — both fail contrast (see 1.3). Use `color-cta` and `color-warning-text` respectively wherever text is involved.
- **Do** bundle a single subsetted variable font file for Inter (app and web) rather than multiple static weight files — see 1.5.
- **Don't** load fonts from an external host (e.g., Google Fonts) on the web — self-host with `font-display: swap`, per 1.5.
