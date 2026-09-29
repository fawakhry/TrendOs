# TrendOS T12 — Zero-Google Cutover A56–A58 — Entry 477
Date: 2026-09-29 Cairo

## Owner directive
Finish platform cutover before continuing book closure:
- Customers on Cloud/D1.
- Frontend hosted on Cloudflare.
- Final target: no runtime dependency on Google Sheets or Apps Script.

## A56 — Customer authority cutover
Production customer master preflight:
- mode: OFF
- total customer rows: 247
- legacy-mirror rows: 247
- cloud-native rows: 0
- nextCustomerNumber: 1
- duplicate primary-phone groups: 3
- duplicate extra-phone groups: 1
- exact duplicate identity groups: 0
- ledger rows: 0

A safe shared-phone identity policy was implemented:
1. exact phone/extra-phone match first;
2. if more than one customer shares that phone, exact normalized customer name disambiguates;
3. unresolved ambiguity fails closed;
4. name-only fallback remains fail-closed on duplicates.

Qualification:
- A56 customer Cloud-only CI run `36572007869`: SUCCESS.
- Customer GENERAL cutover run `36572088014`: SUCCESS.

Production result:
```ini
CUSTOMER_MASTER_ROWS=247
CUSTOMER_WRITE_MODE=GENERAL
CUSTOMER_SEARCH_AUTHORITY=D1
CUSTOMER_WRITE_AUTHORITY=D1
GOOGLE_CUSTOMER_WRITE_AUTHORITY=NO
CUSTOMER_GENERAL_CUTOVER=YES
```

No Order mutation occurred.

## A56 frontend promotion
Customer browser behavior was promoted to main:
- searchCustomers => Cloud/D1 only.
- createCustomer => `/v1/t12/customers/write`.
- registered-customer resolution for Cloud Order CREATE => Cloud customer search only.
- no customer miss/error fallback to Apps Script.

Candidate CI:
- run `36572624648`: SUCCESS.

PR:
- #22

Main SHA:
`3b1f3cd4969d8fa30a1ff24c635978bf4799fdb9`

The A52 Orders stale-backoff / Cloud-native Order CREATE and runtime paths remain preserved.

## A57 — Cloudflare Pages attempt
A guarded Pages deployment was attempted:
- run `36573110208`.

It failed before any Worker/D1 mutation because the current Cloudflare API token lacks Pages API permission:
```ini
CLOUDFLARE_PAGES_API=AUTHENTICATION_ERROR_10000
PAGES_MUTATION=NO
WORKER_MUTATION=NO_IN_A57
D1_MUTATION=NO
```

The Pages route was abandoned; no broken frontend deployment was left active.

## A57B — Frontend moved to Cloudflare Worker Assets
To avoid requiring Pages permissions, a dedicated Cloudflare Worker static frontend was created:
- Worker name: `trendos-ui`
- URL: `https://trendos-ui.trendmall-contact.workers.dev`
- source main SHA: `3b1f3cd4969d8fa30a1ff24c635978bf4799fdb9`

The API Worker CORS configuration now accepts the new frontend origin.

Deployment:
- A57B run `36573466254`: SUCCESS.

Verified:
```ini
A57B_API_WORKER_DEPLOY=PASS
A57B_FRONTEND_WORKER_DEPLOY=PASS
A57B_FRONTEND_LIVE=PASS
A57B_API_CORS=PASS
A57B_CUSTOMER_GENERAL=PASS
FRONTEND_HOSTING=CLOUDFLARE_WORKER_ASSETS
FRONTEND_URL=https://trendos-ui.trendmall-contact.workers.dev
CUSTOMER_SEARCH=D1
CUSTOMER_WRITE=D1
```

No D1 business-data mutation occurred in A57B.

## A58 — Remaining Google runtime inventory
Active frontend/module audit:
- active JS files: 19
- distinct literal API actions: 80
- config still contains Google Apps Script as the generic API endpoint.

A58 run:
- `36573676009`: SUCCESS.

The 80 currently referenced actions include auth/session, Orders legacy reads/writes, attendance, HR, customer portal, accounting, Trend Master, customer manager, platform content, marketplace, files/conversations, press controls, notes, feedback, automation and related operations.

Important:
Customers are now Cloud-native and the UI is physically hosted on Cloudflare, but **TrendOS is not yet zero-Google overall** because generic `TREND_API_URL/API_URL` still points to Apps Script for the remaining non-customer actions.

The Cloud session bridge is also not fully Google-independent yet:
- D1 auth shadow is attempted first when enabled.
- a shadow miss still verifies employee session through `APPS_SCRIPT_API_URL`.

## Current exact authority map
```ini
FRONTEND_HOSTING=CLOUDFLARE_WORKER
FRONTEND_URL=https://trendos-ui.trendmall-contact.workers.dev

CUSTOMER_SEARCH=D1_NATIVE
CUSTOMER_CREATE_UPDATE=D1_NATIVE
CUSTOMER_GOOGLE_FALLBACK=NO

ORDER_CREATE=T12_D1_GENERAL
ORDER_CLOUD_NATIVE_RUNTIME=T12_D1
LEGACY_ORDER_READS_WRITES=PARTIALLY_GOOGLE_BACKED

GENERIC_API_BASE=APPS_SCRIPT
EMPLOYEE_LOGIN=GOOGLE_BACKED
EMPLOYEE_SESSION_BRIDGE=D1_SHADOW_THEN_APPS_SCRIPT
ACTIVE_LITERAL_API_ACTIONS=80

ZERO_GOOGLE_COMPLETE=NO
```

## Next execution order
1. Native employee/auth master in D1; remove Apps Script verification fallback.
2. Move remaining Orders legacy reads/writes fully to D1.
3. Attendance / cleaning / HR / Press.
4. Accounting and Party ledger.
5. Customer portal / drafts / conversations / uploads.
6. Trend Master / notes / customer-manager / feedback / automation.
7. Platform content / marketplace / franchise / white-label.
8. Change generic `TREND_API_URL/API_URL` to Cloudflare.
9. Runtime scan must prove:
```ini
SCRIPT_GOOGLE_RUNTIME=0
DOCS_GOOGLE_RUNTIME=0
APPS_SCRIPT_FALLBACK=0
GOOGLE_SHEET_AUTHORITY=0
```
Only after that should the Master Book be closed on the final architecture.
