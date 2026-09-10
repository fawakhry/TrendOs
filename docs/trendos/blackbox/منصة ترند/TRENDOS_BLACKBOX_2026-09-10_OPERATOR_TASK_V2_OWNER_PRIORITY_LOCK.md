# TrendOS Blackbox — Operator Task V2 — Owner Priority Lock

Date: 2026-09-10
Status: **OWNER-APPROVED ROADMAP PRIORITY — AUTHORITATIVE UNTIL OWNER EXPLICITLY CHANGES IT**

## Decision

Operator Task Workflow V2 is the **immediate next production implementation track after RP-07 is fully closed PASS**.

Canonical order:

`CURRENT: RP-07 -> NEXT: Operator Task V2 (OT-01 onward) -> THEN: RP-08 / broader roadmap`

This is not merely a suggestion or optional backlog item. It is the owner-approved execution order.

## Current stage

- Current blocking stage: `RP-07`, paused at `Runtime Phase 0B — READ ONLY`.
- Operator Task preparation stage: `OT-00 — Design / Preparation`, allowed in GitHub only while RP-07 remains open.
- First Operator runtime stage after RP-07: `OT-01 — Runtime install, inert` under a separate explicit runtime approval boundary.

## Sequencing rules

1. Do not activate Operator Task V2 before RP-07 is fully closed PASS.
2. Once RP-07 is fully closed PASS, do not proceed to RP-08 first.
3. The next production insertion is Operator Task V2: install inert, qualify Cloudflare facade/Google authority bridge, canary Wael, canary Gaber, then stabilize/metrics.
4. Resume RP-08 only after the Operator Task rollout/validation track is completed to the owner-approved stopping point, unless the owner explicitly reprioritizes.
5. GitHub-only preparation for Operator Task V2 may continue during RP-07 as long as all runtime gates remain OFF and no production mutation occurs.

## Architecture remains

Initial live architecture:

`Operator browser -> Cloudflare TrendOS UI/API -> Google Apps Script/Sheets authoritative Task writes -> D1 mirror/read support`

Later D1 Task write-authority cutover is separate and must not introduce uncontrolled dual-authoritative writes.

## Authority

This record supersedes any wording that could be read as Operator Task V2 being merely optional after RP-07. Any new chat/session must treat Operator Task V2 as the next owner-prioritized implementation immediately after RP-07 closure, before RP-08, unless a later explicit owner decision supersedes this record.
