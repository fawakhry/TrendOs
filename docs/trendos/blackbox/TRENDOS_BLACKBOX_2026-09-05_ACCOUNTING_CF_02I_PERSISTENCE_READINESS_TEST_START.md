# ACCT-CF-02I — Persistence Readiness Regression Test Start

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`

## Pre-action record
The fail-closed runtime readiness evaluator has been added. Before wiring it into any runtime response, add regression coverage proving:

1. default/missing configuration => ZERO_WRITE;
2. production remains ZERO_WRITE even when every other flag is supplied;
3. preview is not ready without every explicit prerequisite;
4. preview/test becomes readiness-only `D1_PREVIEW_WRITE_READY` only when stage, capability, opt-in and injected D1 shape are all present;
5. evaluation performs no D1 prepare/batch invocation and never changes financial authority.

No runtime route mutation is permitted until these tests exist.

Status: STARTED
