# Original customer Stage — private R2 binding verification, 2026-11-03

The owner saved the approved existing bucket as `CUSTOMER_DRAFT_FILES_BUCKET` on `trendos-customer-portal-isolated-stage-v0` through Cloudflare Deploy. No second bucket is required. Cloudflare's Wrangler sync notice is a source-configuration reminder, not evidence that the binding failed.

## Verified evidence

| Evidence | Observed result |
|---|---|
| Bootstrap | Run41699904718 / Job126140166953, source3bcf2c6a892efff5711bb78d05ee28debf55c493: one empty named private bucket created; no binding/object/deploy |
| Owner readback | R2 binding plus original synthetic D1 and Durable Object shown in saved Bindings table |
| GET-only witness | [Run41705383110](https://github.com/fawakhry/TrendOs/actions/runs/41705383110) / Job126159193400, source08e05b7eb53a9540c29b47017d8d78cd8d332a5c: SUCCESS |
| Actual Stage version | 57b43cd5-cdb0-4a76-b245-bdcf16305651 at100%; previous deployed eba1cad6-3fb8-4e9e-b771-16c442b3d189 |
| Runtime and bindings | Exact non-R2 version bindings/runtime unchanged; source vars exact; all11 flags false; original separate synthetic D1 and DO |
| Public access | Worker workers.dev/preview OFF; bucket managedPublicAccess=false; customDomains=[]; stable settings/deployment re-read |
| Code | Full program AST equal to freshly bundled immutable original6b31228887f9073c1aa8c6f2c06597b194f567df; downloaded JS139750 bytes |
| AST digest, both sides | 78d021edacdd55898aa356c8da548fa15b7d2db94456ff70b927e0948ad06f77 |
| Writes by witness | remoteWrites=false; no SQL, objects, config upload, deploy, policy/secret/ACL modification |
| Release status | customerProductionReady=false; real customers OFF; existing owner-private Site unchanged |

Actual log times:17 Python tests PASS19:40:23UTC,7 AST tests PASS19:40:31, Wrangler4.157.0 local dry-run build19:40:32, matching AST19:40:36, private final snapshot19:40:38UTC (21:40:38 Cairo). Credentials were absent from local bundling; distinct Worker/R2 secrets were used only for whitelisted provider GET requests. No credential values were printed or copied.

## Etag discrepancy and limits

Initial sourceb499f30 run41704042682/job126154521848 stopped at19:32:04UTC with POSTBIND_SCRIPT_CONTENT_ETAG_CHANGED_OR_UNKNOWN. Diagnostic source1d11ec18/job126155906237 stopped at19:34:09 and confirmed that selected baseline eba1cad6 was also the actual previous deployed version. Both valid etags differed. The cause is unknown.

The alternative witness parses current code as data using acorn8.15.0 and compares the complete canonical AST against the local original-source build. It never executes the downloaded module. It ignores source positions, comments, formatting and literal raw representation only; preserves instructions, identifiers, actual literals, BigInt and regex semantics. Changed code, additional statement, renamed identifier or value must fail. It additionally requires latest=current deployed before/after the content GET. Resource/runtime/privacy drift still fails independently. This is a full AST match, not raw-byte equality or a generic bypass for changed code. The original successful log's scriptContentEtag field represented the baseline; subsequent source labels baselineScriptContentEtag/deployedScriptContentEtag separately.

## Source path that preserves the binding

- `tools/customer_stage_private_r2_postbind_ro_v1.py --plan`: offline, no credentials/network.
- Credentialed `--verify <immutable-original-checkout>` is restricted to same-repo PR context and the exact reviewed branch/source SHA. Only exact Worker settings/subdomain/deployments/versions/content and D1 inventory GETs use the Worker token; only this bucket's two domain GETs use the distinct R2 token. Redirects and write endpoints are rejected.
- If etags differ, independent full-source proof requires POSTBIND_COMPARE_PINNED_CODE=true, Node with pinned acorn8.15.0 and the original source's credential-free bundle at `cloudflare-d1/.postbind-local-build/index.js`. The actual run used Wrangler4.157.0.
- Optional `--write-config <original-checkout>/cloudflare-d1/.wrangler-customer-r2-verified-off-<unique>.toml` writes only a new exclusive0600 local file after complete verification. It contains original OFF flags/public URLs, verified separate synthetic D1 and exact approved R2. No secret values. Original tracked TOML/resolver remain unchanged.
- Actual rendered configuration passed TOML parsing, exact R2 and public/feature OFF checks, then was removed. No deploy was attempted. This runner verifies/renders; it does not activate features or publish anything.
- Old no-R2 resolver must continue refusing the newly bound runtime. Do not remove its guard, run old deployment that drops R2, inherit unknown uploaded latest state, or overwrite the approved UI candidate using an older main revision.
- Temporary credentialed PR workflow was removed from final PR349. Permanent readiness CI runs synthetic tests without secrets. The historical workflow remains available at the tested source for audit, not automatic remote reuse.

## Remaining customer release gates

Qualify actual Native HTTP with two synthetic users: login/logout/session isolation, ownership of orders/drafts/items/private files, quarantine, upload/resume/failure behavior. Qualify scanner and authorized private viewer, official original T12 single-writer handoff, exact-live UI fingerprint and rollback. The prior local E2E/root Access GET and this control-plane witness do not establish those paths. Legacy P0 ownership/public Drive ACL concerns remain independent.

Customer project book §48 and interface master UI-LOG-053 record the change. Source CI/merge closure is appended after exact-head checks; the existing unrelated tasks-v3-t1-preview Workers Builds failure is not claimed fixed. No access audience expansion, public publish, paid AI or production customer/staff/finance data operation.
