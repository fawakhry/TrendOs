# AP-132 — Existing modern gateway / router eligibility before legacy Windows 7 file access
Date: 2026-10-10. Status: SOURCE_ONLY decision policy; **NO PHYSICAL SETUP, NO NETWORK CONNECTION**.

## Inherited authority / scope
- Resume AP-131 book SHA `776cdb42fc2937cbe62d29bce4771142e183994e` (previous exact CI 38082376496 SUCCESS), not a fresh project.
- Original files remain on printshop **Windows 7 x64**. Do not change print drivers, Windows edition, customer files, or daily workflow without explicit owner consent.
- Owner-reported real leaf: `D:\\print\\الشغل\\10-2026\\Tooday\\10-10`. Proposed common root: `D:\\print\\الشغل` **PENDING local scope/ACL review**. Preserve literal `Tooday`; `ديجتال` and `فوتو` membership under exact leaf **UNVERIFIED ON DISK**.
- Home **Windows 10 Enterprise 2016 LTSB 1607 build 14393.0** is not demonstrated patched; Microsoft Windows 10 2016 LTSB security updates end 2026-10-13 (see vendor sources). Hold customer-file use until a current supported and patched remote device/client is independently verified.
- NetBird latest cannot be installed on Windows 7: last obsolete release ≤0.25.3 is outside security support. Never install it there.
- No SMB/445, RDP, FTP, guest access, whole disk, SMBv1-only requirement, or shared Windows credentials on the public internet. No auto-mirror, overwrite, rename or delete of staff jobs.

## AP-132 field-discovery decision tree (ask only ONE user action at a time)
1. **Owner asks now:** Is there a separate **supported, patched Windows 10/11 or Linux** PC already inside the printshop, on the same shop LAN/router, allowed to stay powered on continuously? No passwords, private images, MAC IDs or customer names requested.
2. If **YES**: identify its OS/version and update state, always-on power/LAN position, modern VPN routing-peer compatibility, and ability to firewall route access to **only the shop Win7 LAN IP TCP 445**. Prefer modern Linux routing peer if available. Candidate is NOT a working connection; obtain owner consent before installing agents, enabling forwarding or modifying firewall/ACL.
3. If **NO**: ask for the **router manufacturer + model printed on the label** (exclude Wi-Fi password, login and serial). Verify vendor-maintained firmware, WireGuard VPN **server**, one-host TCP 445 filtering, WAN reachability/public address/CGNAT and client compatibility before any configuration. A router VPN listener is different from exposing Windows 7 SMB itself.
4. If no supported router VPN, consider a separate low-cost small Linux device as a gateway. No assumption about purchase budget, no router firmware flashing or OS migrations without approval. Private overlay from a new gateway may work through CGNAT subject to plan/network verification.
5. Independently qualify the HOME endpoint. Existing Win10 LTSB 1607 is **not qualified just because a current VPN client might install**. Windows 10 LTSB servicing deadline and installed patch level must be checked. Prefer supported OS/client before any production customer file access.

## Security gate after deciding the physical candidate — NEVER self-authorizing
- Gateway/current router: maintained OS/firmware; least-privilege private identity/MFA, per-device access; separate VPN endpoint. Do not expose whole LAN. Firewall limits remote owner to Win7 TCP 445 and blocks other sites/clients. Confirm Win7 SMB2+, never enable SMB1 for convenience.
- Windows 7: local-only dedicated **non-admin** Windows account. Restrict BOTH share ACL and NTFS ACL to approved `D:\\print\\الشغل` descendants **only if onsite review confirms scope**. No `Everyone`, Guest, anonymous or full-disk share. Reserve read-only first; separately approve isolated upload staging with no overwrite/delete/rename.
- Protect shop originals with off-machine backups tested separately; an SMB share is not a backup. Inbound SMB to unsupported Win7 still creates LAN risk, so isolate gateway + Win7 at network firewall.
- Test outside printshop Wi-Fi: authenticated listing, dummy-file download, distinct-filename dummy upload, SHA256 equality, denied unauthorized peer, refusal of overwrite, and staff confirmation of unchanged work. Never upload customer photos, passwords or path listings to GitHub/CI.
- No production deploy, D1 mutation, machine control or automatic printing. WhatsApp custom artwork remains gated by exact customer-approved revision under AP-127/128; assembly/ready-to-print follows its established exception rules.

## Code + test boundary
`core/printshop-gateway-qualification-v1.mjs` is a pure, fail-closed **discovery policy**, not a VPN manager. It prioritizes existing modern PC; on NO checks router; otherwise supported Linux gateway. Even fully asserted candidate inputs cannot produce an authenticated file connection, business license verification or permission to deploy. `tests/ap132_gateway_qualification_v1.test.mjs` uses only synthetic facts; CI checks forbidden direct Win7 VPN/WAN SMB/SMBv1/overwrites, hostile objects and existing literal `Tooday` selector.

Sources:
- https://docs.netbird.io/help/support-matrix/netbird-client/windows
- https://docs.netbird.io/manage/networks/how-routing-peers-work
- https://learn.microsoft.com/en-us/windows/release-health/release-information
- https://learn.microsoft.com/en-us/lifecycle/products/windows-10-2016-ltsb

## STOP / next operator action
`AP132_GATEWAY_HARDWARE=UNKNOWN`; `AP132_ROUTER_MODEL=UNKNOWN`; `AP132_HOME_PATCH_STATE=UNKNOWN`;
`AP132_REMOTE_FILES=NOT_CONNECTED`; `AP132_ORIGINALS_UNCHANGED`; `AP132_PRODUCTION_DEPLOY=NO`.
**Only owner question now:** Does a separate current Windows/Linux PC exist on the printshop LAN that can remain powered on? If not, collect router model next. Do not invent its existence.
