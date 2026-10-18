# Requests for crm-backend / crm-frontend

The website must not bypass the public-view contract, so these need a forward migration in `crm-backend` (owner approval before applying to the hosted project).

## 1. `public_shop_profile` view (shop details from the CRM)
`shop_settings` already has `shop_name`, `address`, `phone`, `email` (edited by Admin in the CRM). Missing columns: `whatsapp`, `opening_hours` (text), `map_url` (https link), `about` (text).

Proposed migration `0022`: add those four nullable columns to `shop_settings` (Admin-only update, as today), and a view
`public_shop_profile(shop_name, address, phone, whatsapp, email, opening_hours, map_url, about)` with `security_invoker = false`, granted to `anon`.
It must NOT expose `legal_name`, `invoice_prefix`, or anything discount-related. Update `docs/API_CONTRACTS.md` and the exact-column test (the backend currently asserts "four views").

CRM Settings page (Admin) then needs fields for the new columns.

## 2. Public categories/brands
Categories and brands are derived from `public_catalogue_products` (distinct values, 1000-row bound). A small `public_catalogue_categories` view with description would allow category descriptions; optional.

## 3. Missing owner assets
Logo, app icons (192/512 PNG), verified address, phone, WhatsApp number, opening hours, map link, about text, custom domain.
