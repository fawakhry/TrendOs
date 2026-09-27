# TrendOS T12 Read Overlay — UI fallback root cause

Date: 2026-09-28 Cairo

## Entry 439 RESULT — UI-FALLBACK-BYPASSES-T12-OVERLAY

Owner reported that Order 4322 was still not visible on the print screen after Entry 438 Worker overlay deployment.

Read-only diagnostic A25:
- Branch: diagnostic/t12-overlay-fallback-cause-a25-20260928
- Workflow commit: cc7f9592f214b0885732e0808b7381fd48fe0318
- Run: 36357416138
- Job: 108727789423
- TOKEN_GUARD=PASS
- CATALOG_READ=PASS
- PRODUCTION_MUTATION=NO

Observed mirror ages at diagnostic time:
- Orders mirror: ageSeconds=102651, ready/parity yes
- Order Lines mirror: ageSeconds=102651, ready/parity yes
- Customers mirror: ageSeconds=714173, ready/parity yes
- Debt restriction mirror: ageSeconds=714173, ready/parity yes

The qualified 02CR read path requires freshness and therefore fails closed to Apps Script when these mirrors are stale. The frontend wrapper then returns the authoritative Apps Script result only.

Cloud-native state remained correct:
- order4322=1
- line4322=1
- mirror4322=0
- nextOrderNumber=4323
- canaryRemaining=0

Main frontend verification:
- main config has Edge read enabled.
- main frontend path is /v1/edge/orders/02cr/page.
- main wrapper explicitly falls back to the original Apps Script function.
- main JS version: EDGE_ORDERS_READ_T11_SERVICE_20260914.

Conclusion:
The Worker overlay is deployed, but stale mirror protection causes the live GitHub Pages frontend to bypass it and show Apps Script-only data. Therefore Order 4322 is absent from UI.

Safe correction:
Implement frontend hybrid fallback on GitHub Pages: keep Apps Script as authoritative fallback for legacy rows, then independently fetch T12 Cloud-native rows and merge them client-side. This requires an explicit main/frontend authorization before changing GitHub Pages.

No main change was made by Entry 439.
