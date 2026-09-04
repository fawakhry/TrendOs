# PERF-CF-02BH — Staging Synthetic Auth Bridge Qualified

Date: 2026-09-05 (Egypt local)
Branch: `agent/go-live-2026-09-01-integrity`
Status: **VERIFIED / PASS**

## Result

A staging-only synthetic employee identity was created in the isolated staging workbook and the V2 auth bridge qualification was added and verified.

- Staging workbook: `1b5UNM4p77LT_pkP1yiw5VrPaw5589gM-cPzxuJLtH7s`
- Production workbook: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Synthetic staging username: `cw_stage_service`
- Canonical role: `service`
- Production account used: **NO**
- Cloud-supplied credentials accepted: **NO**
- Token returned/logged by qualification helper: **NO**
- `authorize_()` invoked by qualification helper: **NO** (its failure path can mutate the token cell)
- `createManualOrder_()` invoked: **NO**

The live Apps Script contract was inspected: `roleFromArabic_` maps service/customer-service roles to `service`; `canCreateOrder_` permits `service`; `authorize_` requires an active user, token and non-expired session.

## CI evidence

Workflow: `TrendOS Cloud Write Order Contract V2 Gate`
Run: `33921835982`
Head: `8aaeb94c4ecdc2a318f760a162da1c2fa1716a4d`
Conclusion: **success**

Verified step:
`Verify staging synthetic auth bridge qualification` → **success**

## Safety state

- Production Cloud Write V1: **OFF**
- Production Apps Script `Code.gs`: **unchanged by V2 staging patches**
- Production spreadsheet mutation: **NONE**
- Canonical invocation after this gate alone: **NOT ALLOWED**

Next gate: `PERF-CF-02BI` canonical side-effect qualification.
