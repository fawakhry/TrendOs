# AP-134 — Owner-provided iMac12,1 hardware selected for low-cost TrendOS server pilot

Date: 2026-10-11. **SOURCE-ONLY / HARDWARE NOT INSPECTED / NO INSTALL APPROVED.**

## Owner decision
- Owner selected a previously available **Apple iMac12,1, 8GB RAM, 128GB SSD**, with upgrades later, instead of buying a Mini PC now. No separate modern computer is currently in the shop (AP-133 statement); **where this iMac is currently located is not yet known**, so do not assume it has already been moved onsite.
- Priority is a future **complete autonomous printshop orchestration server**, but the initial workload is a **private NetBird Linux gateway + small local TrendOS service / local-order-file index** only. NOT locally hosted heavyweight AI generation, bulk customer-original replication, or live print automation.
- This is an old 2011-class machine. Power, thermal reliability, SSD wear, network, EFI/Linux USB boot, GPU/display initialization and uptime are **unverified**. Treat as a pilot/bridge and maintain a documented replacement/migration path.
- Historical Windows 7 print machine and original customer work remain untouched at `D:\print\الشغل\10-2026\Tooday\10-10` (do not rename `Tooday`). Proposed shared root `D:\print\الشغل` still needs onsite review before scoped Windows file sharing. No copying customer originals onto the iMac.

## Verified vendor technical baseline, not an installation certificate
- Apple 21.5-inch Mid 2011 tech specs: quad-core Intel Core i5 variants, 1333 MHz DDR3 memory with original Apple configuration up to 16 GB, built-in 10/100/1000BASE-T Ethernet, four USB 2.0 sockets. These specs broadly fit iMac12,1 but processor/GPU/disk modifications on the owner's individual unit need onsite inspection. https://support.apple.com/en-eg/111983
- Ubuntu Server 24.04 LTS amd64 lists suggested >=3 GB RAM and >=25 GB storage; 8 GB and 128 GB exceed those minima, but **hardware-specific EFI/graphics/driver boot compatibility has NOT been established**. https://ubuntu.com/server/docs/reference/installation/system-requirements/
- NetBird officially supports Linux CLI and tested Ubuntu 24.04; modern private routing gateway may be possible if actual Linux kernel network interfaces, forwarding, policies and Ethernet work. Do NOT enable broad all-LAN routes or expose TCP 445 WAN. https://docs.netbird.io/help/support-matrix/netbird-client/linux and https://docs.netbird.io/manage/networks/how-routing-peers-work

## Phase plan (human owner onsite, ChatGPT prepares guidance/source/scripts)
1. **First owner-only question:** Is the iMac currently in **the printshop** or at **home**? For shop-to-home gateway it must reside inside the printshop, powered and cabled to the same private LAN. Do not assume device is connected.
2. Document existing iMac macOS/Linux state, any personal files and recovery requirements. **Back up all important existing iMac data before any partitioning, USB installation or OS replacement.** Explicit approval for a destructive OS install is required separately; not implied by selecting hardware.
3. Run nondestructive hardware diagnosis: actual iMac model, CPU/RAM/SSD health (SMART), fans/heat, long-run stability, wired Ethernet gigabit, restart after power failure, USB/EFI boot/graphics compatibility. Use a verified Ubuntu 24.04 live test environment without writing the internal SSD. New OS choice could be revised if this 2011 hardware fails a compatibility check.
4. After consent and clean preflight, install a supported headless Linux server (candidate Ubuntu Server 24.04 LTS) with automatic **security** updates and recovery access; scoped VPN routing peer, nftables firewall only to approved Win7 IP TCP445, no SMB1, secrets outside repo; verify startup and monitoring and controlled remote recovery. Do not open SSH/VPN management or SMB to public internet by default.
5. Existing 128 GB SSD stores **OS, binaries, small service DB/cache, manifests and logs with size caps**. Never assume space for customer media; originals remain solely on Win7 until a separate controlled migration, immutable backup and staff go/no-go. An off-device backup plan is essential; no SSD is a backup.
6. Future growth: RAM up to 16 GB per Apple configurations (verify installed slot layout/compatibility before purchase), SSD 512 GB–1 TB only if actually necessary and compatible. If onsite tests show power, heat or disk failure, reject this iMac as 24/7 production authority and reconsider modern low-power device.
7. Retain AP-127/128 print workflow: DESIGN_NEW needs current approved exact proof/final revision before printing; collages/print-ready follow staff approval rules without an extra customer proof by default. Any future TrendOS local agent must be separately authenticated, per-order authorized, auditable, fail-closed and tested offline before activation.
8. HOME Win10 Enterprise 2016 LTSB v1607 build 14393.0 is still unqualified for privileged customer file access. Confirm security patch/ESU or use a modern supported endpoint before live remote transfers.

## Boundaries and safety contract
- `core/imac-local-server-pilot-v1.mjs` is pure SOURCE-ONLY eligibility planning, with owner-asserted inputs. It does not discover devices or attest hardware and **never authorizes installation, production, cloud writes, file transfer or machine dispatch**.
- `tests/ap134_imac_server_pilot_v1.test.mjs` covers exact model/8GB/128GB acceptance for lightweight services only, actual shop-location unknown, non-destructive backup/boot/health, insecure home and consent holds, plus zero-real-I/O flags.
- Do not erase SSD, deploy Linux, change Windows 7/production/D1 or read customer originals as part of AP-134 source work.

Status: AP134_IMAC12_1_OWNER_REPORTED=YES; AP134_RESOURCE_PROFILE=8GB_128GB; AP134_SHOP_LOCATION=UNKNOWN; AP134_LINUX_BOOT=NOT_TESTED; AP134_DISK_BACKUP=NOT_VERIFIED; AP134_HOME_SECURITY=NOT_VERIFIED; AP134_LIVE_REMOTE_ACCESS=NO; AP134_PRODUCTION=NO.
