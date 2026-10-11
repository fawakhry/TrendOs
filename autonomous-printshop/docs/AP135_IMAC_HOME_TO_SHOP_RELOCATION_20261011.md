# AP-135 — Move existing iMac12,1 from HOME to PRINTSHOP safely (2026-10-11)

**SOURCE-ONLY MOVE AND PREFLIGHT PLAN. No Linux install, physical device changes, LAN link, SMB, VPN, customer-file access or Production deployment performed.**

## Newly owner-confirmed physical location
- Existing iMac12,1 with **8 GB RAM and 128 GB SSD is currently AT HOME**, not within shop LAN. AP-134 status `PHYSICAL_LOCATION=UNKNOWN` is superseded **only for this location fact**.
- AP-135 plans to physically relocate this iMac into printshop as an eventual local TrendOS server/gateway. It **cannot route to shop Windows 7 while remaining at home** without separate approved architecture; no such tunnel is claimed.
- Former AP-133 statement "no other shop PC" is consistent: this iMac is not yet at shop.
- Exact owner-reported shop work leaf stays `D:\print\الشغل\10-2026\Tooday\10-10`; proposed common root `D:\print\الشغل` and actual `ديجتال`/`فوتو` placement need onsite validation. Never rename `Tooday`, mirror originals or change drivers/OS of Win7.

## Stage H — First: nondestructive HOME preflight, one owner action at a time
1. **IMMEDIATE SINGLE OWNER ACTION:** While iMac is still at home, **switch it on and check whether it has any important photos, documents or business files to retain**. Reply just **YES / NO / NOT SURE**; never send sensitive files, passwords or customer images. Until answered, do not erase disks, make USB installer modifications or transport an operating machine. If unsure, treat data as important.
2. If there are important files, copy them to **a separate external disk or trusted backup location** and verify several saved files can be reopened. A backup on the **same 128 GB SSD is not a backup**. Also identify installed macOS / disk encryption/access and any licensed applications that would be lost; no credentials in chat. If no important files, still verify owner can boot/login and retain recovery options. Explicit erase consent remains a later gate even if "NO".
3. Check iMac can boot, screen shows correctly, keyboard/mouse work, power connector is good, fan noise and temperatures are not obviously abnormal. The actual SSD health, battery/thermal, GPU and Ethernet compatibility cannot be verified from a GitHub CI run. Do not run disk repair/firmware flashing or OS migration as a shortcut.
4. Before transport, shut down completely (Apple menu > Shut Down). Wait for it to power off, unplug mains and disconnect cables. **Do not move while powered**. Protect screen/glass/corners with padded packaging, keep cables separate, carry by supported chassis not screen/glass. The 2011 iMac includes a large attached display; take care of fragility.

## Stage S — Physical arrival + NONDESTRUCTIVE onsite checks (NOT DONE)
5. Put iMac in a dry, ventilated location where staff won't block exhaust. It needs stable electricity (UPS recommended, capacity must be assessed), a suitable LAN cable and an available port on the shop switch/router. Do not interfere with active printers, move Win7 storage, or unplug unknown business devices.
6. On arrival verify power-on and wired LAN status **on the iMac only**. Do not configure the router firewall, Windows shares or ports before separate approval. Record simple "Ethernet connected / not connected" only, not credentials, customer filenames or public IPs.
7. To prove Linux compatibility, prepare an Ubuntu Desktop **Try Ubuntu** USB using official instructions, with a **separate, expendable USB stick** (creating the bootable USB **erases that USB**, not the iMac SSD). Choose Try Ubuntu, **never Install/Erase Disk**. Intel Apple EFI typically offers boot selection using Option/Alt at power-on; the exact iMac12,1 boot behavior, GPU and LAN support require a real test. A Server ISO installer is not the same as a "Try" desktop session. If boot fails, investigate and keep existing system intact; do not infer incompatibility of all Linux versions.
8. Non-destructively review SSD SMART/health, fan/thermal stability, startup power-recovery behavior, Ethernet and whether a secure remote recovery strategy exists. If aging hardware is unreliable, do not assign it uninterrupted 24/7 print authority.

## Stage A — After preflight (separate explicit approval required)
9. Draft a **disk layout and rollback plan**, off-device backup/restore, and installer procedure before asking owner to approve Linux installation. No permission to erase internal SSD is inferred by selecting this iMac or by successful CI. Prefer supported Ubuntu Server/LTS or compatible Linux only after actual USB boot. Configure a modern NetBird Linux routing peer after supported client/network compatibility verified.
10. Make only an authenticated, deny-by-default private resource policy: NetBird **Networks**, a resource for the *single approved Win7 local IP*, only **TCP 445**, and local forwarding firewall restrictions. Legacy NetBird **Routes** without access-control groups can default-allow: do not use them unqualified. Never enable WAN SMB/RDP, SMB1, Guest/Everyone share, whole-drive sharing, broad LAN visibility or customer-file mirroring.
11. Shop Win7 remains authoritative for customer originals; verify permitted share root, owner non-admin account and **both share+NTFS ACL** onsite before any private read test. Then owner verifies dummy download / distinct-named upload and SHA256 parity from a **supported, patched remote endpoint**. HOME Windows 10 Enterprise 2016 LTSB v1607 build 14393.0 patch/support eligibility is still unresolved. Cloudflare Production/D1 and machine print dispatch remain OFF pending separate gates and explicit consent.
12. Later local TrendOS file manifest/order linking: metadata identifiers/hashes, proof/artwork exact revision/approval and manual transfer logs; originals stay at shop. AP-127/AP-128 require customer approval for custom design final revision, while print-ready/collage keeps existing exceptions.

## Source-only regression gate
- `core/imac-home-to-shop-relocation-v1.mjs`: models confirmed start HOME, first existing-data question, backup hold for important files, shutdown, padded transport, destination power+LAN, arrival report, non-destructive Try Ubuntu test, health/power checks, and no implicit installation authorization. Caller claims **never** prove a physical action.
- `tests/ap135_imac_home_to_shop_relocation_v1.test.mjs`: synthetic fail-closed checks and hostile getters; invariants forbid disk erasure, deployment, copying originals or modifications to Win7, even if checklist reported complete.
- AP-134 source check continues to hold while owner reports device at HOME.

## External documentation
- Apple Mid 2011 21.5 inch technical specifications: https://support.apple.com/en-eg/111983
- Official Ubuntu Desktop Try (non-installing preview) and Option/Alt on Intel Macs: https://ubuntu.com/desktop/docs/en/latest/tutorial/try-ubuntu-desktop/
- NetBird routing-peer Networks policy default-deny and legacy Routes default-allow caveat: https://docs.netbird.io/manage/networks/how-routing-peers-work
- Ubuntu Server hardware requirements / future alternative: https://ubuntu.com/server/docs/reference/installation/system-requirements/

**Current status:** `AP135_IMAC_CURRENT_LOCATION=HOME_OWNER_CONFIRMED`; `AP135_IMPORTANT_DATA=UNKNOWN`; `AP135_EXISTING_FILES_BACKUP=NOT_VERIFIED`; `AP135_PHYSICAL_MOVE=NOT_DONE`; `AP135_LIVE_USB=NOT_TESTED`; `AP135_LINUX_INSTALL=NO`; `AP135_WIN7_FILES=UNCHANGED`; `AP135_REAL_VPN_SMB=NOT_CONFIGURED`; `AP135_D1_WRITES=0`; `AP135_PRODUCTION_DEPLOY=NO`.
