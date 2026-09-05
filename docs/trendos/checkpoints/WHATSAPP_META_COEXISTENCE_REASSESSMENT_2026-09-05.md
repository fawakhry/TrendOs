# WhatsApp / Meta Coexistence Reassessment — 2026-09-05

> Scope: resume the historical TrendOS Customer Manager / WhatsApp go-live lane without restarting or touching the current WhatsApp Business App number.
> Branch: `agent/go-live-2026-09-01-integrity`
> Production mutation: **NONE**.

## User intent

Resume the prior WhatsApp auto-reply / Customer Manager work from the exact Meta blocker. Preserve the current WhatsApp Business App number, chats, and registration. No delete, migration, deregistration, or replacement is allowed.

## Historical verified blocker recovered

App: `TrendOS Connect`

- App ID: `1774246503594854`
- Business Portfolio ID: `1318894200354341`
- WABA ID: `26751382591203706`
- Business Support Home previously showed no portfolio restrictions.
- Facebook account 2FA was confirmed ON.
- Failed Meta actions previously recorded:
  - App Dashboard WhatsApp onboarding -> `Onboarding failure`.
  - WABA permission save -> `There was a problem saving your assignments`.
  - People / Assign assets -> `Cannot assign assets`.
  - Business Settings / Apps / add by App ID -> unexpected technical error.
- Meta automated support previously described the situation as a backend / permission-sync gap and directed the user toward a technical-report link, but the captured response ended before the direct link.
- No human/technical ticket number was preserved.

## Repository verification on 2026-09-05

### Current `main`

`customer-manager-backend-v1932.gs` exists and contains:

- `cmSuggest_()` -> OpenAI-assisted suggested reply.
- `cmMetaSend_()` -> WhatsApp Cloud API outbound text send.
- `customerManagerWebhookVerifyV1_()` -> Meta webhook verification.
- `customerManagerWebhookV1_()` -> inbound WhatsApp message ingestion.

The standalone module is older than the merged/current Apps Script lineage and must not be deployed blindly.

### Current integrity working branch

`trendos-whatsapp-integrity-v1.gs` exists on `agent/go-live-2026-09-01-integrity` and is explicitly marked `PREPARED ONLY - do not deploy blindly`.

It adds:

- durable logical send claim before calling Meta;
- same-request replay protection;
- ambiguous-send blocking rather than automatic resend;
- inbound Meta Message ID exact-once handling;
- idempotent message logging.

This confirms the local application-side reliability repair exists, but Meta onboarding still gates live WhatsApp use.

## New external reassessment — 2026-09-05

Current WhatsApp Embedded Signup / Coexistence documentation and current implementer reports show an additional failure mode that must be distinguished from the historical permission-sync diagnosis:

- Coexistence is performed through a customized Embedded Signup flow for a WhatsApp Business App number.
- Current implementations use the WhatsApp Business App onboarding feature type in Embedded Signup.
- Current 2026 reports from Tech Providers show that a Business Portfolio that owns the Developer App can be non-selectable during Embedded Signup for self-onboarding, typically indicating that the provider app cannot onboard its own owning portfolio as if it were a customer.

### Evidence boundary

The historical TrendOS screenshots/messages preserved in memory do **not** contain the exact self-onboarding UI text (`This business portfolio owns the app` / equivalent).

Therefore do **not** rewrite the root cause as confirmed self-onboarding limitation yet.

Current classification:

`META BLOCKER = UNRESOLVED; two candidate classes must be separated before further retries:`

1. **Backend permission / asset-sync failure** — matches the historical errors and Meta automated support response.
2. **Tech Provider self-onboarding topology limitation** — current 2026 Coexistence behavior that can look like an ownership/permission problem when the same Business Portfolio owns the Developer App.

## Exact next diagnostic step in Meta

Before changing permissions or retrying asset assignment repeatedly, open the Coexistence Embedded Signup flow and inspect the Business Portfolio selection step.

Record exactly one of these outcomes:

### Outcome A — own Portfolio is disabled / says it owns the Developer App

Treat as **SELF-ONBOARDING TOPOLOGY BLOCKER**.

Do not delete or migrate the WhatsApp number.
Do not keep repeating WABA assignment attempts.
The next supported path is to confirm the topology with Meta technical support or use a separate legitimate customer/business portfolio topology for the onboarding flow, while the existing WhatsApp Business App number remains untouched until Meta confirms the supported ownership path.

### Outcome B — own Portfolio is selectable, but permission/asset actions still fail

Treat as **BACKEND PERMISSION-SYNC BLOCKER**.

Submit a Meta technical bug/support case with the four exact failures and the IDs above. Request server-side permission/asset relationship repair or resync. Explicitly state that the number must remain on WhatsApp Business App under Coexistence and must not be migrated/deregistered.

## Current support entry points rechecked

- Meta for Developers Platform Bug Reports: `https://developers.facebook.com/support/bugs/`
- Meta Business Suite support path documented by WhatsApp Help Center: Business Suite -> Help -> Help -> Contact Support Team (availability can vary by account).

## Prepared escalation text

Title:

`Permission Sync / WhatsApp Coexistence Onboarding Failure — TrendOS Connect`

Body:

```text
We need technical escalation for a WhatsApp Business Platform / Coexistence onboarding issue.

Meta App: TrendOS Connect
App ID: 1774246503594854
Business Portfolio ID: 1318894200354341
WABA ID: 26751382591203706

The Business Portfolio previously showed no restrictions and account 2FA is enabled.

Repeated failures:
1) App Dashboard WhatsApp onboarding: Onboarding failure.
2) WABA permission assignment save: "There was a problem saving your assignments".
3) People -> Assign assets for the WhatsApp phone asset: "Cannot assign assets".
4) Business Settings -> Apps -> add/link app by App ID: unexpected technical error.

Previous Meta automated support indicated a backend / permission-sync gap.

Critical requirement: the current phone number is actively used in the WhatsApp Business App. We need WhatsApp Business App + Cloud API Coexistence. Please do NOT advise deleting, migrating, deregistering, or replacing the current number/WABA because preserving the existing WhatsApp Business App and conversations is mandatory.

Please check the server-side relationship between the Business Portfolio, WABA/phone asset, and App, and repair/resync the permissions/ownership association if inconsistent.

Also confirm whether this exact Business Portfolio is blocked from Coexistence Embedded Signup because it owns the Developer App. If so, please confirm the supported topology for onboarding this business's own production WhatsApp Business App number without migration/deregistration.
```

## Do not do

- Do not delete the current WhatsApp number.
- Do not deregister it from WhatsApp Business App.
- Do not migrate it to standard Cloud API as a workaround.
- Do not replace the WABA blindly.
- Do not deploy standalone `customer-manager-backend-v1932.gs` over the current Apps Script source.
- Do not activate `trendos-whatsapp-integrity-v1.gs` until the controlled Apps Script deployment sequence and family flags are reconciled.
- Do not repeatedly retry Meta assignment/onboarding actions until the blocker class above is identified.

## Status at checkpoint

- Local Customer Manager / WhatsApp code: **PRESENT**.
- WhatsApp Integrity repair: **PREPARED / CI lineage exists, NOT PRODUCTION-ACTIVATED**.
- Live Meta Coexistence onboarding: **BLOCKED / UNRESOLVED**.
- Production mutation in this reassessment: **NONE**.
- Exact next step requiring Meta UI evidence: **run one clean Embedded Signup Coexistence attempt and capture the Business Portfolio selection result before any destructive or repeated permission action**.
