# AP-129 — Printshop PC is authoritative file server: remote day folders from home or anywhere

**State:** Owner requirement accepted; SOURCE_ONLY policy and runbook. No local PC access, network-share setup or file copying has been performed.

## Exact owner requirement
The photos received on WhatsApp, staff-made proofs/designs, collages and print-ready outputs are saved on the **printshop Windows computer**, organized by staff in a workday directory like `1-1-2026`, with subdirectories **`ديجتال`** and **`فوتو`**, each containing the clients' work. Owner must be able to remotely browse these same actual shop directories from the HOME Windows computer or another authorized device anywhere, both **download FROM** and **upload TO** the printshop. Keep originals on the shop PC; no forced relocation, mirror or rename of the established folder tree, no disclosure of customers.

For custom designs, WhatsApp preview and final print file may be different binary exports of one approved artwork revision (AP-127/128); ordinary assemblies/ready-print files do not require customer approval unless client explicitly requests a proof. Remote file transfer **does not constitute artwork approval, verified stock or machine readiness**.

## Recommended no-monthly-fee pilot: NetBird Cloud Free + native Windows authenticated work-folder SMB share

Source (checked October 10, 2026):
- https://netbird.io/pricing : Free plan intended for individuals or small teams; up to 5 users and 100 devices, with encrypted peer-to-peer links and access-control rules. Confirm current plan/service terms at signup; never silently upgrade to a billable tier. This use is a working small printshop, not home/hobby use.
- https://docs.netbird.io/get-started/install/windows : Windows installer adds background service and tray app. Latest client for Windows 10/11, not old Windows 7/8 supported releases. Check `winver` on printshop before install; older unsupported Windows is a security blocker.
- https://support.microsoft.com/en-us/windows/experience/connectivity-networking/file-sharing-over-a-network-in-windows : Windows share a folder to Specific people, not Everyone; from the other Windows PC, map share to a drive.
- https://docs.netbird.io/use-cases/remote-access/reach-services-on-the-routing-peer : NetBird remote access to Windows SMB service.
- Tailscale Personal free is explicitly for NON-COMMERCIAL use per https://tailscale.com/pricing . Do not promise its free personal plan for this commercial printshop. ZeroTier free Personal also non-commercial in its current terms. NetBird Free is the zero-cost option to test, subject to plan terms.

### Stage A — Prepare printshop Windows PC (owner present; never remote-execute from ChatGPT)
1. Confirm Windows release with `winver` and **actual existing folder path** (e.g., `D:\<actual-folder>`, illustration only). Do NOT create a second root, restructure day/area/customer names, or sync the entire folder tree just to allow browsing.
2. Install NetBird from official provider site and sign in to the owner's private NetBird network; enable background service. Confirm only desired owner devices are members and use access rules to restrict connections to the printshop host (SMB port 445). Require device/user login; enable MFA where supported.
3. Right-click **the existing common parent of day folders**, Properties > Sharing > Advanced Sharing > Share this folder. Give share a deliberate name e.g. `TrendMallJobs`. Restrict **both Windows Share permissions and NTFS Security permissions** to a dedicated non-admin owner Windows account; no `Everyone`, no `Guest`, no anonymous browsing. Start by validating owner READ access and only then authorize WRITE on the same specific work root. If restrictive share/ACL/firewall configuration cannot be confirmed, stay blocked.
4. Windows Firewall must allow inbound File and Printer Sharing (SMB TCP 445) **only from allowed NetBird peer(s)**, not from public/WAN networks or all clients. Never expose TCP 445 on router/port forwarding, open Windows Remote Desktop, or publish the root through an unauthenticated URL.
5. Document the private NetBird IP/name of the printshop computer **inside protected owner setup**, not GitHub or public chat. Do not paste Windows passwords, access tokens, customer photos or file paths here.

### Stage B — Access from home or any authorized Windows device
1. Install NetBird on the HOME PC and sign in to the SAME authorized network. Verify that the printshop host is online; the printshop PC must remain powered on, not sleeping, connected to Internet and have the share service running.
2. Open Windows File Explorer, enter an illustrative UNC address: `\\<PRINTSHOP_NETBIRD_IP>\TrendMallJobs`. Enter the dedicated SMB share account credentials through Windows credential dialog (do not put credentials in URLs). From File Explorer > This PC > Map network drive, assign a convenient drive letter and Reconnect at sign-in, if desired.
3. Open **exact existing** workday folder, e.g. `1-1-2026\ديجتال` or `1-1-2026\فوتو`; view, copy from printshop to home and copy new files from home to printshop by drag & drop. Folder and filenames remain unchanged. Files are served FROM the printshop device, not duplicated automatically throughout all PCs.
4. Validate end-to-end with **one synthetic noncustomer 1MB test file** in a separately designated test area under the authorized root; check up- and downloads and successful SHA256 match. Then test one existing genuine read-only file (no content shared with ChatGPT) after staff approval. For uploads, upload under a **new filename** or private staging folder and let onsite staff move/approve the final artwork; never silently overwrite an in-progress file. Disable automatic delete/rename for remote access unless separately reviewed.
5. Test being **outside shop LAN**, from home's normal internet. If a second site or 4G/LTE device needs access, that device must be explicitly enrolled and permissioned too. Browser access from an untrusted public PC is NOT provided by Windows share.

### Stage C — TrendOS / autonomous printshop UI integration
- Immediate access is via File Explorer and the private share, NOT a public TrendOS browser tab. Browsers cannot directly mount Windows UNC folders or the shop local disk as authenticated web file servers. A future **protected printshop-side file service/agent** is required for an in-app `ملفات المطبعة` screen with browse/download/upload/preview and per-order-line manifests.
- The protected server must validate Owner identity, tenant, device, allowed root, customer line/order authorization, filename/path traversal, real file SHA256, server-side workday/area validation, max size, size/content-type allowlist, concurrent edits and version history. Protect customer photos/approvals; never stream private file contents through public repo CI/GitHub Actions.
- New source-only `printshop-remote-work-folder-policy-v1.mjs` validates safe day format, category `ديجتال`/`فوتو`, operations BROWSE/DOWNLOAD/UPLOAD and caller-attested network/owner/SMB gates while returning **no real permission** and doing **zero** filesystem/network I/O. Actual OS-backed access, credentials and remote UI remain not implemented.
- Retain the older HOME PC Syncthing candidate at `C:\Users\Fannan\TrendMall-Sync` (previously setup began, not confirmed complete on shop PC). **Do not re-use Syncthing as an automatic mirror of all live customer work**; user specifically wants on-demand browse, drag/drop and one authoritative shop location. If Syncthing remains, scope to its separate explicitly approved exchange folder only. Avoid concurrent edits on same file.

### Blocking input for live setup
**AP-130 update:** Actual shop day path provided. The proposed common root is D:\print\الشغل; this scope requires onsite confirmation. Next required checks: printshop Windows version via winver, and whether ديجتال / فوتو are inside the actual 10-10 folder.

### Acceptance criteria (not yet verified)
- Printshop remains single source of truth; same `day\ديجتال|فوتو\customer work` visible at shop and remotely.
- Authorized owner can list/download/upload one synthetic file from home or other enrolled device over private encrypted tunnel; uploaded bytes validated with hash, no silent overwrite.
- Unauthorized/non-enrolled device cannot connect; Windows share prompts for account credentials; no WAN port 445 exposure.
- Staff continue to save/print/approve designs exactly as before; NO production D1 or Operator Task modifications.
- Separate off-machine BACKUP/versioning and recovery still required; a shared Windows folder is **not backup**, even if remote-accessible.


## AP-130 owner-confirmed current shop day path (2026-10-10)

Owner supplied EXACT current working folder on printshop Windows machine:

```text
D:\print\الشغل\10-2026\Tooday\10-10
```

This is **the day folder**, NOT the share root. Do not mistakenly share only `...\Tooday\10-10`, which would break access to other days. The currently inferred common root (PENDING confirmation that the folder contains only intended shop work) is:

```text
D:\print\الشغل
```

The **observed hierarchy** is now `<work root>\<month-year>\Tooday\<short-day>`, with `Tooday` written **exactly that way**, not "Today". The earlier assumption that a workday directory always has the flat form `1-1-2026` directly under the common root was INCORRECT for this owner's supplied current folder. Do not rename the folders or migrate customer files.

Expected category targets based on the prior owner's description, **NOT YET VERIFIED ON THIS DISK**:

```text
D:\print\الشغل\
└── 10-2026\
    └── Tooday\
        └── 10-10\
            ├── ديجتال\  (expected, not independently checked)
            └── فوتو\    (expected, not independently checked)
```

Use the literal actual path above as authority, not illustrative diagrams. The next two branches, `ديجتال` and `فوتو`, are expected by earlier owner account but have not yet been confirmed under THIS exact `10-10` folder. **Never auto-create them.**

New source layout mode `MONTH_TOODAY_DAY` converts known ISO date `2026-10-10` to relative selectors:

- `10-2026\Tooday\10-10\ديجتال`
- `10-2026\Tooday\10-10\فوتو`

`FLAT_DAY` remains backward-compatible for historical `1-1-2026\ديجتال` folders. These selectors are for a future host: they do not touch Windows disk, mount SMB, change ACLs or prove actual folder existence.

**Immediate shop-side verification before installing any VPN or exposing a share:**
1. Confirm the Windows version with `Win+R` → `winver` on SHOP computer. Current NetBird client supports Windows 10/11; unsupported Windows 7/8 only have obsolete unpatched builds — do not place a customer-file share on those.
2. Open `D:\print\الشغل\10-2026\Tooday\10-10` and confirm `ديجتال` and `فوتو` folders are actually underneath it, without uploading any customer screenshots.
3. Confirm `D:\print\الشغل` contains only work intended for owner access (not unrelated protected staff/personal files). Only then configure restricted SMB share from THIS parent across months, over private NetBird network, using a non-admin Windows account and least privilege. If the root contains broader content, share a properly scoped alternative or use a protected file agent; don't widen access silently.

**Security + data semantics:** Keep shop folder original, disable unsolicited mirror sync, never expose TCP 445 to the public router, do not allow guest/Everyone share, test one fake-file transfer in both directions and check no overwrite before touching real orders. Current AP-130 is **SOURCE_ONLY TESTED; actual OS, area subfolders, NetBird, share and transfers NOT VERIFIED**.
