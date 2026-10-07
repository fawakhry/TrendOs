# TrendOS Print Server V0.1

Local, fail-closed print-shop file server for TrendOS. It creates only the folders actually required by an order, keeps the existing `x` workflow, provides real TIFF/DXF previews, and exposes a local Arabic UI.

## V0.1 behavior

When TrendOS emits a normalized `ORDER_CLAIMED` event, the server creates one order folder:

`ORDER_ID - DD-MM-YYYY - CUSTOMER_NAME`

Only the routes represented by real order lines are created:

- Heat press / `مكبس = نعم` -> `طباعة/فوتو/سبلميشن/x`
- Photo print -> `طباعة/فوتو/طباعة/x`
- Tableaux -> `طباعة/فوتو/تابلوهات/x`
- Couche -> `طباعة/ديجتال/كوشيه/x`
- Sticker -> `طباعة/ديجتال/استيكر/x`
- Laser -> `ليزر/x`

Unknown lines fail closed and are shown as `يحتاج تصنيف`; they are never guessed into a production folder.

## Ready aggregation

A file can be copied into the central ready aggregation only from a structured approval event with an exact current SHA-256. The source order file remains canonical. A ready-queue copy is **not** a Design READY write and does not bypass the Autonomous Printshop approval/preflight/readiness rules.

## Preview

The local UI previews:

- JPG / JPEG / PNG / WEBP / BMP / GIF
- TIF / TIFF (decoded by Pillow and served as PNG)
- DXF (parsed by ezdxf and rendered as SVG; dimensions/layers are returned as preview metadata)

Unsupported files remain available on disk and are opened with their native program.

## Run locally

1. Copy `config/default.json` to `config/local.json` and set the real Windows folders, for example:

```json
{
  "paths": {
    "ordersRoot": "D:\\TrendOS\\Orders",
    "readyRoot": "D:\\TrendOS\\جاهز للطباعة",
    "stateRoot": "D:\\TrendOS\\.state"
  }
}
```

2. Install Python 3.8+ (the code is kept Python 3.8-compatible for older print-shop PCs), then run `start.bat`.
3. Open `http://127.0.0.1:4782`.

The default bind is localhost only.

## TrendOS bridge contract

V0.1 exposes local event ingestion at:

`POST /api/events/order-claimed`

Payload:

```json
{
  "order": {
    "orderId": "15428",
    "customerName": "أحمد محمد",
    "claimedAt": "2026-10-07T10:15:00+03:00",
    "lines": [
      {"lineId": "L1", "heatPress": true, "itemName": "مج"},
      {"lineId": "L2", "itemName": "استيكر"}
    ]
  }
}
```

The repository already uses the real TrendOS line identity (`orderId + lineId`). The live website claim hook is intentionally not guessed in this V0.1 commit: the local event contract is ready, but Production wiring must target the exact qualified employee-claim event after that event is identified/verified.

## Safety boundary

V0.1 does **not**:

- write Design READY;
- manufacture Approval or Preflight PASS;
- write Material/Machine readiness;
- activate Operator Task;
- assign an employee;
- mutate Accounting;
- infer an authoritative printed status just because a file entered `x`.

Entering `x` is recorded only as `LOCAL_X_SIGNAL` in the local audit ledger.
