# T12 — Order Create Parity Matrix — 2026-09-19

Scope: repository baseline only. This is **not** a claim that GitHub `Code.gs` is byte-equal to live Apps Script Version 155.

| Canonical behavior | Repository `createManualOrder_` evidence | Cloud V2 state | T12 requirement |
|---|---|---|---|
| Employee authorization | `authorize_(username, token)` + `canCreateOrder_` | intent contract has no auth side effect | Cloud session/role parity required before cutover |
| Serialization / concurrency | global ScriptLock, 30s | none | D1 atomic transaction + single authority boundary |
| Idempotency | request key + saved-response replay in Script Properties | clientRequestId required | D1 durable idempotency ledger; no PropertiesService |
| Registered customer identity | customer name lookup + phone fallback | name + phone required | qualify exact live identity semantics |
| External/light customer | 3+ digit ID, no registered customer write | modeled | parity test required |
| Debt policy | debt amount + delivery restriction annotation | listed as required side effect | exact policy parity required |
| Department normalization | مكبس -> طباعة + heatPress | modeled | PASS at contract level |
| Fly print | printing only, urgent priority | modeled | PASS at contract level |
| Recent duplicate guard | fingerprint, recent active lines | not executed by V2 | D1 duplicate query/constraint required |
| Open-order reuse | same identity/department may reuse order | not executed by V2 | must be modeled before write candidate |
| Old open-order rejection | >2 day open order can block | not executed by V2 | parity required |
| Business Order ID | numeric Apps Script allocator | V2 refuses preallocation | **BLOCKER: allocation authority design required** |
| Line ID | `orderId-01`, next line from source | not allocated | D1 atomic line allocator required |
| Multi-department | split Print + Laser lines | intent preserves multi | candidate must create both atomically |
| Order summary | upsert before line create, or resync on reuse | required side effect only | D1 header/line transaction parity |
| Order lines | append one/two lines | required side effect only | D1 canonical line persistence |
| Activity log | append create/add-line event | required side effect only | D1 event ledger parity |
| Trend Master queue | queue per created line | required side effect only | outbox/event handoff required |
| Data version | bump Script Property | required side effect only | replace with D1 monotonic/change-event mechanism |
| Saved response | up to 8KB Script Property | required side effect only | replace with D1 idempotency result row |
| Timeout replay | saved response + duplicate scan | no runtime candidate yet | lookup-before-retry required |

## Current blocker: business Order ID authority

A production canary cannot safely let Google and D1 independently allocate the same numeric business Order ID namespace.

Unsafe options:
- independent D1 numeric counter while Apps Script still creates orders;
- generating `CW-...` as if it were the canonical production Order ID;
- relying on a post-write reconciliation to discover an ID collision.

Safe T12 directions to qualify:
1. **Shadow-intent lane**: Cloudflare validates and persists an intent without allocating the business Order ID. No customer-visible create cutover.
2. **Atomic authority switch for Order-create allocation**: at the future approved cutover boundary, exactly one allocator becomes authoritative and the other create path is disabled/fallback-only before the first authoritative create.
3. A new business ID namespace only if separately approved as a business-contract change.

T12 currently selects direction 1 for engineering preparation. Direction 2 requires live Version 155 exact-source reconciliation and an explicit owner-approved production checkpoint.

## PropertiesService incident relevance

Repository baseline stores V1908 saved create responses in Script Properties under `TRENDOS_CREATE_ORDER_V1908_<requestKey>`.
The repository baseline contains no same-key cleanup call for these entries.

This is a plausible accumulation mechanism relevant to the quota incident seen on 2026-09-19, but it is **not asserted as the proven live Version 155 root cause** until live source/property evidence confirms it.

## Production boundary

No route wiring, no deployment, no D1 production mutation, no Apps Script deployment, no Google Sheet write, no secret/config change, and no authority transfer are authorized by this matrix.
