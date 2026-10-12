# AP-278 — Local order/ready path confinement and non-overwrite synthetic qualification

**2026-10-12 — hosted GitHub-only, NO production deployment or host action.**

## Review of existing production components

AP-277 protected HTTP POST entry. Existing `src/folders.py` still built nested order folders and ready targets from data/state/config; `Path.mkdir(exist_ok=True)` follows an existing symlink to a different directory, and `shutil.copy2(src, dest)` can overwrite a same-name target, potentially including a symlink. These are independent of HTTP caller authentication; allowing them into production would be unsafe.

## AP-278 staged modifications

- `_confined_path(root, candidate)` rejects direct path escapes, `..` traversal and pre-existing symlinks in descendant path elements before folder or ready-file operations. No customer network or printer use.
- `create_for_claimed_order` bounds both the state-restored order folder and new folder inside the configured orders root. `create_manual_folder` bounds work-category and `x` folder creation.
- `publish_structured_approval` rejects sources outside the order folder, linked sources and linked or poisoned route destinations. It validates the ready directory and destination as descendants of the explicitly configured ready root.
- Ready publishing uses an exclusive, no-clobber destination creation (O_CREAT | O_EXCL and O_NOFOLLOW where available). Repeat approvals with identical hash reuse the file rather than overwrite. A name collision with different content uses a content-hash suffix; further collision fails closed rather than overwrite.
- The file contents are checked again after copy. A detected source mutation fails the operation and removes the newly created destination.

## Evidence

[Hosted AP-278 GitHub Actions run 38308185603](https://github.com/fawakhry/TrendOs/actions/runs/38308185603), job `115007202345` COMPLETED/SUCCESS, inspected full job logs:
- AP-278 new path guard tests: **Ran 11 tests in 0.038s, OK**
- AP-277 auth guard regressions: **Ran 12 tests in 0.635s, OK**
- AP-276 original operational synthetic flow: **Ran 6 tests in 0.340s, OK**
- `AP278_HOSTED_PATH_SYNTHETIC=PASS`; GitHub CI operated on generated fake data and temporary folders only.

## Boundaries and unresolved hazards

The path guard blocks **static / already-present** symlink attacks, not adversarial concurrent rename/symlink swaps between check and filesystem use. Source `open()`, parent directory renames, Windows junctions/reparse points, network-share semantics, filesystem permissions, hardlink aliasing and multi-process publishing remain **unqualified**; these demand separate POSIX dirfd/openat O_NOFOLLOW or a verified OS-specific containment implementation before a shared production environment. This source-only patch is NOT proof of race-free containment or complete customer data security.

Manual route selection, a hash and an allowed `sourceKind` string do NOT authenticate actual customer approval. Provenance and approval contract remain pending. GitHub runners have no production print device, Ubuntu owner files or Windows7 business directories.

**Next safe coding gate:** fail-closed shadow/read-only transition evaluation in `TrendOSStatusBridge`, test that incomplete or new-line-only status snapshots never silently trigger folder creation. **Owner gate:** confirm Ubuntu `TrendosShop` is in shop vs home before any on-site run plan. Don't use real orders, merge PR #95, change live credentials, enable Cloudflare, run `run.py`, pull Ubuntu code, print or change finance.
