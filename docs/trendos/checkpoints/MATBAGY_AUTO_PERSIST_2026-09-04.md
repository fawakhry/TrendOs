# MATBAGY AUTO-PERSIST — 2026-09-04

**Status:** USER-APPROVED MEMORY WORKFLOW / ACTIVE IN MATBAGY DESIGN MEMORY RULES  
**Production impact on TrendOS:** NONE

## Decision

The owner removed the human approval gate from Matbagy design-chat memory ingestion.

Previous flow required a Draft followed by an explicit command such as:

`اعتمد وسجل`

before Case persistence and Drive upload.

New canonical flow:

`READ CHAT -> EXTRACT -> DEDUP -> CREATE/UPDATE CASE -> UPLOAD AVAILABLE ASSETS -> WRITE DRIVE IDS -> PERSIST GITHUB -> SHOW DRIVE LINKS FOR OPTIONAL VERIFICATION`

## Meaning

- Case-memory persistence is automatic after extraction and duplicate prevention.
- The owner does not need to approve every Case before persistence.
- Google Drive links are shown after persistence for optional verification only.
- Memory persistence is distinct from final-design approval.
- Final-design approval remains evidence-based.
- Image execution/generation is a separate intent from persistence.

## Failure handling

If an image generation/edit attempt fails or produces no reviewable result:

- record the attempt as `FAILED_NO_RESULT`;
- do not create a fake Result Asset;
- continue persisting the Case memory;
- do not retry generation merely because persistence runs;
- retry only after a new explicit execution command.

## Canonical Matbagy implementation references

Repository:
`fawakhry/Matbagy-Design-Workflow`

Branch:
`agent/initial-mvp`

Updated/new contracts:
- `صندوق_مطبعجي/SCHEMA/AUTO_PERSISTENCE_POLICY.md`
- `صندوق_مطبعجي/SCHEMA/APPROVAL_COMMAND_ROUTER.md`
- `صندوق_مطبعجي/INSTRUCTIONS/SAVE_APPROVED_CASE.md` (legacy filename, auto-persist behavior)
- `صندوق_مطبعجي/اقرأني_أولاً.md`
- `صندوق_مطبعجي/PROMPTS/AI_ROOM_CHATGPT_PROMPT.md`
- root `صندوق_مطبعجي.md`

## Verification-output expectation

After successful extraction/persistence, the user-facing result should include when available:

- Case ID.
- Google Drive Case folder URL.
- links to uploaded Assets.
- counts for `LINKED`, `PENDING_UPLOAD`, `MISSING`.
- `design_final_approval` state.
- `SAFE_TO_DELETE_CHAT` only when persistence is actually verified.

## Fokha sync

This owner decision was written to the Google Sheet `Fokha - Idea Inbox` and synchronized into GitHub `FOKHA_BRAIN` as:

- Decision: `DEC-20260904-MATBAGY-AUTOPERSIST-001`
- Rule: `RULE-016`

## TrendOS boundaries

This decision does not alter:

- TrendOS Order/Payment/Production/Inventory/Delivery source-of-truth.
- Google Sheets + Apps Script authoritative writes.
- Cloudflare production cutover.
- CORE-P0 pause state.
- any production Apps Script source or deployment.

It is a Matbagy design-memory ingestion workflow decision only.