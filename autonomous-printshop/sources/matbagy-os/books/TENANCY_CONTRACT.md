# Matbagy OS Tenancy Contract

Status: **FOUNDATIONAL / REQUIRED FOR ALL COMMERCIAL CORE WORK**

Canonical platform: `fawakhry/Matbagy-OS@main`

## 1) Canonical tenant model

Every commercial entity belongs to exactly one tenant unless explicitly marked as Global Platform data.

Required tenant-scoped entities include:
- Customer
- Order
- Design Case
- Asset
- Room
- Watch record
- Product/Recipe when tenant-private
- Machine
- Material/Inventory
- Job / Production Step
- Approval
- Payment/Delivery references
- Tenant-private Knowledge
- AI Memory
- Audit event

`TENANT_001` is Matbagy and is the legacy/default tenant during migration only.

## 2) Identity source

In authenticated runtime paths, `tenant_id` is determined from the authenticated principal/session.

Client payload may repeat `tenant_id` for validation, but it must never be allowed to override the authenticated tenant.

Rule:

`AUTHENTICATED_TENANT != REQUESTED_TENANT -> DENY`

Current sandbox bearer identity is explicitly bound to:
`SANDBOX_TENANT_ID=TENANT_001`

## 3) Composite identity

Entity IDs are not globally safe by themselves.

Examples:
- Case identity: `tenant_id + case_id`
- Order identity: `tenant_id + order_id`
- Asset identity: `tenant_id + asset_id`
- Customer identity: `tenant_id + customer_id`

Adapters, caches, idempotency keys and persistence keys must include tenant scope.

## 4) Storage isolation

Commercial storage must not infer a shared path that mixes tenants.

Target logical namespaces:
- `TENANTS/<tenant_id>/CASES/...`
- `TENANTS/<tenant_id>/ROOMS/...`
- `TENANTS/<tenant_id>/WATCH/...`
- `TENANTS/<tenant_id>/KNOWLEDGE/...`

Existing Tenant 001 files remain in legacy paths until an explicit migration is qualified.

Do not move historical files merely to satisfy naming. Preserve evidence and migrate under a controlled migration plan.

## 5) Google Drive isolation

The current Matbagy Project Root:
`1kP_JAO-ZOJltX9FCkAsylxYAfRar-RQV`

belongs to `TENANT_001` context.

The legacy folder ID:
`1qhoxC_c2MF3X_hhHcWiDo2SzW2ySCch_`

is not the Project Root. It is a historical/moved child folder reference and must not be labeled as the canonical Project Root.

Commercial tenants must have an explicit tenant->storage-root mapping. Do not assume every tenant shares Tenant 001 Drive hierarchy.

## 6) Knowledge isolation

Knowledge classes:

### GLOBAL_PLATFORM
May be reusable across tenants only after validation and privacy review.

Examples:
- DPI principles
- generic bleed/cut rules
- non-private production guidance

### TENANT_PRIVATE
Never available to another tenant.

Examples:
- customer information
- prices
- suppliers
- private templates
- employee information
- tenant-specific financial data
- tenant customer preferences
- internal operating rules

Promotion from Tenant Private evidence into Global Platform Knowledge must remove private identifiers and require an explicit promotion contract.

## 7) AI context isolation

Every AI shared context packet must include `tenant_id`.

Retrieval must filter by authenticated `tenant_id` before content is supplied to any model.

AI providers must not be trusted as an isolation boundary. Isolation happens before provider invocation.

## 8) Audit requirements

Security/business audit events must include:
- `tenant_id`
- actor/subject when available
- action
- entity reference
- timestamp
- request/evidence reference when applicable

Cross-tenant access attempts are security events and should be auditable.

## 9) Idempotency / cache / rate limit

Keys must be tenant-scoped.

Unsafe:
`idempotency-key`

Safe logical key:
`tenant_id + idempotency-key`

The same applies to:
- cache entries
- dedupe keys
- rate-limit subject keys
- background job keys
- webhook replay protection

## 10) Roles and permissions

Role membership alone is not tenant identity.

Authorization decision requires both:
1. authenticated tenant scope
2. permission/role for the requested action

Future commercial authorization should evolve from roles into explicit permissions/entitlements while preserving tenant isolation.

## 11) Legacy compatibility

During migration:
- missing `tenant_id` may be normalized to `TENANT_001` only in explicitly legacy-compatible runtime paths.
- new commercial writes must provide authenticated tenant context.
- migration compatibility must not silently become the permanent commercial model.

## 12) Cross-tenant invariant

At no point may:
- a Case reference an Asset owned by another tenant;
- an authenticated request select another tenant;
- search/retrieval return another tenant's private data;
- a cache/idempotency collision return another tenant's response;
- a write fallback to Tenant 001 when a different authenticated tenant is active.

Default action for ambiguity:
**FAIL CLOSED**

## 13) Current implementation evidence

Implemented and CI-qualified:
- tenant-aware Case normalization;
- tenant-scoped Memory Case/Asset stores;
- cross-tenant Asset rejection;
- tenant included in AI shared context and audit;
- tenant-bound auth principals;
- tenant-scoped HTTP rate limit/idempotency;
- cross-tenant HTTP request rejection;
- Cloudflare Sandbox bound to `SANDBOX_TENANT_ID`;
- tenant-scoped mock external adapters;
- dedicated tenant-boundary CI tests.

## 14) Next tenancy work

Still required before Commercial Production:
- tenant-aware persistent production database;
- tenant provisioning;
- tenant-scoped persistent search/indexing;
- RBAC/permission matrix;
- tenant-specific storage mapping;
- tenant backup/export/delete lifecycle;
- billing/plan entitlements;
- production security review.
