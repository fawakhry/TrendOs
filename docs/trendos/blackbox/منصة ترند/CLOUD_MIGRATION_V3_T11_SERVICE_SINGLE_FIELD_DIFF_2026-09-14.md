# CLOUD MIGRATION V3 — T11 Service single-field diff

Date: 2026-09-14
Run: 34835351131
Workflow commit: dd4972b2d11640cc9e4a2b69829e369a4d4c94bd

## Result
- All 35 deployed Service active rows mapped to the D1 candidate by order identity.
- Unmapped rows: 0.
- Field mismatch counts:
  - `qty`: 1
- All other compared fields: 0 mismatches.
- No business values were logged.

## Safety
- No production deployment or routing change.
- Service remains Apps Script.
- No business mutation, Task mutation, secret change, or write-authority change.

## Next step
Determine the deployed default/normalization behavior for the one differing `qty` without logging its business value, apply that normalization to the Service D1 candidate, then rerun live parity.
