# AI_Orders_View V1890 — Extracted lineage

Source authority: `fawakhry/TrendOs@candidate/t12-full-cloud-cutover-a56-20260929:Code.gs`

This file is an extracted reference, not runtime code.

## What the old component did

`AI_Orders_View` created an AI-friendly projection from the operational order Sheet with:

- `order_id`
- `customer_name`
- `customer_phone`
- `status`
- `department`
- `item_name`
- `expected_delivery`
- `last_update`
- `is_open`
- `sheet_row`
- `ai_reply`
- `notes`

It also made archived orders discoverable by exact Order ID without restoring them into the active operating Sheet.

## Reuse decision

`EXTRACT_CONCEPT_ONLY`

Keep:
- AI-friendly operational projection;
- exact identity/traceability;
- open/closed classification;
- archive visibility.

Do not keep:
- a rebuilt Google Sheet as runtime truth;
- scheduled Sheet refresh as the supervisor's source of truth;
- pre-rendered customer reply text as an employee-supervisor decision.

Target replacement:
`D1 -> Operational Reality Snapshot -> deterministic dispatch/supervisor decisions`.
