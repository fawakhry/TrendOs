# TrendOS RP-06 — Recovery Patch Writer Intermediate Commit

Date: 2026-09-10
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

Owner approval was already recorded in `TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PATCH_OWNER_APPROVED_START.md`.

## Intermediate code mutation

Writer-only recovery changes were committed as:

`d8acca532b238ee78497c598bd2fb363c0ffe1db`

New writer blob:

`81e994945af7fefdd38538a7ca569e73483f3d24`

This is NOT a completed patch checkpoint. Tests are still pending and this intermediate commit must not be installed into Apps Script.

Implemented writer-side changes include:

- force Registry columns A:G and I to plain-text number format before data append;
- keep H as timestamp and J as boolean;
- read Registry `Entity Key` from display values for recovery-state/history matching, so legacy date-coerced keys can be recognized without editing history;
- add distinct recovery version and one-use recovery approval property;
- add deterministic recovery hash tied to the unchanged 33-spec plan hash and exact writer AUTO_ROLLBACK reason;
- add read-only `trendosCoreP0RegistryRecoveryPreviewV1`;
- add `trendosCoreP0RegistryRecoveryWriteV1`, bounded to exact histories where latest revision is the writer AUTO_ROLLBACK state immediately preceded by an active exact mapping with the same evidence hash;
- arbitrary/approved rollback inactive mappings remain non-recoverable;
- normal `trendosCoreP0RegistryWriteV1` still rejects explicitly inactive mappings;
- recovery failure appends an inactive recovery rollback revision; no history deletion or in-place `Active?` flip.

The 33-spec data plan and normal plan hash are intentionally unchanged. Production recovery remains prohibited pending tests + CI + fresh Preview33 + RecoveryPreview33 + new explicit owner approval.

STOP marker for this intermediate step: no Apps Script, Registry, Script Property, deploy, flags, source Sheet, D1, merge, or RP-07 mutation occurred.