# AP-252 / AP-253 — local-only, bounded OFFLINE START/STOP

**Status: staged and tested on GitHub, NOT deployed or executed on the owner's Ubuntu computer.** This is an additional synthetic-only mode, not a replacement for the proven 75-second AP-250 desktop icon.

## Components

- **controlled_offline_session.py** — accepts only start or stop. START runs the previously qualified synthetic AP-247 GET-only application, bound strictly to 127.0.0.1 with a random port and a **75-second maximum demo lifetime**. It requests the pre-existing Firefox to open the page. STOP sends a message through a private Unix-domain socket in the current user's existing XDG_RUNTIME_DIR. It does not operate over HTTP, SSH, NetBird, Cloudflare or any outside host.
- **prepare_control_desktop.py** — read-only --preview by default. Only an owner-approved --install attempts to create two NEW files inside the existing standard $HOME/Desktop: TrendOS-Offline-Controlled-START.desktop and TrendOS-Offline-Controlled-STOP.desktop. Neither overwrites the installed TrendOS-Offline-75s.desktop. The two launchers invoke /usr/bin/python3 -B with fixed local paths and Terminal=false; installation does not start any process.

## Safety contract and limitations

1. The new server is a **disposable demo**, not a production Print Server. It reuses the previous AP-247 synthetic config, HTTP GET allowlist and write-method rejection. The source never invokes production run.py, does not enable employee login, Cloudflare Production/D1, Fast Mode, printing, customer file access or order sync.
2. Only a user-owned pre-existing, non-symlinked runtime directory with no group/other permissions can host the socket. Linux SO_PEERCRED guards STOP against other users; the control socket uses 0600 and exists only for the short owner session. A STOP does not signal or kill guessed PIDs.
3. Existing or stale socket paths fail closed; do NOT manually delete them or bypass the guard without a separately reviewed diagnostic and owner's permission. AP-252 blocks a second *AP-252* start but cannot guarantee other older pilot tools are not simultaneously active.
4. Normal successful shutdown prints a software receipt including AP252_OFFLINE_STOPPED=YES and REASON=TIMEOUT or REASON=OWNER_STOP. STOP acceptance alone does not prove shutdown; inspect final localhost browser refresh and, only when separately authorized, a read-only diagnostic. Exact file cleanup is not independently verified on the owner host.
5. GNOME may require manual Allow Launching on each new shortcut. The installer does not bypass desktop trust. With Terminal=false, failed launches may be silent; avoid repeated clicks when the outcome is uncertain.
6. This feature does not establish any external remote executor, unattended agent or cloud-facing control channel for ChatGPT.

## GitHub-hosted synthetic qualification

- AP-252: https://github.com/fawakhry/TrendOs/actions/runs/38265125847 — 14/14 PASS, Linux/Python 3.12, mocked Firefox, **real synthetic 127.0.0.1 HTTP and AF_UNIX early-stop**; verifies GET 200, blocked POST/unsafe GET 403, stop, expiration, cleanup receipt, refused invalid commands, private runtime directory and prevention of duplicate socket overwrite. The first failed test run revealed only a test harness misuse of socket.socketpair() as a context manager, which was fixed before this qualifying PASS.
- AP-253: https://github.com/fawakhry/TrendOs/actions/runs/38265505732 — 15/15 PASS, synthetic temporary user Desktop tests. Verified both entries and safe Exec, preview-only default, exclusive no-overwrite creation, symlink safeguards, rollback if the second file fails, and refusal of unapproved CLI flags. Neither test suite installed anything on the owner's actual Ubuntu system.

## Owner-gated deployment path (NOT yet approved)

1. Confirm the most recent remote HEAD/PR state and compare all changes with the last Ubuntu screenshot-verifiable checkout commit 3c8ade60fecbcb828da74b422fbc0b7b59703a80. Request new explicit owner permission before any guarded, commit-pinned host update; only one Ubuntu command then screenshot per step, no pull/reset/checkout/unapproved merge.
2. Obtain separate permission to create the two new owner Desktop icons (existing AP-250 icon stays unchanged). The owner handles any GNOME Allow Launching trust action.
3. Obtain separate permission for one 75-second synthetic START/STOP test, inspect the live Firefox page then request STOP and verify the old localhost URL no longer works. Do not reconnect Cloudflare or enable printers.
4. Only after that test may additional local, read-only diagnostics or remote orchestration architecture be considered, subject to separate authorization and security gates.
