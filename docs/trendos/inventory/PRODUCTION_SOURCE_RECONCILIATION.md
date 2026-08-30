# TrendOS Phase 0 — Production Source Reconciliation

> Scope: read-only reconciliation of frontend runtime pointers, Apps Script deployment metadata/Project History evidence, current editor source supplied in the conversation, GitHub history, prepared deployment manifests, Library builds and live runtime evidence.
> Date: 2026-08-30.

## Status

`INV-10 — exact production source/version manifest`: **PARTIAL — VERSION 143 IDENTITY + TOP-LEVEL D1 ROUTES VERIFIED; COMPLETE VERSION 143 FILE LIST REMAINS INACCESSIBLE**.

This is now a **documented evidence boundary**, not an invitation to guess the missing file list.

Evidence precedence:

`LATEST VERIFIED LIVE/PROJECT-HISTORY > DEPLOYMENT METADATA > CURRENT EDITOR SOURCE > GITHUB HISTORY > PREPARED MANIFEST > HISTORICAL PACKAGE`.

Critical rule:

`Current Apps Script editor source != deployed Version 143 unless the specific code is proven by Project History/runtime.`

---

## 1. Production endpoint and deployment

Frontend `config.js` points directly to Apps Script deployment:

`AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg`

Main workbook ID:

`1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

Verified Manage Deployments evidence:
- Active Web app.
- Version **143**.
- timestamp **Aug 29 2026 11:37 PM**.
- deployment-ID prefix matches production frontend config.

Results:
- `INV-10A = PASS`.
- `INV-10B = PASS`.

---

## 2. Live Version 143 runtime identity

Read-only health response from the active deployment returned:
- `success: true`.
- backend label `V1932_FULL_GO_LIVE_20260824`.
- workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.
- Users / Orders / Lines present.
- 87 sheet names.

Result:

`INV-10C = PASS — LIVE RUNTIME IDENTITY`.

Health proves backend/workbook identity, not every helper/file implementation.

---

## 3. Version 143 top-level D1 routes are directly verified

Apps Script **Project History -> Version 143** source was inspected for the relevant top-level routes.

Verified exact lines:

```javascript
else if (action === "getDashboard") result = getDashboardD1PrimaryV1_(e);
else if (action === "getRowsPageV1931") result = getRowsPageD1FastV2_(e);
```

Therefore earlier uncertainty about whether Version 143 itself used D1 is closed.

Result:

`INV-10D = PASS — VERSION 143 SOURCE SNAPSHOT`.

Production Orders/Dashboard read routing is not the old GitHub direct-Sheets routing.

---

## 4. GitHub source history changed from modular V1932 to consolidated V1932 on Aug 24

### 4.1 Original PR #11 design was modular

PR #11 (`TrendOS V1932 Manager Layer`, merge commit `3a78f7d10e820a6ce6678f461e47c1ec9ae9bad5`) explicitly stated:
- V1932 backend features were provided as separate `.gs` modules.
- `Code.gs` only needed the new router calls near `doGet/doPost`.
- the rest of V1932 was intended to remain in separate files.

This is the lineage behind `v1932-router.gs` and standalone Customer Manager/etc. modules.

### 4.2 V1940 deploy manifest belongs to that modular lineage

`APPS_SCRIPT_DEPLOY_V1940.md` was committed at:

**2026-08-24 10:00:20 UTC**

and instructs a project containing:
- `Code.gs`
- `v1932-router.gs`
- Customer Manager
- Feedback
- Attendance / Clock-in
- HR
- Cleaning
- Press
- Go-Live Autopilot

as separate files.

### 4.3 Later the same day `Code.gs` became a full single-file V1932 backend

Commit:

`a39fe9a0dde62232a9f25db92c4697e07af158e9`

at:

**2026-08-24 17:38:01 UTC**

changed `Code.gs` header/version to:

```text
V1932 FULL Go-Live / HR / WhatsApp / Attendance / Press
V1932_FULL_GO_LIVE_20260824
```

and added the block:

```text
TrendOS V1932 FULL CONSOLIDATED BACKEND — 2026-08-24
Customer Manager / WhatsApp / Feedback / Go-Live invoices
Attendance / Clock-in / HR / Cleaning / Heat Press Control
```

So the consolidated-Code commit occurred about **7h 38m after** the modular V1940 manifest.

### Conclusion

The V1940 manifest is useful historical deployment guidance, but it is **not a safe authoritative file list for the later consolidated Code lineage or Version 143**.

Do not combine its file list mechanically with the current/full consolidated `Code.gs`.

---

## 5. Composition compatibility constraint

The consolidated `Code.gs` defines V1932 global names/constants/functions that are also defined by the older standalone module files, for example Customer Manager `CM_*` constants and functions.

Therefore the exact consolidated Code and exact old standalone modules represent **overlapping implementations**, not additive independent modules.

At minimum this creates duplicate-global-name risk and ambiguous source ownership; with top-level lexical declarations it may prevent a valid combined script depending on exact declarations/runtime parsing.

Safety decision:

**Never rebuild production by copying the old modular manifest on top of the consolidated current Code.**

The two lineages must first be deliberately reconciled into one canonical implementation per module.

---

## 6. Strongest supported Version 143 lineage statement

Verified facts:
1. Version 143 top-level `Code.gs` routes Dashboard/Orders to D1 helpers.
2. live backend version label is `V1932_FULL_GO_LIVE_20260824`.
3. current supplied editor `Code.gs` is a V1932 FULL single-file build and contains the same backend label.
4. GitHub has a documented Aug-24 single-file consolidation lineage with that same label.
5. current editor source is newer than GitHub in D1 top-level route wiring.
6. D1 live-sync source inspected in editor is not represented by current GitHub `Code.gs`, proving additional current-source delta/module presence.

Strong working hypothesis:

**Version 143 belongs to the consolidated-V1932 lineage plus later D1 modules/deltas, rather than being a literal deployment of the earlier modular V1940 manifest.**

This is a working hypothesis, not a complete file manifest.

Unknown remains:
- exact Version 143 file names/list.
- whether every V1932 submodule is physically inside Version 143 `Code.gs` or some were split/replaced in that deployed snapshot.
- exact file containing each D1 helper in Version 143.
- exact presence/version of deployment-health helper.
- exact Customer Manager/Feedback helper lineage in Version 143.

---

## 7. WhatsApp/Feedback source drift proves why full composition matters

Accessible source families conflict materially:
- current merged Customer Manager `cmAppendMessage_()` contains UserLock + Meta Message ID duplicate protection.
- older standalone `customer-manager-backend-v1932.gs` blindly appends messages.
- merged webhook calls `cmMetaMessageExists_()`, but that helper definition was not found in any accessible merged/Library/GitHub/Drive source snapshot.
- standalone Feedback backend has a stronger ScriptLock/Order duplicate guard than the merged `cfScan_()` path.

Live Feedback data also has duplicate Order IDs and mixed schema lineages.

Therefore top-level health/function existence cannot tell us which exact sub-implementation Version 143 is executing.

This keeps complete source composition `PARTIAL` and forbids blind redeploy.

---

## 8. V1940 deployment-health is insufficient for source reconciliation

`trendosV1940DeploymentHealth_()` checks top-level module function presence.

It does not prove:
- exact function implementation/version.
- webhook dependency graph (`cmMetaMessageExists_` etc.).
- duplicate global implementations absent.
- outbound idempotency.
- D1 route/auth version.

So `codeReady=true` cannot close `INV-10`.

---

## 9. Fast Auth V2.4 is not part of Version 143 Orders path

Version 143 Orders Fast V2 source shows legacy `authorize_()` before stable page cache.

Prepared `D1_Orders_Fast_V2_4.gs` instead replaces that call with `authorizeD1FastV24_()`.

Therefore:

**Fast Auth V2.4 is NOT deployed in the verified Version 143 Orders route.**

Prepared-source security review additionally found:
- intended cache TTL 120s.
- digest-based cache key.
- authoritative fallback to `authorize_()`.
- but cached-user sanitizer copies all primitive fields from `auth.user`.
- current `findUser_()` includes primitive `password` and `token` fields.
- prepared cache can therefore store password/token in cached payload despite its comment claiming raw token is not cached.
- forget/invalidation helper is defined but not called by logout/password/deactivation lifecycle in that prepared file.

Decision:

**DO NOT DEPLOY CURRENT V2.4 PREPARED BUILD.**

This does not change Version 143 production auth because V2.4 is not active.

---

## 10. Current editor vs GitHub remains a known delta

Current supplied editor source routes:
- Dashboard -> D1 Primary.
- Orders -> D1 Fast V2.

GitHub working `Code.gs` still contains older direct route targets in those top-level positions.

Apps Script/editor also contains D1 atomic live-sync source not represented by the current GitHub monolith.

Therefore GitHub `Code.gs` is **not** a deployable reconstruction of production.

---

## 11. Live workbook can contain prepared schemas with no current writer

Example: `إدارة - تسليم الشيفت` exists live as a header-only schema stub, but the inspected `Code.gs` does not contain its sheet name/distinctive headers and no writer was found.

So sheet presence in health is not proof that a corresponding Version 143 workflow is implemented.

---

## 12. Evidence boundary / Phase 0 decision

The available connectors expose:
- GitHub repository/history.
- Library files.
- live Google Sheets data.
- supplied current Apps Script source snapshots.
- user-provided Project History evidence.

They do **not** expose the Apps Script project file list/source snapshot for arbitrary deployed versions through a direct Apps Script API connector.

Therefore the remaining complete file-list uncertainty cannot be honestly closed automatically from current tooling.

Phase 0 should preserve:

`INV-10 = PARTIAL — DOCUMENTED ACCESS BOUNDARY`

rather than inventing a file list.

This does **not** block creating a new uniquely namespaced integrity module on the GitHub working branch. It **does** block production redeploy/rebuild until current Apps Script source is captured/reconciled intentionally.

---

## 13. Safe next implementation boundary

Allowed after Phase 0 checkpoint:
- create `trendos-integrity-v1.gs` on the working GitHub branch.
- keep all symbols uniquely `trendos...V1_` namespaced.
- add unit/static tests in GitHub.
- do not wire/deploy it to Apps Script yet.

Not allowed yet:
- overwrite `Code.gs` in Apps Script from GitHub.
- paste old V1932 standalone modules on top of consolidated editor Code.
- install Fast Auth V2.4.
- create a new production deployment.

---

## Result summary

- `INV-10A` active Version 143: **PASS**.
- `INV-10B` production deployment/config match: **PASS**.
- `INV-10C` live backend/workbook identity: **PASS**.
- `INV-10D` Version 143 D1 top-level routes: **PASS**.
- exact complete Version 143 project file list: **UNKNOWN / INACCESSIBLE WITH CURRENT CONNECTORS**.
- `INV-10` overall: **PARTIAL — SAFE EVIDENCE BOUNDARY DOCUMENTED**.

No production code, Sheet data, trigger or deployment was changed during this reconciliation.
