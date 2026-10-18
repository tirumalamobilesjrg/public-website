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
