# AP-260 — explicit owner-local read-only metadata snapshot (GitHub staging only)

**State: GitHub-staged + 17/17 hosted synthetic PASS. NOT installed, run, trusted or qualified on the owner Ubuntu host. NOT an OpenAI/ChatGPT-to-Ubuntu connection or remote agent.**

## What is implemented

Source file: `autonomous-printshop/local_executor/offline_snapshot.py`.

This deliberately stays *outside* the AP-233 `policy.py` and immutable AP-236 catalog; those remain **pure source-review gates and have no dispatch implementation**. The new file is an **owner-invoked local diagnostic only**. It exposes no HTTP/TCP/Unix listener, remote job queue, scheduler, remote endpoint, secret handling or arbitrary-command interface.

After **separate owner consent to update the exact reviewed source commit**, then separate consent to a one-time local read-only diagnostic, the intended invocation is:

```bash
python3 -B "$HOME/TrendOs/autonomous-printshop/local_executor/offline_snapshot.py" --snapshot
```

**Do not invoke this on Ubuntu without those new permissions.** It is not retroactive proof of AP-259 or any other test.

The output is one redacted JSON object with keys:

- `schema`, `execution=OWNER_LOCAL_READ_ONLY`, `remote_executor=NOT_ESTABLISHED`, `production=NOT_ACCESSED`
- `python_version` (interpreter metadata)
- `git_head` (strict 40-character lowercase hex)
- `git_branch` (limited to a constrained printable character set)
- `tracked_changes=YES|NO`: *only* the tracked/index state inspected with fixed Git diff checks; does **not** claim complete working-tree cleanliness.
- `untracked_files=NOT_SCANNED`: no untracked filesystem inventory; no filenames or file contents are returned.

The CLI has exactly one accepted argument `--snapshot`. No caller-selected paths, commands, environment, repo names, file globs, network addresses or credentials. It checks the user's existing standard `$HOME/TrendOs` checkout, source location, owner UID and ordinary non-symlink `.git` directory, and refuses running as root. Output and errors use bounded, non-sensitive fields.

### Git subprocess boundary

Four fixed, shell-free Git reads with no optional locks: HEAD SHA, symbolic branch, unstaged tracked diff, staged tracked diff. The Git invocation disables external diff, textconv, fsmonitor, hooks path, optional locks, inherited global/system config and stdin. All process invocations have a four-second timeout, stdout length bound, stderr discarded and synthetic tests checking no sensitive paths leak to the result.

The script **never** invokes `git pull`, `checkout`, `merge`, `reset`, `fetch`, network operations, cloud/D1/EasyStore, printer APIs, command shells, file-writing tools or the Print Server runtime. It does not scan local customer or printer directories. This is not a sandbox or complete audit of local Git configuration; OS user-space controls and immutable signed requests remain separate, unresolved remote-agent gates.

## GitHub qualification

[AP-260 Hosted Synthetic CI run 38275481646](https://github.com/fawakhry/TrendOs/actions/runs/38275481646) — **17/17 PASS**, Python 3.12 on a GitHub-hosted Ubuntu runner. Tests construct a throwaway local Git repository and validate clean/dirty tracked states, deliberately ignored untracked data, rejected symlink/missing/incorrect paths, root refusal, fixed safe CLI flags, timeout/errors, and no execution of arbitrary operations. No real Ubuntu owner host is connected, modified or scanned.

## Next operational gates

1. **Remote execution still OFF:** AP-233/234/235/236/237/238 trust and approval models remain non-authoritative. No third-party runner, server, NetBird inbound ACL, SSH changes, GitHub runner, personal token or Cloudflare remote control can be installed or enabled based on these CI results.
2. **Before any owner-host file change:** obtain new explicit approval for a pinned, allowlisted `$HOME/TrendOs` source update based on latest GitHub HEAD and a fresh compare from the last screenshot-verified Ubuntu commit `36934d31089e68755881b2ca957be819d373f260`. One Ubuntu command at a time, screenshot required. Do not update merely for this document.
3. **Before any actual diagnostic run:** ask owner permission for a read-only `--snapshot` run, confirm no print/customer/cloud change, have owner execute it once, and capture the sanitized output. Do not infer remote control from successful local results.
4. **Future autonomous developer workflow:** design a separate *authenticated, outbound-only, explicit owner-gated* request channel after independent sandbox/identity/replay/security review; until those gates pass, keep any automation **GitHub-hosted/synthetic only**. Do not pass free-form commands or attach customer folders to any agent.

**Production Print Server, printing, financial operations and cloud synchronization: NOT AUTHORIZED. PR #95: remains Draft and must NOT be merged without explicit owner approval.**
