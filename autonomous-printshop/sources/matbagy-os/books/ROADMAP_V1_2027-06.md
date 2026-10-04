# Matbagy OS — Roadmap to Commercial v1.0

Target launch date: **2027-06-30**

Canonical repository: `fawakhry/Matbagy-OS`
Canonical branch after qualification: `main`

## Launch definition

The June 2027 target means a sellable Multi-Tenant SaaS v1 for print businesses, not completion of the full 2050 vision.

Commercial v1 must support the core journey:

`Tenant -> Customer -> Order -> Job/Case -> Design/AI -> Production -> QC -> Delivery -> Analytics`

Production activation remains gated by security, tenant isolation, backup/restore, billing readiness and verified CI.

## October 2026 — Foundation

Objectives:
- Tenant identity and tenant isolation.
- Tenant-aware Case/Asset/Audit/AI context.
- Roles/permissions foundation.
- Schema reconciliation.
- Remove stale repository/root references.
- Close Live AI Sandbox deployment gate.
- Define SaaS database/source-of-truth boundaries.

Definition of Done:
- Same `case_id` may exist safely in two tenants without storage collision.
- Cross-tenant asset injection is rejected.
- Audit and AI context include `tenant_id`.
- Legacy Tenant 001 data remains readable.
- Canonical schemas use the correct Drive root.
- Runtime CI green.
- Live AI Sandbox deployment verified when credentials are available.

Current execution — 2026-10-02:
- Tenant Core: DONE / main CI PASS.
- Tenant Auth Boundary: DONE / main CI PASS.
- RBAC/permission foundation: DONE / main CI PASS.
- Tenancy Contract + key schema reconciliation: DONE / main CI PASS.
- Persistent D1 tenant schema/adapters: DONE / main CI PASS.
- Tenant provisioning + ACTIVE/SUSPENDED/CLOSED lifecycle: DONE / main CI PASS.
- Explicit tenant storage-root mapping: DONE / main CI PASS.
- Tenant-scoped Case search foundation: DONE / main CI PASS.
- Tenant export/backup + delete safety planning: DONE / main CI PASS.
- D1 + Live AI Sandbox deploy automation: DONE / main CI PASS.
- Live Sandbox verification attempt `37044242376`: stopped fail-closed at Secret Validation because all five Environment Secrets were empty; D1/deploy steps did not run.
- Remaining October blocking work: configure five external secrets and rerun the automated D1 + GPT/Gemini/BOOM Sandbox verification.
- Production remains OFF.

## November 2026 — Customers + Orders

Objectives:
- Customer entity.
- Order entity.
- Unified Job/Case Intake.
- Status workflow.
- Attachments.
- deadlines/notes.
- customer history.
- Search.

Definition of Done:
- Tenant 001 can run real daily order intake through Matbagy OS.
- Every order and job is tenant-scoped and auditable.
- Search cannot cross tenant boundaries.

## December 2026 — Products + Pricing

Objectives:
- Product catalog.
- Sizes/options.
- Materials.
- Product Recipes.
- Cost model.
- Machine time.
- Waste.
- Margin.
- Selling price.
- Job tickets.

Definition of Done:
- A standard job can produce a reproducible cost and price explanation.
- Recipes can be Global or Tenant-private.
- Pricing rules are controlled by the tenant.

## January 2027 — Production OS

Objectives:
- Production stages.
- Departments.
- operator assignment.
- queues/priorities.
- delivery tracking.
- reprint/failure handling.
- operator dashboard.

Definition of Done:
- Tenant 001 can follow an order from intake through delivery without a parallel manual status system for the pilot scope.

## February 2027 — AI Intelligence

Objectives:
- AI Job Intake.
- OpenAI/Gemini orchestration.
- Tenant Private Knowledge.
- Global Platform Knowledge.
- prior-job retrieval.
- classification.
- design brief generation.
- BOOM mode controls.

Definition of Done:
- AI answers and retrieval are tenant-scoped.
- AI cannot claim customer approval or delivery.
- AI cost/usage is metered per tenant.
- provider failure does not corrupt order state.

## March 2027 — Visual QA + Automation

Objectives:
- dimensions/DPI checks.
- background/preflight.
- cut/stroke readiness.
- text/asset completeness.
- QR/barcode validation.
- automated Job Pack.
- production-ready gate.

Definition of Done:
- Supported product classes receive deterministic preflight before production.
- failures are explainable and auditable.
- operator can override only with logged reason where allowed.

## April 2027 — Commercial SaaS Layer

Objectives:
- signup/onboarding.
- tenant provisioning.
- plans and entitlements.
- Starter / Business / Pro.
- usage limits.
- billing architecture.
- trial.
- tenant settings.
- branding.
- multi-branch foundation.
- platform admin/support tools.

Definition of Done:
- A new print business can be provisioned without code changes.
- plan limits are enforced server-side.
- tenant data is isolated from the first request.

## May 2027 — Real Beta

Objectives:
- Tenant 001 remains reference tenant.
- onboard 5–20 controlled beta print businesses.
- security/isolation verification.
- backup/restore.
- AI/storage cost measurement.
- onboarding measurement.
- pricing feedback.
- bug burn-down.

Required metrics:
- order intake time.
- file retrieval time.
- execution error rate.
- waste/reprint rate.
- overdue jobs.
- contribution margin per order.
- AI cost per tenant/order.
- onboarding completion.
- weekly active tenants.

Definition of Done:
- no known critical tenant-isolation issue.
- restore procedure tested.
- critical workflow success rate acceptable for launch.
- pricing covers infrastructure and AI usage assumptions.

## June 2027 — Commercial Launch

### Week 1
- Core feature freeze.
- Critical/security fixes only.
- final backup/restore drill.
- billing validation.
- security review.

### Week 2
- onboarding finalization.
- help/documentation.
- demo tenant.
- sales material.
- support process.

### Week 3
- controlled paid launch.
- first paid subscriptions.
- cost/error monitoring.

### Week 4
- General Availability decision.
- release `Matbagy OS v1.0`.

Launch gate:
- `TENANT_ISOLATION = PASS`
- `CORE_CI = PASS`
- `BACKUP_RESTORE = PASS`
- `BILLING = PASS`
- `SECURITY_REVIEW = PASS`
- `TENANT_001_DAILY_USE = PASS`
- `BETA_EVIDENCE = PASS`
- `SUPPORT_READY = PASS`

## Post-v1 / 2050 track

Not required to block v1 launch:
- Machine Digital Twins.
- Predictive Maintenance.
- AR / Spatial Sales.
- autonomous machine control.
- large supplier marketplace.
- full AI Product Inventor.
- advanced network intelligence.

These remain strategic roadmap items and must not delay v1 unless they become safety or commercial blockers.

## Scope discipline

No future-facing feature may delay the 2027-06-30 launch unless it is required for:
- tenant isolation/security,
- core operability,
- legal/compliance requirements,
- billing,
- data integrity,
- backup/recovery,
- critical customer value needed for paid adoption.
