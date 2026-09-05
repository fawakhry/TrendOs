# TrendOS Accounting F2 — Preview-only persistence caller START

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`

## Resume point
Latest material Accounting checkpoint is the preview/test persistence composition gate. D1 writes remain denied by default and production is hard-denied.

## Material step recorded before mutation
Next safe implementation: add a preview-only orchestration caller that composes transaction intent with the existing persistence gate. It must:
- never discover bindings/environment by itself;
- require caller-injected DB plus exact preview capability and explicit write opt-in;
- preserve ZERO_WRITE when the gate is not satisfied;
- use existing transaction/idempotency and D1 adapter semantics rather than duplicating them;
- keep production hard-denied;
- perform no migration, deployment, or production mutation.

After implementation, add regression tests before any further material step.