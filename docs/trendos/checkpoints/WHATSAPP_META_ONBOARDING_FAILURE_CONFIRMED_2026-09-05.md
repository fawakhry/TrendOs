# WhatsApp / Meta Onboarding Failure Confirmed — 2026-09-05

> Branch: `agent/go-live-2026-09-01-integrity`
> Production mutation: **NONE**.

## New UI evidence

A fresh Meta onboarding attempt was performed from the TrendOS Connect WhatsApp use-case flow.

Observed UI state:

- WhatsApp Business Platform onboarding modal opened successfully.
- Business Portfolio dropdown was available and selected as `المطبعجي`.
- The flow did **not** show the portfolio as disabled or blocked because it owns the Developer App.
- Meta displayed a red toast: `Onboarding failure`.

## Classification update

This evidence materially weakens the self-onboarding-selection-blocker hypothesis for this exact test.

Current blocker classification:

`META ONBOARDING / PERMISSION-SYNC FAILURE — CONFIRMED AT FLOW EXECUTION; ROOT SERVER-SIDE SUBCAUSE STILL REQUIRES META TECHNICAL SUPPORT.`

The historical failures remain consistent with this class:

1. App Dashboard WhatsApp onboarding -> `Onboarding failure`.
2. WABA permission assignment save -> `There was a problem saving your assignments`.
3. People -> Assign assets -> `Cannot assign assets`.
4. Business Settings -> Apps -> add/link app by App ID -> unexpected technical error.

Business Support Home previously showed no portfolio restrictions and account 2FA was confirmed ON.

## Exact next step

Stop repeated onboarding retries.

Open Meta technical support / Developer bug reporting and submit a single consolidated case requesting server-side repair/resync of the Portfolio <-> WABA/phone asset <-> Developer App relationship.

Required identifiers:

- App: `TrendOS Connect`
- App ID: `1774246503594854`
- Business Portfolio ID: `1318894200354341`
- WABA ID: `26751382591203706`

Critical preservation requirement:

- Keep the current WhatsApp Business App number active.
- Preserve existing chats and registration.
- Do not delete, migrate, deregister, or replace the number/WABA as a workaround.
- Required target is WhatsApp Business App + Cloud API Coexistence.

## Prepared support title

`Permission Sync / WhatsApp Coexistence Onboarding Failure — TrendOS Connect`

## Prepared support body

```text
We need technical escalation for a WhatsApp Business Platform / Coexistence onboarding issue.

Meta App: TrendOS Connect
App ID: 1774246503594854
Business Portfolio ID: 1318894200354341
WABA ID: 26751382591203706

The Business Portfolio is selectable in the WhatsApp onboarding modal, but the flow fails with the red error: "Onboarding failure".

The Business Portfolio previously showed no restrictions and account 2FA is enabled.

Repeated failures:
1) App Dashboard WhatsApp onboarding: Onboarding failure.
2) WABA permission assignment save: "There was a problem saving your assignments".
3) People -> Assign assets for the WhatsApp phone asset: "Cannot assign assets".
4) Business Settings -> Apps -> add/link app by App ID: unexpected technical error.

Previous Meta automated support indicated a backend / permission-sync gap.

Critical requirement: the current phone number is actively used in the WhatsApp Business App. We need WhatsApp Business App + Cloud API Coexistence. Please do NOT advise deleting, migrating, deregistering, or replacing the current number/WABA because preserving the existing WhatsApp Business App and conversations is mandatory.

Please check the server-side relationship between the Business Portfolio, WABA/phone asset, and App, and repair/resync the permissions/ownership association if inconsistent.
```

## Status

- Customer Manager / WhatsApp application code: PRESENT.
- Integrity/idempotency repair: PREPARED on working branch, NOT production-activated.
- Meta Coexistence onboarding: BLOCKED.
- Current action owner: Meta technical support.
