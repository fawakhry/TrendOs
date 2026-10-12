# ACC-190 — G2 fake employee scopes and server-side accounting cost redaction (NO_GO)

Date: 2026-10-12 (Egypt). No real identities, roster, permissions, finance login, D1 or production access was touched.

## Source-level privacy finding

The original \`getAccounting\` endpoint correctly advertises \`permissions.canSeeCosts=false\` for \`print\`, \`laser\`, and \`final\`. However its server response previously returned \`materials[].unitCost/computedUnitCost\`, \`templates[].inkCost/fixedCost/computedUnitCost\` and \`deptLines[].materialCost/operatingCost/otherCost/totalCost/systemCost/profit\` as numeric values, regardless of the verified server finance scope. Hiding these in a browser is insufficient because a user could inspect the HTTP JSON response.

## Narrow source-only correction

An explicit \`hideAccountingCostsV1\` projection in \`cloudflare-d1/src/employee-accounting-native-v1.mjs\` blanks *only the listed cost/profit fields* for \`getAccounting\` responses when server-verifed mode is not \`full\`. Field names remain present for compatibility; ordinary prices, quantities, names, department and flow records remain unchanged. \`full\` receives exact unredacted data.

No change to session verification logic, \`approvedAccountingModeV1\`, production grants env variables, real users, write paths, Cloudflare deploys, D1 migrations, finance canary or currently reported OFF/READONLY.

This is a narrow read-endpoint fix, **not** a broad claim that every response field or other endpoint is already privacy-qualified. Later reviews must check other read/writer responses and UI forms for accidental cost exposure separately.

## In-memory authentic Worker/migration tests

- Seed only synthetic printing and laser materials, templates, and department lines in disposable SQLite \`:memory:\`; no customer or real employee data.
- For server-verified strict \`print\` and \`laser\` grants, each sees only own department. For \`final\`, all departments appear but raw cost and profit are blank. A fake \`full\` grant sees the same original numeric costs. In every restricted scope the JSON permission flags agree with returned values.
- Browser \`role=admin\` spoof doesn't override an enforced strict server grant. Invalid fake token, mismatched username, missing/wildcard/duplicate/unsupported real-username mappings deny access.
- Backend READONLY denies writes even with synthetically allowed \`full\`; synthetic \`GENERAL\` only inside disposable memory checks other finance actors can't create supplier, post purchase or close day. Fake database record counts remain equal.
- Regression: ACC170/175/187/188/189 and old A2.10 no-bot-push guard.
- Real employee grant choice remains explicitly OPEN in [Issue #40](https://github.com/fawakhry/TrendOs/issues/40), not inferred or approved by these fake-role tests.

## Separate evidence and status

ACC189 source-only [PR #96](https://github.com/fawakhry/TrendOs/pull/96) was merged \`6ce367c924dddffaba02778873bf300a2495538d\` after 20/20 exact-head PR checks; 28/28 postmerge independent Actions were SUCCESS, including [ACC189 #38186201755](https://github.com/fawakhry/TrendOs/actions/runs/38186201755) and [ACC186 #38186201867](https://github.com/fawakhry/TrendOs/actions/runs/38186201867). Thus accounting safe source stage ACC189 may be recorded \`VERIFIED_COMPLETE\` in ACC186 ledger, *without claiming production inventory accepted*. ACC187 refund policy/implementation remains \`IN_PROGRESS_UNVERIFIED\`.

ACC190 at drafting is \`IN_PROGRESS_UNVERIFIED\` pending exact PR and postmerge CI. All G1–G5 real gates OPEN, finance release NO_GO. No real permission grant, production or live financial mutation.
