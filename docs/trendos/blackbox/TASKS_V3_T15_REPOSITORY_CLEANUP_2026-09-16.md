# TrendOS Tasks V3 — T1.5 Repository Cleanup — 2026-09-16

## Purpose
Remove transient experiment/probe artifacts created during T1.5 troubleshooting while preserving the audit trail and the canonical preview implementation.

## Cleanup policy
- No history rewrite and no force push.
- No `main` changes.
- No production Worker, D1, Apps Script, route, or secret changes.
- Blackbox checkpoints are preserved as audit evidence.
- Canonical T1.5 files remain:
  - `.github/workflows/trendos-tasks-v3-t15-preview-contract.yml`
  - `cloudflare-d1/src/tasks-v3-t15-d1-preview.mjs`
  - `cloudflare-d1/src/tasks-v3-t15-preview-worker.mjs`
  - `cloudflare-d1/test/tasks-v3-t15-preview-contract.mjs`
  - `cloudflare-d1/migrations-tasks-v3-t15-preview/0001_tasks_v3_t15_read_replica.sql`
  - `cloudflare-d1/wrangler.tasks-v3-t15-preview.toml`
  - `cloudflare-d1/wrangler.tasks-v3-t15-preview.toml.example`

## Removed transient artifacts
- Manual dashboard single-file bundles.
- Version-specific v3/v4/v5 source/test duplicates.
- One-off read/source/scheduled probes.
- One-off T1 dashboard single-file candidate workflow/test/bundle.
- Version-specific v3/v4/v5 contract workflows.

## Result
The branch returns to one canonical T1.5 implementation path plus preserved Blackbox history. Any removed artifact remains recoverable from Git history.

## Next
After repository cleanup passes the canonical contract, create a separate explicit automation workflow for Cloudflare preview version upload/deployment. Do not combine cleanup with production promotion or secret changes.
