# TrendOS RP-06 — Recovery Patch Tests Added

Date: 2026-09-10
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Test mutation

Recovery regression tests were committed as:

`7ab1af20cd2b2b73182ca532314fe6da25cd0033`

Updated test blob:

`05fbd72caca6d9fd5302afa441cf8d38a66b1f7d`

The writer code under test is the immediately preceding recovery writer blob:

`81e994945af7fefdd38538a7ca569e73483f3d24`

## Added coverage

The test harness now simulates Google Sheets DATE coercion for strings shaped like `3536-01` unless their target cells were explicitly formatted as plain text before `setValues`.

Coverage includes:

- normal Registry append keeps date-like Press Entity Keys as raw strings and forces the Entity Key cell to plain-text format;
- unchanged exact 33-spec plan hash remains locked to `5bc903bc8937ac4f523c98dec9e12a0ad6e4bff19928b4a8aa5737da32c94eab`;
- distinct recovery approval hash is locked to `ef3a590e11cd4c273aa552c238f4a1d3878a3bc8c85a944c84a084786d9e9a82`;
- an approved rollback (`APPROVED_ROLLBACK`) does NOT qualify for recovery;
- writer AUTO_ROLLBACK history is reproduced, including 33 active + 33 inactive revisions;
- legacy production shape is simulated by coercing the 11 numeric-looking Press keys in both blocks into Date values while retaining their displayed IDs;
- recovery preview recognizes the displayed historical Entity Keys without mutating history and requires all 33 exact mappings to be recoverable;
- stale live evidence blocks recovery and consumes the one-use recovery approval without appending rows;
- successful recovery appends 33 active mappings as new history, preserves the legacy 66 rows, stores date-like Press keys as text, and resolves the exact mappings;
- recovery preview refuses a second recovery once latest mappings are active.

## State

This is still a GitHub-only patch checkpoint. CI has not yet been evaluated for this exact head at the moment of this record.

No Apps Script Head update, Registry write/recovery write, Script Property, deploy, flags, source Sheet mutation, D1 mutation, merge, or RP-07 action occurred in this step.