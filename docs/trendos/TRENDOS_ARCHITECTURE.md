# TrendOS Architecture

> Canonical architectural view. Current implementation truth and future product architecture are separated deliberately.

## 1. Current Core architecture — Phase 1

```text
Browser / GitHub Pages
        |
        v
Google Apps Script API
        |
        +---- WRITE ----> Google Sheets (authoritative)
        |
        +---- READ -----> Cloudflare Worker ----> D1 mirror/cache
        |                                      |
        |                                      +--> atomic Orders + Lines mirror
        |
        +---- FALLBACK -> Google Sheets
```

### Core rules

- Google Sheets remains authoritative for operational and financial writes.
- D1 is the fast read/mirror layer in the current phase.
- D1 must never expose partially promoted Orders/Lines as if complete.
- Read optimization must not weaken authorization, integrity, pricing, financial or delivery gates.
- Fallback to Sheets is required on unsafe D1/network/health/parity states.

## 2. Current Core components

### Frontend
Primary production lineage:
- `index.html`
- `app.js`
- `styles.css`
- `config.js`

Relevant modules include Manager Center, Customer Manager, Attendance, HR, Cleaning, Press and Go-Live UI modules.

### Apps Script
Core plus modules:
- `Code.gs`
- `v1932-router.gs`
- `customer-manager-backend-v1932.gs`
- `customer-feedback-backend-v1.gs`
- `attendance-backend-v1.gs`
- `attendance-clockin-backend-v1.gs`
- `hr-backend-v1.gs`
- `cleaning-backend-v1.gs`
- `press-control-backend-v1.gs`
- `go-live-autopilot-v1.gs`

Important mismatch to inventory:
- V1940 manifest referenced `go-live-autopilot-backend-v1.gs` while repo lineage uses `go-live-autopilot-v1.gs`.

### D1 / Cloudflare
Current approved direction:

```text
Google Sheets
   | Orders + Lines
   v
Apps Script sync
   |
   +--> Stage Orders
   +--> Stage Lines
   v
Atomic Promote
   v
D1 live mirror
   v
Fast page read/cache
```

Current known performance lineage:
- Primary D1 read.
- Fast V2.1.
- Fast V2.2 support/page cache.
- Fast V2.3 stable page cache — verified path.
- Fast V2.4 auth cache — prepared, not verified.

## 3. Shared integrity layer target

Create a single backend integrity module before module-specific P0 patches:

`trendos-integrity-v1.gs`

Target responsibilities:
- normalize Order ID / Line ID.
- business date and business schedule.
- shared open/closed state definitions.
- stable event keys.
- idempotency claim/complete/lookup.
- scoped locks.
- automation-run start/finish logging.

Every critical event should be traceable as:

`Event -> Entry Point -> Lock -> Idempotency Key -> Sheets Written -> Retry Behavior`

## 4. Target TrendOS V1 architecture — 01/03/2027

```text
                         TrendOS Control Center
                                  |
      +---------------------------+---------------------------+
      |                           |                           |
      v                           v                           v
 Core Operations            Customer World               Matbagy AI
 Customers                  Customer 360                 Knowledge
 Orders                     Portal                       Approved Replies
 Order Lines                Unified Inbox                Local Models
 Production                 WhatsApp                     Learning
 Accounting                 Feedback                     Live Connectors
 Payments                   Loyalty
 Delivery
      |                           |                           |
      +---------------------------+---------------------------+
                                  |
                     +------------+-------------+
                     |                          |
                     v                          v
               Smart Designer               Growth
               Templates                    Lead Hunter
               Layer Editor                 CRM
               Proof Approval               Follow-up
               Design Archive               Conversion
```

## 5. Customer lifecycle contract

TrendOS V1 must support one continuous lifecycle:

`Lead -> Customer -> Order -> Order Line -> Design (if required) -> Proof -> Approval -> Production -> Invoice -> Payment -> Delivery -> Feedback -> Learning`

No module should create a parallel customer/order identity when an existing canonical ID can be used.

## 6. Canonical identifiers

- `Customer ID` / approved customer identity key.
- `Order ID` — logical order key.
- `Line ID` — logical unique active line key.
- `Design ID` — future design/proof lineage key linked to Order ID + Line ID.
- `Draft ID` / `Invoice ID` — accounting lineage.
- `Session ID` — production/press session lineage.
- `Meta Message ID` — WhatsApp event idempotency when available.
- `Run ID` — automation/observability lineage.

## 7. Matbagy AI boundary

```text
Knowledge / policies / approved language --> Matbagy AI memory/RAG
Operational facts -----------------------> TrendOS live connector
```

AI must not infer or invent:
- current order status.
- final approved price.
- stock availability.
- payment/settlement state.
- customer approval.
- delivery promise.

## 8. Smart Designer boundary

Target production flow:

`Order Line -> Design Request -> Template Engine -> Layer Editor -> Local/Premium AI if needed -> Proof -> Customer Approval -> Print Ready -> Archive`

Current preferred cost-control pattern:
- Template Engine for common jobs.
- Layer edits do not count as AI regeneration.
- Local AI where useful.
- Premium AI only for difficult/paid cases.

## 9. Growth boundary

Lead Hunter ultimately becomes CRM acquisition input:

`Facebook/Instagram/other source -> Lead -> Qualification -> Customer -> Order`

No unapproved scraping architecture is part of the canonical plan.

## 10. Multi-tenant future

After TrendOS V1 is stable, the architecture may expand to:
- separate tenant data.
- separate users/roles.
- separate WhatsApp/channel configuration.
- separate AI knowledge/memory.
- separate pricing/templates/brand settings.

Marketplace, suppliers, logistics and white-label network expansion are **post-V1** and are not blockers for 01/03/2027 launch.