# Tasks V3 T1 — Apps Script profile auth recheck — 2026-09-15

## Scope
Read-only authentication recheck for the isolated T1 Apps Script project only.

- Branch: `tasks-v3-t1-preview-candidate-20260914`
- Isolated Apps Script project ID: `1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV`
- Expected project: `TrendOS Tasks V3 T1 Preview Bridge 2026-09-14`
- Diagnostic source is already present on the branch in `tasks-v3-bridge-readonly.gs` (introduced by code commit `26c7695dca91f4c0381e23661dad7d5aaf4b5112`).

## Verification performed
TinyFish Browser Context Profile was used for a read-only attempt to open the exact standalone Apps Script editor.

Run ID: `29e2e804-46f5-459f-a0f5-2b95a87b1115`

Result:
- The exact Apps Script editor did not load.
- Browser was redirected to the public Google Apps Script documentation page.
- A `Sign in` button was visible.
- No authenticated `script.google.com` session was available to the automation profile.
- No source edit occurred.
- No save occurred.
- No deployment occurred.
- No Script Properties, secrets, spreadsheet IDs, access settings, or project settings were changed.

## Current T1 state
T1 remains FAIL from the prior server-side timing qualification (p95 above the 2s acceptance target). T2 remains locked.

The user separately demonstrated on mobile Chrome that the correct standalone project is accessible in their own Google session, but that browser session is not shared with the TinyFish automation profile.

## Required next step
From the user's authenticated Apps Script editor for the exact standalone T1 project:
1. Replace `Code.gs` with the current branch contents of `tasks-v3-bridge-readonly.gs`.
2. Save.
3. Update the existing Web App deployment using `Deploy -> Manage deployments -> Edit -> New version -> Deploy`, preserving the same deployment identity and settings.
4. Do not touch the main TrendOS Apps Script project.
5. After deployment, run the 30-call T1 health diagnostic and collect `Server-Timing` plus `verifyAssertionMs`, `propertiesMs`, `openSpreadsheetMs`, `sheetLookupMs`, and `totalBridgeMs`.

No optimization is authorized in this diagnostic step.
