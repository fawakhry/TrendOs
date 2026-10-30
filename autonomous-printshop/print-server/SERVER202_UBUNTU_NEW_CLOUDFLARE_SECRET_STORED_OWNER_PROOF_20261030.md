# SERVER-202 — Ubuntu rotated-stage secret saved with mode 600 (owner screenshot)

**Date:** 2026-10-30 Africa/Cairo. **Evidence:** Owner Ubuntu terminal screenshot under user `trend-main`.

## Observed facts
- User ran existing stage-only helper: `bash "$HOME/.local/share/trendos-stage-secrets/save-new-secret.sh"`.
- Screen shows hidden prompt `Paste new Client Secret (hidden), then Enter:` followed by `SECRET_SAVED=YES`, `SECRET_FILE_PERMISSION=600`, and a normal terminal prompt.
- Earlier SERVER-199 checked parent directory mode 700. Helper syntax was verified in SERVER-200 and uses no-clobber and mode 600 for file at `$HOME/.local/share/trendos-stage-secrets/cloudflare-client-secret`.
- This demonstrates successful **local file creation and permissions**, *not* that the stored string is correct, that browser rotation succeeded, that the relevant Client ID is paired, that Access authenticated the request, or that stage HTTP403 was fixed. The previous Cloudflare modal was pre-rotation; no direct post-rotation dashboard screenshot has been provided.
- Screenshot also shows owner-run UFW firewall ALLOW rules for SIP UDP 5060 and RTP UDP 10000-20000 restricted to `192.168.1.0/24` on `wlp3s0`, part of separate Trend Call Center work. These were not requested or performed by this TrendOS staging interaction. Avoid unrelated Asterisk/UFW modifications.

## Safe continuation
- Do not print, cat, hash, paste, retype, upload, or screenshot the secret. File permissions restrict access to the OS owner but are not encryption at rest.
- The stage diagnostic script `src/server108_stage_edge_diagnostic.py` uses `getpass` for both Client ID and secret. Do not ask the user to print the file to reenter the secret. If a one-shot GET is explicitly authorized, prefer a safe, stage-only file-consuming adapter that checks owner, file type, mode 0600 and parent mode 0700, and reports response metadata only (not secrets/body).
- A one-shot stage-only request would be new evidence because the credential may now be different from the October 23 failed Ray; no such request has been executed or authorized in this turn. Confirm owner approval before that probe. If it still returns 403, share only fresh Ray and UTC time with existing support case `02394197`; do not run again.
- PR #190 verified open/draft and unmerged, no Cloudflare Access policy edit, production/finance/order operations, or deployed Worker modifications.

`SERVER202_SECRET_FILE_SAVED=YES_OWNER_SCREENSHOT`; `FILE_MODE=600`; `DIR_MODE=700_PREVIOUSLY`; `CLOUDFLARE_ROTATION_POST_STATE=NOT_DIRECTLY_VERIFIED`; `STAGE_HTTP_GET=NOT_EXECUTED_THIS_TURN`; `ACCESS_AUTH_SUCCESS=NOT_PROVEN`; `PR190=OPEN_DRAFT`.
