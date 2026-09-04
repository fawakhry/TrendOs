# MATBAGY / FOKHA ROUTING + MEMORY SYNC — 2026-09-04

**Status:** VERIFIED MEMORY / ROUTING UPDATE  
**Scope:** Matbagy design-memory routing, Google Drive storage layout, Fokha source linking, Multi-AI memory workflow.  
**Production impact:** NONE on TrendOS runtime, Apps Script, Sheets authority, Cloudflare cutover, or CORE-P0.

## 1) Canonical repository separation

There are three distinct GitHub locations that must never be conflated:

1. `fawakhry/Matbagy`
   - separate Photo Sheets / UI repository.
   - NOT the canonical Matbagy design-memory box.

2. `fawakhry/TrendOs/FOKHA_BRAIN`
   - Fokha executive brain / cross-project organized memory.
   - NOT the canonical Matbagy Design Case memory.

3. `fawakhry/Matbagy-Design-Workflow`
   - canonical Matbagy Design Memory repository.
   - working branch: `agent/initial-mvp`.
   - entry point: `صندوق_مطبعجي.md`.
   - then read: `صندوق_مطبعجي/اقرأني_أولاً.md`.

Canonical human trigger remains:

`ادخل جيت هب صندوق مطبعجي`

Routing rule: the AI must resolve the trigger to the exact Repository + Branch + Entry Point above, not infer from repository name similarity or default branch.

## 2) Redirect guards implemented

To prevent old chats/agents from selecting the wrong repository:

- `fawakhry/Matbagy` contains explicit redirect/guard content stating it is not the Matbagy design-memory box.
- `fawakhry/TrendOs` and `FOKHA_BRAIN` contain separation/redirect guidance.
- `fawakhry/Matbagy-Design-Workflow` on `main` contains redirect entry files that point to `agent/initial-mvp`.
- canonical branch entry also contains the repository-routing rule.

## 3) Google Drive project root

Matbagy now uses one visible project root in My Drive:

`مشروع مطبعجي - Matbagy Project`

Project Root ID:
`1kP_JAO-ZOJltX9FCkAsylxYAfRar-RQV`

Current child structure:

- `01_Design_Cases` — `1qhoxC_c2MF3X_hhHcWiDo2SzW2ySCch_`
- `02_Orders` — `19vhyOha215dLr5_pxv8BdZy_-sq7LgDm`
- `03_Shared_Assets` — `1cBMs21DKCuTPzcfmkj2UjgFfHdqQGVgl`
- `04_Archive` — `1kke5hm_Bsq1Q_XHEuTpOkTTRkjpMEz5K`
- `05_System` — `14amOaEUH4kGP4iFWTlMDfZ1c3c9edMH7`

Canonical Design Case path:

`My Drive/مشروع مطبعجي - Matbagy Project/01_Design_Cases/YYYY/<CASE_ID>/`

Rule: no new Matbagy Case/Asset should be created directly in My Drive root.

The former root folder was moved/renamed instead of copied so existing Drive IDs and bindings remain stable.

## 4) Existing case binding preserved

Existing case:
`DESIGN-2026-000001`

Known linked source asset:
`DESIGN-2026-000001-A001`

Drive file ID:
`1srMthjL-cR0cdk7VOOkMZjrEmUCWwFS-`

The asset remains linked under the same Case folder after storage reorganization.

## 5) Multi-AI room direction

Approved architecture:

`User + ChatGPT + Gemini`

Roles:

- ChatGPT: `Design Orchestrator + Memory Manager + Workflow Planner + Final Synthesizer`.
- Gemini: `Visual Intelligence + Design Reviewer + Reference Comparator`.
- User: final approver / Full Override.

AI authority:
`ADVISORY_ONLY`

Default future BOOM flow:

`User -> ChatGPT -> Gemini when useful -> ChatGPT synthesis -> User`

Default AI-to-AI cap: 3 rounds before returning control to the user.

## 6) Current Gemini reality before API integration

Gemini chat currently used by the owner may not have direct GitHub read/write access.

Temporary no-API workflow:

`ChatGPT -> MATBAGY_HANDOFF_PACKET -> User -> Gemini -> GEMINI_RESULT_PACKET -> User -> ChatGPT -> GitHub persistence`

Therefore no agent may claim Gemini has persisted to GitHub unless there is actual write evidence.

Later target:

`Matbagy UI -> Matbagy AI Orchestrator -> OpenAI API + Gemini API -> Matbagy Design Memory + Google Drive Assets`

API keys must remain server-side only.

## 7) Case lifecycle / versions / disagreement preservation

Design Cases use explicit lifecycle and version history.

Core phases:
`OPEN | UNDER_REVIEW | REVISION_REQUIRED | WAITING_CUSTOMER_APPROVAL | FINAL_APPROVED | CLOSED | REOPENED`

Every design attempt has a stable version such as `V1`, `V2`, `V3`.

Failed attempts without reviewable output remain recorded as negative history and are not silently overwritten.

ChatGPT/Gemini disagreement is preserved in the Case Room and resolved by owner/customer evidence; one AI must not erase the other opinion.

## 8) Knowledge extraction / cumulative know-how

Closed work is not only archived.

Target learning pipeline:

`RAW WORK -> EVIDENCE -> CASE MEMORY -> LESSONS -> KNOWLEDGE CANDIDATES -> VALIDATION -> PROMOTED KNOWLEDGE -> BETTER NEXT CASE`

Knowledge must retain Case/Version/Evidence lineage.

AI opinion alone may create a candidate but cannot become a Global Rule without suitable evidence/owner approval.

Rejected/failed work remains Negative Learning.

Future evidence sources may include authorized WhatsApp conversations, proof approvals, local design files after controlled ingestion, Drive assets, and TrendOS order context through source-of-truth connectors.

## 9) Chat deletion resilience

The user plans to extract old ChatGPT conversations and then delete them.

Rule:

- extract Draft first;
- save only after explicit owner approval (`اعتمد وسجل` or equivalent);
- verify Case persistence and asset binding state;
- only then emit `SAFE_TO_DELETE_CHAT`.

If persistence is not verified:
`NOT_SAFE_TO_DELETE_CHAT — PERSISTENCE_NOT_CONFIRMED`

## 10) Fokha Brain synchronization

Fokha Brain remains the cross-project executive memory, not a replacement for project truth.

On 2026-09-04 the following were written first to Google Sheet `Fokha - Idea Inbox` and then synchronized to GitHub `FOKHA_BRAIN`:

- Matbagy canonical repository routing decision.
- project-routing rule requiring exact Repository + Branch + Entry Point.
- Matbagy Design Memory added as a managed project.
- canonical GitHub design-memory source link.
- Google Drive private asset-storage source link.

Fokha source chain:

`Fokha -> Project -> Project Memory / Black Box -> Runtime Evidence`

## 11) TrendOS truth boundary

This checkpoint does NOT alter TrendOS live operational authority.

- Live Order/Payment/Production/Inventory/Delivery facts remain from TrendOS source-of-truth/connectors.
- Google Sheets + Apps Script remain authoritative writes unless a separately verified cutover says otherwise.
- Matbagy AI memory is advisory/contextual design knowledge, not live operations truth.

## 12) No production changes from this checkpoint

This update did not:

- change production Apps Script.
- change source Sheets.
- change Script Properties/triggers.
- change Cloudflare production traffic.
- enable Cloudflare authoritative writes.
- resume CORE-P0.

This is a memory/routing/storage-governance checkpoint only.
