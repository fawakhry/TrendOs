# TrendOS Test Suite Catalog

> Branch: `candidate/t12-full-cloud-cutover-a56-20260929`
>
> Purpose: content-reading audit of every file under `tests/`. Each row is produced after reading the test file itself and extracting its direct imports/targets and declared test cases. This catalog proves repository test coverage structure; it does **not** prove a test passed in CI unless a separate run/result is cited.

## Columns
- **Target/imports**: local repository modules/files referenced directly by the test.
- **Cases**: count of declared `test()`, `it()`, or `describe()` blocks (static count; nested structure may vary).
- **Class**: functional family inferred from content/imports.
- **External/runtime**: whether the test itself contains network/runtime/environment-dependent operations.

| # | Test file | Target/imports | Cases | Class | External/runtime |
|---:|---|---|---:|---|---|
