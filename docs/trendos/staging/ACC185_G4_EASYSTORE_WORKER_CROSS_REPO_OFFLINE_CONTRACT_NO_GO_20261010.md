# ACC-185 — Cross-repo EasyStore UI / TrendOS finance Worker source contract (G4 offline, NO_GO)

**2026-10-10** — Read-only source qualification. This does **not** authorize deploying the frontend, a Cloudflare Worker or a finance operation.

## Why this is different from ACC-183/184

ACC-183 compiled one isolated merged Worker; ACC-184 demonstrated fail-closed pre-release evidence and a fake rollback model. Neither exercised the **original EasyStore frontend code from its own repo** together with the TrendOS native finance Worker. ACC-185 pins EasyStore public main at immutable **373d06381594e3ab32a55009fcc74907b1c37c9c**, observed on 2026-10-10. This is a Git code pin, NOT proof of the published frontend's deployed SHA.

The source contract verifies the real EasyStore app.js mentions ten current core finance actions and the original TrendOS Worker dispatch has an exact handler branch for each: purchase, sale, daily purchase, daily purchase approval, custody close, purchase reversal, daily department report, day close, customer account movement and daily automation. Exact finance-role guard and unknown-scope denial must still exist. Missing frontend/backend source, changed/missing action or role guard fails CI.

The script returns a JSON receipt with source digests and a mandatory NO_GO, not runtime acceptance. Deliberately excluded as **not yet proven live**: returns/refunds beyond isolated source behavior, production user acceptance, real staff finance grants, real G1 custody, real paid/unpaid debt reconciliation and real cashbox/stock opening. The owner chose from-zero **history import**, not physical zero stock, cash, or forgotten liabilities, and has NOT yet chosen a go-live date.

## Offline CI proof plan

The dedicated read-only workflow checks out TrendOS accounting source and exact EasyStore SHA into an isolated directory (not the published Pages site). It runs eight existing original EasyStore VM/frontend tests for custody/day close, automation, customer accounts, departmental authorization and daily purchases; then original TrendOS finance ACC-170 purchase/sale/debt/cashbox/day close, ACC-174 custody/purchase, ACC-175 fake role-scope tests and new ACC-185 ten-action positive/negative contract tests. Only sanitized SHA/code-presence metadata is uploaded for 14 days. There is no Cloudflare credential in the job and no D1, real POST, Pages or Worker deploy.

Initial source review found all ten named actions in both repositories. Whether CI passed must be obtained from the actual GitHub Actions run; do not claim the new automated checks green until verified.

## Required further acceptance

G1 live bounded authorized close not done. G2 real owner approved employee finance role matrix Issue #40 not done. G3 physical stock/cash/old liabilities and actual dated zero-import book signoff not done. G4 real whole-cycle finance acceptance and actual refunds/returns not done. G5 production protected backup and restore, previous live Worker version/rollback, safe pinned release and separate owner authority not done. All five remain OPEN; Release NO_GO. Do not use the old floating-shared deploy workflow.
