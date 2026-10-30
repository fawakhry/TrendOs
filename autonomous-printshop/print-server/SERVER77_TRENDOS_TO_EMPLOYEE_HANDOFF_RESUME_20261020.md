# SERVER-76/77 — TrendOS to Printshop Employee Dispatch Preview (resume after interruption)

**Scope:** reuse existing TrendOS cloud order source + existing Ubuntu one-shot reader + existing Print Server employee UI and manual work-folder workflow; don't fork an order/customer system. **Everything here is source-only; no production deploy or physical Ubuntu run.** Existing D01–D06 owner/evidence gates in `SERVER69_RELEASE_DECISIONS.json` remain pending.

## Actual code completed

- SERVER-76 `src/production_dispatch_preview.py` turns **complete, independently scoped print and laser packets** (max 20 records per screen, page 1, `hasMore=false`) into a compact in-memory human work-queue preview. One order may have separate print/laser `lineId` values. Row contract exactly `orderId,lineId,screen,serviceCode,status,quantity`; rejects extra customer/finance fields, duplicate line IDs, untrusted/partial snapshots, incompatible quantities and unsound file-to-line links. A line's linked R2 file metadata, when separately prequalified, means **human review required**, never READY / design approved / file verified.
- SERVER-77 `src/trendosshop_read_once.py` adds `read_trendosshop_dispatch_preview_once()`, a **dormant** function using the **existing** HTTPS host pin, no-redirect opener, existing bearer/row checks, two literal `enabled=True` and `owner_authorized=True` gates, exact screen query and authentic page metadata. It does not fabricate complete-pagination state or duplicate the transport. `read_trendosshop_once()` remains counts-only and backwards-compatible. `run.py` / the actual employee GUI are **not automatically connected** to the new preview.
- Files / designs: `autonomous-printshop/core/cloud-order-file-design-discovery-v1.mjs` and `...artifact-collector-v1.mjs` are **existing** R2 provenance source candidates; this change did not introduce another file store or automatic download. The new preview does **not** retrieve assets or trust caller-provided files as approvals.
- Existing AP-276/277/278/279/280 already provide local folders, path confinement, a review queue, read-shadow and employee-controlled preparation workflows. They are not redeployed or rewritten.

## Exact test receipt

[GitHub Actions SERVER-68 #39335831259](https://github.com/fawakhry/TrendOs/actions/runs/39335831259) on source-and-CI SHA `fc10d949c515e4c9647a7e1d84355676cc35f5aa` **completed SUCCESS**:
- **243/243 Node tests PASS**, 0 fail.
- **9/9** original Python SERVER-34 client, **6/6** dormancy CLI, **15/15** SERVER-76 review queue, **10/10** new SERVER-77 reader-to-preview adapter tests — all PASS.
- Actual **local Workerd** with synthetic SQLite D1/DO + injected pinned HTTPS→loopback transport: **SERVER77_REAL_LOCAL_DISPATCH_PREVIEW=PASS**, 2 line tasks (1 print, 1 laser), no file or machine side effects.
- Wrangler isolated stage **dry-run only** PASS; no Cloudflare deploy or live D1 queries. A failing earlier run at commit `1589123a...` was caused by path-like `../escape` artifact ID slipping the first validator; blocked by the updated file-ID whitelist at commit `a8bf938e...`. Final tested SHA above is GREEN.

## Practical next execution boundary

Use **existing Cloudflare D1** as the authoritative order/customer source. [SERVER-75 deployed Worker evidence](SERVER75_BROWSER_FREE_LIVE_CODE_EVIDENCE_20261020.md) found that the live `trendos-d1-api` code contains existing orders and customer search routes but **not** the dedicated SERVER-33/34 printshop reader markers yet. Do not borrow a browser/employee credential or deploy all pending source security changes to Production simply to activate preview.

Following authorized version-provenance, consumer and fail-closed security gates, promote the dedicated service-only reader through protected staging; authorize one physical Ubuntu read-only canary. **Only after** this should the operator choose a local work folder, review source file provenance and hashes on the target shop host, and approve an output device job separately. Cross-building site file transfer (Windows7 laser), Ubuntu-at-home topology, network permissions, print/laser machine interlocks and R2 file availability remain independent open physical gates. Never treat preview as print or laser permission.

**Truthful state:** `GITHUB_PREVIEW=IMPLEMENTED_TESTED`; `PRINT_AND_LASER_IN_MEMORY_REVIEW=PASS`; `REAL_TRENDOS_ORDER_READ=NO`; `EMPLOYEE_UI_LIVE_INTEGRATION=NO`; `FILE_TRANSFER=NO`; `DEVICE_EXECUTION=NO`; `D01_D06=PENDING`.
