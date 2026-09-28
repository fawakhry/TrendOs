# TrendOS T12 Browser Network Error Diagnostic — Entry 444

Date: 2026-09-28 Cairo

User attempted the armed Order 4323 canary from the live UI and received Firefox-style:
`NetworkError when attempting to fetch resource.`

No retry was requested. The general CREATE canary remained armed.

A37 diagnostic:
- Branch: `diagnostic/t12-browser-network-a37-20260928`
- Run: `36413164125`
- Job: `108897923998`
- Conclusion: SUCCESS

Live probes against:
`https://trendos-d1-api.trendmall-contact.workers.dev`
with browser Origin:
`https://fawakhry.github.io`

Results:
- GET `/v1/t12/orders/create/health`: HTTP 200
- response: mode CANARY, canaryRemaining 1, nextOrderNumber 4323, legacyCanaryRemaining 0, generalCutover false
- `HEALTH_CORS=PASS`
- OPTIONS `/v1/t12/orders/create`: HTTP 204
- allowed Origin is exact GitHub Pages origin
- allowed headers include content-type, authorization, x-t12-general-canary-confirm
- `CREATE_PREFLIGHT=PASS`
- OPTIONS `/v1/edge/orders/session`: HTTP 204
- allowed Origin is exact GitHub Pages origin
- allowed method POST and content-type header
- `SESSION_PREFLIGHT=PASS`

Conclusion:
- Production Worker/D1 health and the intended GitHub Pages CORS contract are healthy.
- Order 4323 has not been consumed; the one-shot canary remains available.
- The observed browser NetworkError is therefore most likely a client-path/origin reachability issue (for example local inability to reach workers.dev, browser/network filtering, or the UI being served from a different Origin), not a D1 CREATE failure.
- Do not press Create again until the browser path is identified.

Current state:
```
GENERAL_CREATE_MODE=CANARY
GENERAL_CREATE_CANARY_REMAINING=1
NEXT_ORDER_NUMBER=4323
ORDER_4323_CREATED=NO
GENERAL_CREATE_CUTOVER=NO
```
