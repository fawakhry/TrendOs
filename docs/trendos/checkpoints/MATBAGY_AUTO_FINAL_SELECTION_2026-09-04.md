# MATBAGY AUTO FINAL SELECTION — 2026-09-04

**Status:** USER-APPROVED MEMORY WORKFLOW / ACTIVE IN MATBAGY DESIGN MEMORY RULES  
**Production impact on TrendOS:** NONE

## Decision

The owner removed the human confirmation gate not only from Case persistence, but also from selecting the archival final design result during old-chat extraction.

Canonical flow:

`READ CHAT -> EXTRACT -> DEDUP -> CREATE/UPDATE CASE -> AUTO-SELECT ARCHIVAL FINAL -> UPLOAD AVAILABLE ASSETS -> WRITE DRIVE IDS -> PERSIST GITHUB -> OPTIONAL VERIFY`

## Auto archival final selection

Selection priority:

1. explicit final/approval evidence inside the source chat;
2. otherwise, latest successful result that was not rejected and was not followed by a clear revision request;
3. otherwise, latest explicitly liked/partially accepted result not later rejected;
4. if no valid result exists: `NO_VALID_FINAL_ASSET`.

The system must not wait for a new owner command such as `اعتمد التصميم النهائي` merely to archive a final result.

## Truth separation

Archival final selection is not the same as customer approval.

If customer approval is not documented, record it separately, e.g.:

`customer_approval_status: NOT_DOCUMENTED`

Do not fabricate customer approval.

## Verification

Google Drive links are shown after persistence for optional owner verification only. Viewing those links is not a persistence or final-selection gate.

## Canonical Matbagy references

Repository: `fawakhry/Matbagy-Design-Workflow`  
Branch: `agent/initial-mvp`

Updated contracts/prompts:
- `صندوق_مطبعجي/SCHEMA/AUTO_PERSISTENCE_POLICY.md`
- `صندوق_مطبعجي/SCHEMA/APPROVAL_COMMAND_ROUTER.md`
- `صندوق_مطبعجي/PROMPTS/AI_ROOM_CHATGPT_PROMPT.md`
- `صندوق_مطبعجي/PROMPTS/AI_ROOM_GEMINI_PROMPT.md`

## Fokha synchronization

Decision also written to `Fokha - Idea Inbox` and recorded in `FOKHA_BRAIN/MEMORY/MATBAGY_AUTO_FINAL_SELECTION_2026-09-04.md`.

## TrendOS boundaries

This checkpoint does not alter:
- Order/Payment/Production/Inventory/Delivery source-of-truth.
- Google Sheets + Apps Script authoritative writes.
- Cloudflare production cutover.
- CORE-P0 pause state.
- production Apps Script code or deployment.

It is a Matbagy design-memory workflow checkpoint only.