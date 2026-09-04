# GS-06 — Unified Backend Build Gate

Date: 2026-09-04 Africa/Cairo
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Trigger

Automated TrendOS executive check found a newer canonical black-box handoff after the prior D1-freshness-only checkpoint:

`docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_BACKEND_UNIFICATION_HANDOFF.md`

This handoff changes the immediate execution lane from continuing Cloudflare/D1 activation first to stabilizing and consolidating the Apps Script backend first.

## Current verified position

- Production remains Apps Script Web App Version 146.
- Google Sheets + Apps Script remain authoritative writes.
- Cloudflare production cutover is not active.
- Cloud Write remains OFF.
- CORE-P0 remediation remains paused after the read-only `3536-01` preview failure.
- Existing performance diagnosis remains valid: Apps Script-first/auth hot path and polling fan-out are major latency sources.
- Prepared D1 sync runbook remains valid but is not the immediate first lane after the backend-unification decision.

## Stalled-work diagnosis

The project is not blocked by missing design intent anymore. The new black-box handoff defines the target clearly: build one clean unified Apps Script candidate, test it, then perform controlled Head install/deploy and live verification before resuming staged D1 migration.

The current tooling cannot directly read the bound Apps Script editor project. Therefore the unsafe action would be to compose a replacement backend assuming repository `Code.gs` or the Sheet script snapshot is the exact persisted Head baseline.

That would violate the existing rule: never blindly overwrite production Apps Script from GitHub `Code.gs`.

## Safe action executed

Created:

`build/apps-script/TrendOS_BACKEND_UNIFIED_V147_CANDIDATE.manifest.json`

Commit:

`57755d0b3ff5226cc7d2302bc40905ac14f041cf`

The manifest pins:

- Version-146 production boundaries;
- the 12 Integrity core modules to merge;
- V2/V3 hotfix logic to integrate natively rather than retain as permanent append-only overrides;
- registry writer as temporary only;
- Fast Auth V2.5 deferred;
- forbidden blind-replacement legacy files;
- required static/runtime safety tests;
- explicit requirement to capture or exact-verify the persisted Apps Script Head baseline before composing the final unified source.

## Status

**PASS — stalled work resumed safely at the GitHub-only build-contract layer.**

No production code, Apps Script Head, deployment, Sheet data, Script Property, feature flag, trigger, Cloudflare route, D1 data, or `Code.gs` was changed.

## Exact next step

1. Capture/exact-verify the persisted Apps Script Head baseline from the bound Version-146 project.
2. Compare it against the approved repository lineage; record exact identity/diff.
3. Compose `TrendOS_BACKEND_UNIFIED_V147_CANDIDATE.gs` only from the verified baseline + the manifest contract.
4. Run GitHub-only composition/collision/performance-path tests.
5. Stop before Apps Script Head install/deploy and require the normal controlled production gate.

Do not resume registry write or production D1 read/write cutover during this build gate.
