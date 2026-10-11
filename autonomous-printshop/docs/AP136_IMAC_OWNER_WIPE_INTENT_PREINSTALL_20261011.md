# AP-136 — Owner elected full iMac wipe, with no backup requested (2026-10-11)

**SOURCE ONLY / no format, no installed Linux, no physical changes performed.**
Inherited AP-135 recorded iMac12,1, 8GB RAM and 128GB SSD is AT HOME, printshop has legacy Windows 7.
Owner previously said "هنعمل فورمات" and now says there is **nothing important on iMac**, explicitly declining a backup. Record this as an OWNER DECLARATION, **not a physically verified empty disk**.

## What this permits and what it does NOT
- Preparing installation media and continuing guided install planning is approved; owner accepts risk that **ALL contents of selected 128GB iMac disk will be permanently lost upon future formatting**.
- Data backup is waived **for this owner's iMac only**; keep any previous AP-135 assumption "backup unknown" as a historical point.
- This message does **not** authorize erasing any other disk, USB containing important data, shop Windows 7 customer files, new production deployments, D1 writes or automatic printer control.
- Independently inspect target disk model/capacity/OS during the actual install to avoid wiping a different disk. At the installer destructive step, obtain an explicit final go-ahead tied to the visible disk.

## Next single owner action
**Do you have an expendable USB memory stick 8GB or larger?**
It will be **fully erased** when writing Ubuntu installer. Nothing will be written to the iMac internal SSD during this step. If no USB, obtain one; no Linux knowledge needed.

## Later, only after USB confirmed
1. Source boot image from official Ubuntu website. For iMac 2011 (Intel x86_64), prefer **Ubuntu Desktop 24.04 LTS amd64 live/try** for testing compatibility, without installing; server installation is separate, and GUI environment on USB is for diagnosis only. Keep Ubuntu Server 24.04 LTS as a *candidate* pending GPU/EFI/LAN testing; do not assert flawless compatibility.
2. Verify ISO checksum with official SHA256SUMS and make the bootable media using vendor-documented method; write only to the selected USB. Ubuntu official media guide https://ubuntu.com/desktop/docs/en/24.04/how-to/create-a-bootable-usb-stick/ warns USB contents erased.
3. Test USB boot on iMac in **Try Ubuntu** mode (NOT Install/Erase Disk), evaluate ethernet, SSD health/temperatures, startup stability, safe recovery plan. Failure means pause; do not force disk erasure.
4. Only after test succeeds, document actual internal disk identity and size, installer scope and user approval at destructive confirmation, then support a separate supervised installation. No unattended wipe script.
5. Future placement: shut down after setup, pad/transport to printshop; cable ethernet to shop router; maintain modern Linux gateway/firewall policy **ONLY** to authorized Win7 LAN IP/TCP445 and scoped share. Originals remain on shop Win7 at D:\print\الشغل\10-2026\Tooday\10-10 until distinct migration approval. Win7 drivers and employee workflow remain untouched.
6. Home Windows 10 Enterprise 2016 LTSB 1607 client is not qualified secure, independently check patch/ESU/replacement before customer file access.
7. No public SMB/RDP/FTP, no old VPN on Win7, no customer photo copies, no Production or Cloudflare D1 writes.

Pure AP-136 source function records the explicit data disposition and layered safety gates. Tests are synthetic and not proof of hardware compatibility.
