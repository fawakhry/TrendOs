# AP-257 — Owner-visible offline stop reason and elapsed-time receipt

**Status:** GitHub-only staging and Linux hosted synthetic tests. **No** AP-257 source update, service start, icon modification or receipt creation has occurred on the owner's Ubuntu machine.

## What AP-257 adds

The already existing **TrendOS Offline START (75s)** and **TrendOS Offline STOP** desktop shortcuts continue to target the same command-line entry: `controlled_offline_session.py start|stop`. The AP-257 implementation modifies the code behind this entry; it does not replace or reinstall the two shortcuts.

The new **read-only** owner diagnostics command is:

```bash
python3 -B "$HOME/TrendOs/autonomous-printshop/print-server/controlled_offline_session.py" receipt
```

Do **not** ask the owner to run this or update their checkout until a *new*, explicit authorization is provided.

After an authorized future offline test, its output can show:

```text
AP257_RECEIPT=STOPPED; REASON=OWNER_STOP; ELAPSED_SECONDS=18.348; HTTP_STOPPED=YES; TEMP_CLEANED=YES; SESSION=<random-id>; AT_UTC=<timestamp>
```

or `REASON=TIMEOUT`. This example is **synthetic**, not a recovered receipt from the owner's AP-256 session. AP-256 previously ran without AP-257 instrumentation; the new code cannot retrospectively prove its STOP reason.

## Safety and evidence contract

- The receipt file is **only** `$XDG_RUNTIME_DIR/trendos-ap257-last-offline-result.json` in the same preexisting, non-symlinked, user-owned, private runtime folder validated by the AP-252 control path. The file is `0600` and written by an atomic replace of a uniquely named private temporary file. A pre-existing symlink, directory or insecure file permissions stop the writer instead of being overwritten. No persistent service, package, customer path or Cloudflare integration is added.
- Each new session records `PENDING` with a random session ID **before** it begins the disposable server, replacing prior completion data. Only after HTTP shutdown and temporary directory context cleanup can the final `STOPPED` record be written. A crash, exception or interrupted session leaves `PENDING` (or no receipt), **never** a false success report.
- Finalized reasons are exactly `OWNER_STOP` (the AP-252 local stop Event fired) or `TIMEOUT` (its wait expired). `elapsed_seconds` uses `time.monotonic()` from just before Firefox launch until after the controlled HTTP/temp cleanup. It is software-measured duration, not an independent chronometer.
- Read-only `receipt` mode checks the expected schema, size, permissions, owner UID, state and booleans. Missing or pending receipts return a nonzero status and say why verification is unavailable; no fallback to old logs, arbitrary file reads or browser launches.
- The diagnostic is an **owner-machine software receipt**, not an independently authenticated audit of all host services or printing. The owner should match the specific test run/session and, when separately authorized, also capture Firefox evidence. The file is ephemeral under XDG_RUNTIME_DIR, so it may disappear across logout/reboot.
- The existing AP-247 and AP-249 pilots, AP-250 75-second icon, AP-253 desktop launcher generator, production `run.py`, cloud/employee credentials, printer and customer directories, and SSH/NetBird/UFW are untouched.

## Qualification evidence

[AP-257 GitHub-hosted synthetic CI — run 38271566920](https://github.com/fawakhry/TrendOs/actions/runs/38271566920), Linux/Python 3.12: **17/17 AP-257 tests and 14/14 AP-252 regression tests PASS**.

The tests exercise a local synthetic HTTP server and local Unix STOP socket with a mocked Firefox launch, and private temp receipt operations under the GitHub runner; they do not touch the owner's actual Ubuntu desktop, printer, order data, or cloud resources. They cover OWNER_STOP/TIMEOUT distinction, monotonic duration, same-session matching, the PENDING/no-proof state, malformed and symlinked receipt refusal, and read-only receipt display.

## Deployment gates (NOT YET APPROVED)

1. Review current PR #95 and latest branch HEAD, compare exact changes with the last screenshot-verified Ubuntu HEAD `6d49861b1a0184628a027180a4466833e5fd19e4`, and get explicit owner permission before any guarded source update (no pull, reset, checkout or PR merge).
2. Do not repeat AP-256 merely to recover its old STOP reason: the AP-257 receipt is **not retroactive**.
3. On a separately authorized future *one-time* 75-second synthetic START/STOP demonstration, the owner may observe Firefox, issue one STOP command through the existing shortcut, then execute **one read-only** `receipt` command and photograph the output. This requires separate permission to activate a local server and to write the temporary runtime receipt.
4. No production deployment, remote agent, self-hosted runner or external service is established by this qualification.
