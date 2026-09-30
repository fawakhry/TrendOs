# TrendOS T12 — Entry496 — Orders 02CR degraded-enrichment visibility — 2026-09-30

## Scope
Repo-only change. No Cloudflare deploy, no Wrangler deploy, no D1 mutation, no Google/Apps Script mutation, no secrets/variables/bindings mutation.

## Production context before this source change
Entry495 was manually installed by the owner:
- Browser direct Google transport removed.
- Frontend calls Cloudflare `/v1/legacy-api`.
- Session transport works through Cloudflare.
- Orders operational page still failed closed with HTTP 503 because 02CR customer/debt enrichment mirrors exceeded the short 300s write-age freshness budget.

Observed browser error:
```
GET /v1/edge/orders/02cr/page -> 503
02CR enrichment mirror is older than the freshness budget.
```

## Root cause
`cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs` coupled Orders visibility to the write age of:
- `العملاء`
- `عملاء منع التسليم بالمديونية`

The mirrors could remain structurally qualified while older than 300 seconds. This hid the entire Orders list even when Orders/Lines themselves were qualified.

## Source fix
Commit:
`2b14595e10f052676aa5c703d6fda8a820b98c0c`

Behavior now:
- Structural qualification for Lines/Customers/Restrictions remains mandatory.
- Orders/Lines freshness remains protected by the existing write-age + idle-heartbeat proof.
- Stale customer/restriction enrichment no longer hides operational Orders.
- A successful response is decorated with:
  - `enrichmentFreshness.degraded=true`
  - mode `stale-structurally-qualified`
  - warning code `02CR_ENRICHMENT_STALE_ADVISORY`
- Sensitive `__DEBT__` filtering remains outside this Cloud operational path.
- No browser fallback to Google was restored.

## Tests
Freshness contract updated:
`6e4d41e558596e7dd355b97656df3d72c2513016`

Legacy 02CR fixture repaired for existing T12 overlay:
- `998cbb8312826a9fab2e009abd11c2c6e1f62c10`
- `71c819eca12dd3e4c0bfc1bca213765606390175`

Permanent CI added:
`.github/workflows/trendos-orders-02cr-visibility-regression.yml`
commit:
`918be39955166bc9b23560aa566488991fbd6fdb`

Qualification:
- temporary run `36742724932` = SUCCESS
- permanent regression run `36742881020` = SUCCESS
- A61 browser Cloud transport regression remained SUCCESS.

Covered:
- syntax
- 02CR freshness
- 02CR handler
- operational enrichment
- index route
- frontend cutover
- no direct browser Google transport

## Current source state
```ini
ENTRY496_SOURCE_QUALIFIED=YES
ENTRY496_PRODUCTION_DEPLOYED=NO
ORDERS_02CR_STALE_ENRICHMENT_BLOCKS_VISIBILITY=NO
ORDERS_LINES_FRESHNESS_GUARD=PRESERVED
ORDERS_ENRICHMENT_STRUCTURAL_GUARD=PRESERVED
DEBT_FILTER_CLOUD_02CR=NO
BROWSER_GOOGLE_FALLBACK=NO
D1_MUTATION=NO
GOOGLE_MUTATION=NO
CLOUDFLARE_MUTATION=NO
```

## Next owner action
Publish the qualified API Worker source manually to `trendos-d1-api`, preserving existing Variables, Secrets and Bindings. Frontend assets do not require a change for Entry496.

After deploy:
1. hard refresh TrendOS;
2. open Customer Service;
3. verify `/v1/edge/orders/02cr/page` returns HTTP 200;
4. verify Orders cards render;
5. verify Console has no `script.google.com` requests;
6. inspect response `enrichmentFreshness`; degraded enrichment is advisory and must not hide rows.

## Next engineering task after production verification
Implement Cloud-native duplicate-order guard before continuing wider Zero-Google work.
