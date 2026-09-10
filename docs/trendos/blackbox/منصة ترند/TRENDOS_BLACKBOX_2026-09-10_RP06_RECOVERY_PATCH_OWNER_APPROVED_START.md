# TrendOS RP-06 — Recovery Patch Owner Approved / Start

Date: 2026-09-10
Repository: `fawakhry/TrendOs`
Working branch: `agent/go-live-2026-09-01-integrity`

## Owner approval

Owner explicitly instructed: `نفذ Recovery Patch`.

## Bounded GitHub-only scope

This approval authorizes a recovery patch on the working branch only. It does NOT authorize Apps Script production execution, Registry mutation, Script Property changes, deploy, flags, source Sheet mutation, D1 writes, merge, or RP-07.

Required patch goals:

1. prevent Google Sheets from coercing Registry text identifiers such as Press Entity Keys (`3536-01`) into DATE/number values;
2. add regression coverage for date-like Entity Keys;
3. add a bounded recovery path that can reactivate only exact mappings whose latest revision is inactive because of the writer's own `AUTO_ROLLBACK: post-write evidence or registry verification failed` state, while continuing to reject arbitrary or approved-roll-back inactive mappings;
4. require fresh live evidence/hash validation and a new one-use recovery approval before any recovery append;
5. provide a read-only recovery preview before any future production recovery write;
6. preserve the existing 66 Registry history rows unchanged and append-only semantics.

## Current confirmed live state before patch

- Preview33 previously PASS: 33/33, `errors=[]`.
- first production write attempt appended 33 active mappings then post-write verification failed;
- writer auto-rollback appended the same 33 mappings inactive;
- latest state for each exact mapping is inactive;
- root cause confirmed: 11 numeric-looking Press Entity Keys were stored by Sheets as DATE/number rather than plain text;
- current one-use write approval is consumed;
- direct Registry edits or `Active?` flips are prohibited.

## Safety boundary

Patch implementation and CI only. STOP before any Apps Script Head update or production recovery execution. A new preview/recovery-preview and new explicit production approval are required after the patch passes CI.
