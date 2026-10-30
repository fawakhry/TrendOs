# SERVER-203 — Owner authorizes exactly one rotated-secret isolated-stage diagnostic

**Owner authorization:** `ok` on 2026-10-30, in response to question about performing one read-only isolated-stage HTTPS GET using the freshly saved Secret file.

## Verified prerequisites / source review
- Prior owner Ubuntu screenshot showed `SECRET_SAVED=YES`, `SECRET_FILE_PERMISSION=600`. Directory mode 700 verified in previous SERVER-199; screenshot reflects local storage only, not credential validity.
- Reviewed existing repo `src/server108_stage_edge_diagnostic.py` and `src/stage_access_probe.py`: allowlisted target `https://trendos-server68-isolated-stage.trendmall-contact.workers.dev/`, one HTTPS GET only, 5s timeout, explicit no redirects or proxy, never consume HTTP response body. Returns sanitized HTTP status, CF-Ray, content type and challenge flag, does not prove Access authentication from status alone. No order, D1 write, printer, laser, Asterisk or production operations.
- Authorized scope: **one request total** to that exact stage origin only. If validation fails, outbound request count must remain zero, and should not rerun blindly.
- Prefer existing reviewed code called via a one-time `python3 -B - <<'PY'` adapter reading local Secret under controlled file permissions: verify directory owned by OS user with mode 0700 and no symlink; verify secret regular file owner=current user mode 0600, no symlink and bounded size, use `os.O_NOFOLLOW`. Do not print, hash or pass Secret as shell argument/environment variable. Prompt for the existing Client ID securely with `getpass`; abort if unavailable. Import pinned sandbox source, call `diagnose_stage_once(... enabled=True, owner_authorized=True, route_qualified=True)` exactly once; print only sanitized JSON plus UTC timestamps.
- `Client ID` is NOT stored in the helper file and may be copied from authorized Cloudflare dashboard into hidden prompt. Never paste Client ID or Secret into chat or a screenshot; if ID is unavailable, stop without running a probe.
- Ambiguous HTTP403 remains ambiguous: Access rejection versus Worker-level denial must be correlated with Cloudflare vendor if needed. One-shot success requires more evidence than 200 alone; 403 does not authorize policy changes or retries.
- No live request has yet been observed. PR #190 verified open/draft, do not merge, do not deploy.

`SERVER203_OWNER_APPROVAL=ONE_STAGE_GET`; `SANITIZED_TEST_PREPARED=YES`; `REQUEST_EXECUTED=NOT_OBSERVED`; `PR190=OPEN_DRAFT`.
