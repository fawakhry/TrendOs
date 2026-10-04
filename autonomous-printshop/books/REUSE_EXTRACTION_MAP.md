# Autonomous Printshop — Reuse / Extraction Map

Date: 2026-10-05  
Purpose: decide exactly what existing work is reused, continued, modified, or deferred for the autonomous-printshop program.

| ID | Existing project/module | Canonical source | Current evidence | Decision | Required modification | Autonomous target | Priority |
|---|---|---|---|---|---|---|---|
| R01 | TrendOS Orders + Customers | `fawakhry/TrendOs` | Runtime-qualified Cloud/D1 paths | REUSE IN PLACE | expose stable connector/events; do not duplicate data | Source-of-truth connector | P0 |
| R02 | TrendOS Employee Ops | `cloudflare-d1/src/employee-ops-native-v1.mjs` | Ops GENERAL / epoch 7 | REUSE IN PLACE | emit structured operational events for supervisor | Ops signal source | P0 |
| R03 | Operator Task Workflow V2 | TrendOS candidate + blackbox | Contract/preview qualified; current live status needs fresh runtime qualification | CONTINUE + MODERNIZE | replace historical Google Task authority with D1 authority; preserve API and dispatch invariants | Physical Execution Engine | P0 |
| R04 | Gaber Material Control | TrendOS candidate chain Checkpoint 01..05 | Pure core/ledger/UI/backend CI-qualified historically; not accepted as current production authority | CONTINUE + GENERALIZE | D1 persistence; EasyStore financial adapter; Laser+Print+future departments; no double decrement | Material/Inventory Agent | P0 |
| R05 | Matbagy-OS Runtime | `fawakhry/Matbagy-OS@main` | Sandbox/runtime foundation + tenant D1/contracts | REUSE AS ORCHESTRATOR BASE | TrendOS connector; per-family autonomy modes; action execution/audit | AI Control Plane | P0 |
| R06 | صندوق مطبعجي Cases/Knowledge | `Matbagy-OS/صندوق_مطبعجي/` | 16 current cases + contracts | EXTRACT KNOWLEDGE | promote approved cases into executable Product Recipes; clean stale storage assumptions | Design Recipe Engine | P0 |
| R07 | Matbagy Evaluations | `fawakhry/Matbagy/evaluations` + recovered source | Cloud pilot history; code recovered from user files | RECOVER + CONTINUE | TrendOS event connector; scheduled analysis; evidence-first profiles; protected employee decisions | Customer/Employee Intelligence | P0/P1 |
| R08 | Employee Manager Strips / Ops Coach | TrendOS frontend modules | Existing operational UX/source | REUSE UX, REPLACE DECISION SOURCE | no “first row” dispatch; task comes from Operator Task/AI Scheduler | Employee Supervisor UI | P1 |
| R09 | ANDON | TrendOS ANDON modules | Existing reason buttons + historical append-only integrity | CONTINUE | structured D1 incident/event; auto resolver; escalation ownership/SLA | Exception Engine | P1 |
| R10 | Customer Manager / Feedback | TrendOS modules | source exists; Comms family not assumed GENERAL | CONTINUE AFTER GATE | unify with intelligence profile; D1/R2; safe escalation | Customer Operations Agent | P1 |
| R11 | Whats Agent | `WHATS_AGENT_BOOK.md` + integrity source | Meta Coexistence/onboarding dependency remains | DEPENDENCY / CONTINUE SEPARATELY | finish coexistence/webhook/manual send/idempotency before auto reply | Customer Intake/Comms | P1 |
| R12 | Go-Live Autopilot | TrendOS source | operational draft/notification patterns | EXTRACT PATTERNS ONLY | remove finance authority; use only ready/follow-up workflow patterns | Completion/Notification Agent | P2 |
| R13 | EasyStore | `fawakhry/EasyStore` | Accounting READONLY in TrendOS program | KEEP SEPARATE AUTHORITY | explicit read/controlled write contracts later | Finance Authority Adapter | P1 dependency |
| R14 | Lead Hunter / CRM | TrendOS roadmap | product idea, not current 60-day blocker | DEFER | integrate only after autonomous operations stable | Growth Agent | P3 |
| R15 | Work Queue V1 | TrendOS | superseded | DO NOT USE | none | none | DROP |
| R16 | Matbagy-Design-Workflow old repo | deleted after migration | migration report proves Matbagy-OS successor | DO NOT USE | Fokha pointer corrected | none | DROP |

## P0 critical path

```
TrendOS Connector
 -> Autonomy Policy/Event Ledger
 -> Matbagy-OS Orchestrator Adapter
 -> Operator Task V2 D1 Authority
 -> Design Recipe Engine
 -> Material/Inventory Ledger
 -> Evaluations Intelligence
 -> Shadow Supervisor
```

## Source extraction rules

- Do not copy TrendOS business data into a second source of truth.
- Do not copy Matbagy-OS runtime wholesale; consume/adapt modules with explicit contracts.
- Recovered Evaluations source is imported into `autonomous-printshop/quarantine/evaluations-recovered/` because its executable code was missing from GitHub.
- Design cases remain canonical in Matbagy-OS; this project stores only extracted recipe rules + source case IDs.
- Historical Google adapters may be studied for semantics but are not the target authority.
- Every reused historical candidate requires current-runtime requalification before production activation.
