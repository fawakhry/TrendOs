# TrendOS T12 Add Order UI contract alignment — Entry 445

Date: 2026-09-28 Cairo

After the armed 4323 canary, the live Add Order UI returned:
`canonical-business-intent-invalid`

The Cloud canonical contract remained fail-closed and Order 4323 was not created.

Root mismatch found between live UI expectations and the qualified Cloud contract:
- Live UI allows an empty item name and historically treats it as an ordinary generic order.
- Cloud canonical CREATE requires a non-empty item name.
- Live UI allows a registered customer phone to be omitted while Apps Script can resolve the customer through its customer search/read path.
- Cloud canonical CREATE requires an unambiguous registered customer phone.
- Backend already returned a structured `errors[]` list for canonical validation, but the frontend previously displayed only the generic top-level reason.

A40 frontend correction:
- Branch: `diagnostic/t12-create-ui-contract-a40-20260928`
- Qualification run: `36442421488`
- Job: `108996031328`
- Conclusion: SUCCESS
- `ADD_ORDER_UI_CONTRACT_QUALIFICATION=PASS`

Behavior added:
- Empty item name is mapped client-side to `أوردر جديد - <department>`.
- Registered customer with missing phone is resolved through existing Apps Script `searchCustomers` read only; only one exact normalized-name match with a phone is accepted.
- If exact customer resolution is not possible, CREATE stops before Cloud mutation and asks the user to select the registered customer from search.
- Canonical validation `errors[]` are translated to explicit Arabic field messages.
- No weakening of the Cloud canonical contract.
- No Apps Script CREATE fallback was reintroduced.

Main updates:
- `trendos-edge-orders-read-v1.js`: commit `8b8aa8ceefcdfd27587861e6d080383ca65b97cd`
- `config.js`: commit / main HEAD `df38b2ef08b37385a87626757e4ff65badaafaa8`
- Frontend version `EDGE_ORDERS_T12_CREATE_UI_CONTRACT_20260928`
- Cache loader `trendos-edge-orders-read-v1.js?v=20260928-t12-create-ui-contract1`
- GitHub Pages run `36442530502`: SUCCESS for exact main HEAD `df38b2ef08b37385a87626757e4ff65badaafaa8`.

Canary safety remains:
```
GENERAL_CREATE_MODE=CANARY
GENERAL_CREATE_CANARY_REMAINING=1
NEXT_ORDER_NUMBER=4323
ORDER_4323_CREATED=NO
GENERAL_CREATE_CUTOVER=NO
```
