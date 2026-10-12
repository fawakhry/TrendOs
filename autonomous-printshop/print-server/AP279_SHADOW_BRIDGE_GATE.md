# AP-279 — Shadow-by-default TrendOS read bridge and complete-screen status lineage

**2026-10-12 — source-only on the unmerged GitHub draft PR; no physical deployment.**

## Why this change matters

Existing Print Server `TrendOSStatusBridge.sync_once()` observed human changes to employee row status and immediately wrote a local order folder. A first-seen active row after baseline could be mistaken for an observed transition; partial screen access could replace baseline rows and later produce ambiguous transitions. AP-277 HTTP authorization did not cover automatic background bridge writes. Before even considering owner-authorized real order read access, a strict no-write shadow must be the default.

## Changes

1. New `trendos.observeOnly = true` in `src/config.py` defaults. `TrendOSStatusBridge` accepts **only literal false** (not string "false", 0 or null) as opt-in to local folder creation. Shadow mode enumerates transition candidates/counts and never invokes `create_for_claimed_order`, Fast Mode notification or printer actions.
2. `sync_once()` refuses to advance the baseline when any explicitly configured employee screen is not accessible. Configuration can specify a narrow single authorized screen, but it cannot silently accept a partial snapshot as complete.
3. A previously absent row (line ID not present in the last baseline) is NOT a verified human status transition, even if currently active. Only observed old non-active -> current active statuses can qualify.
4. Status responses disclose `observeOnly` and `localFolderWrites` mode; shadow result includes counts and an empty `created` list.
5. Existing AP-276 fake-data flow opts into `observeOnly=false` exclusively in its disposable test fixture. Production defaults remain fail-closed and the separate AP-277 main() live-capability interlock remains enforced.

## Evidence

[Actual GitHub Actions run 38308511823](https://github.com/fawakhry/TrendOs/actions/runs/38308511823), job `115008273659`, COMPLETED/SUCCESS; inspected logs:
- AP-279 read bridge shadow/security: `Ran 8 tests in 0.090s`, OK.
- AP-278 symlink/ready constraints: `Ran 11 tests in 0.276s`, OK.
- AP-277 write authorization: `Ran 12 tests in 0.638s`, OK.
- AP-276 synthetic operational flow: `Ran 6 tests in 0.336s`, OK.
- `AP279_HOSTED_SHADOW_SYNTHETIC=PASS`, total **37/37 hosted fake-data tests PASS**, `AP279_PRODUCTION_CLOUD=OFF`, `AP279_LIVE_READ_ADAPTER=NOT_QUALIFIED`.

## Not qualified / owner decisions

No real TrendOS employee login/poll, printer spool, customer file, Windows7 network share, independent physical stop evidence, end-to-end production, local machine sync, race-free filesystem boundary or verified approval provenance. A real read-only connector still requires a scoped account, owner-authorized network endpoint and non-triggering dry-run baseline. The source-only shadow defaults are **not** a justification to run `run.py` or update Ubuntu. No merge is requested.

**One owner fact required to choose the next physical gate:** is Ubuntu `TrendosShop` currently inside the printshop or at home? After the answer, propose only a scoped, owner-approved, **non-production synthetic operational canary**, one Ubuntu command followed by Terminal screenshot; do not touch actual printers, Win7 originals or customer jobs.
