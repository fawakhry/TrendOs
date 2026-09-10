# TrendOS RP-06 — Recovery Preview Duplicate Declaration Repeat

Date: 2026-09-10
Branch: `agent/go-live-2026-09-01-integrity`

User retried the read-only `trendosCoreP0RegistryPreviewV1` after installing the recovery writer, and Apps Script again failed before function execution with:

`SyntaxError: Identifier 'TRENDOS_CORE_P0_REGISTRY_WRITER_VERSION_V1' has already been declared`

Apps Script error hyperlink points to:

`TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1.gs:1`

Conclusion: a second global writer declaration still exists in that helper/approval file. The authoritative recovery writer file does not need another replacement at this point. Clear/delete the duplicate writer content from `TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1.gs`, leaving no global registry-writer constants/functions there, then Save + Reload and retry only the read-only preview.

No Registry Write, Recovery Write, Rollback, Script Property mutation, deploy, flags, source-sheet mutation, or D1 mutation occurred in this failed syntax attempt.

STOP: duplicate declaration blocker remains until the helper file is cleared.