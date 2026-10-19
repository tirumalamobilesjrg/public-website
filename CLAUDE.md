# CLAUDE.md — public-website

Public site for Tirumala Mobiles (physical shop). Next.js App Router + TypeScript strict. Reads ONLY the public views of the Supabase project owned by `crm-backend`.
Sibling repos: `crm-backend` (schema, RLS, views), `crm-frontend` (staff CRM). No cart, checkout, orders, accounts, reviews, offers or discount banners, ever.

## Rules
- Server-side data access only, in `src/lib/supabase/rest.ts` (allow-list of views) and `src/lib/catalogue.ts`. Pages never query Supabase directly.
- Only the publishable (anon) key. `src/lib/env.ts` refuses `sb_secret_` / service_role keys. Never commit `.env`.
- Show only `public_price` (null => "Ask in store for price") and the backend-derived `availability`. Never compute stock or prices in the browser. No stock counts, IMEI, cost, margin.
- Shop details (address, phone, WhatsApp, hours, map link, about) come from the CRM via `public_shop_profile` (backend migration pending, see docs/BACKEND_REQUESTS.md). Until it exists every field is empty and the site hides the section. Never invent details.
- Data is cached for 300 s (`REVALIDATE_SECONDS`); copy says "as last updated by the shop", never "live".
- Hosting target: Vercel free (owner decision). Note Vercel Hobby is for non-commercial use; revisit before launch.

## Commands
`npm run lint` · `npm run typecheck` · `npm test` · `npm run build` (needs `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`; for local checks run `node scripts/mock-supabase.mjs` and point `SUPABASE_URL` at `http://127.0.0.1:58431`).
Install with `npm ci --legacy-peer-deps=false` (a global `legacy-peer-deps=true` breaks testing-library).

## State
Done on `feature/website-foundation`: layout/nav (bottom tabs on phones), home, /products (search, category, brand, stock, sort, paging), /categories/[slug], /products/[slug], /compare (URL-based, up to 3), /about, /contact, /privacy, not-found/error, robots, sitemap, manifest.
Verified: typecheck, lint, 11 unit tests, production build, manual route checks against the stand-in server (status codes, titles, sitemap, robots), phone-width layout has no horizontal overflow.
Not done / not verified: real Supabase (anonymous-access tests against the local stack), `public_shop_profile` view, product photos from real Storage, PWA install prompt and offline fallback, service worker, deployment, logo and app icons (text mark placeholder).

## Added on feature/website-foundation (PWA and access checks)
- PWA: `public/sw.js` (offline fallback page only; caches no catalogue/prices), `src/components/InstallPrompt.tsx` (registers the worker, shows "Add to home screen" when the browser offers it, remembers "Not now" in guarded localStorage), `/offline`, PNG icons at `/icons/192` and `/icons/512` (generated text mark, replace with the real logo).
- `npm run check:anon` (`scripts/anon-check.mjs`): with `SUPABASE_URL` and the publishable key, asserts anon can read only the five public views (approved columns only), cannot read any private table, write, call the six business RPCs, or upload to the photo bucket. Passed against the hosted project on 2026-10-19 (no products were published there yet, so row-level exclusion of unpublished products is covered by the backend DB tests, not this script).
- The install prompt and service worker were checked by route status only; install/offline behaviour in a real phone browser is NOT verified.

## Hosting: Cloudflare Workers (decided 2026-10-19; Vercel's free plan is non-commercial)
- Adapter: `@opennextjs/cloudflare` 1.20.12 (peer `next >=16.4.1`) + `wrangler` 4.151.1, config in `wrangler.jsonc` and `open-next.config.ts`.
- `npm run cf:build` builds the Worker (verified locally on Windows and run under `wrangler` workerd with `cf:preview`; routes, 404s, sitemap, manifest and static assets answered correctly against the stand-in server). `npm run cf:deploy` exists but has NOT been run: deploying needs the owner's Cloudflare account and approval.
- `SITE_URL` falls back to Vercel's `VERCEL_PROJECT_PRODUCTION_URL`/`VERCEL_URL` when unset (so a first Vercel test deploy builds); on Cloudflare it is required. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (public key only) and `SITE_URL` as Worker variables in the Cloudflare dashboard, never in the repo. For local preview put them in `.dev.vars` (git-ignored).
- Images: `images.unoptimized` (no Cloudflare image optimiser configured), so photos load as uploaded; keep CRM uploads small.
- Theme: same logo palette as the CRM (navy `#0f1d3a`, gold `#d5a755`, link `#1c3f8c`); logo emblem in `public/logo-*.png` and `public/icons/`.

## Verified on 2026-10-19 (local Supabase stack with migrations 0001-0022, website running as a Cloudflare Worker under workerd)
- 45 browser checks at phone/tablet/desktop widths: no horizontal overflow, one h1 per page, photos from real Storage load (main + thumbnails), alt text on every image, no cart/checkout/buy controls, call button built from the CRM phone number, home lists only in-stock products, catalogue shows out-of-stock phones with an "Out of stock" label, unknown page shows the friendly 404, no uncaught browser errors. Unpublishing a product made it 404 and removed it from the catalogue and sitemap immediately; republishing restored it.
- `npm run check:anon` passed 57/57 against the local stack (and against the hosted project).
- On Workers without a cache binding the 300 s fetch revalidation does not cache: a CRM edit showed on the site on the very next request. Each page view therefore calls Supabase (2-4 small reads); add a Cache API layer if traffic grows.
- Not verified: install/offline behaviour on a real phone, a deployed Cloudflare Worker (nothing is deployed), Lighthouse scores, photo delivery speed (photos are not resized; consider resizing in the CRM before upload).

## Review fixes (branch fix/review-fixes)
Multi-word search (`searchFilter`: words ANDed, each over name/brand/category; verified against real PostgREST), compare picker lists up to 200 names, WhatsApp buttons use the CRM WhatsApp number (falls back to the phone), tappable photo thumbnails (`Gallery`), white focus rings on the navy header/footer, scroll padding for sticky bars, 3:1 form borders, "In stock at the shop" wording, nav tab "Products", errors logged with `console.error` (Workers logs), 8 s upstream timeout, `global-error.tsx`, HSTS/Permissions-Policy/CSP-lite headers (also in `public/_headers` for static assets), CI `permissions: contents: read`.
Still open: Worker page cache (Cache API does not work on workers.dev; needs a custom domain or KV), one combined card view to cut round trips, Lighthouse/axe run, real-phone PWA check.
