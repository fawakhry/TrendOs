# AP-137 — Physical iMac Ubuntu trial / installer checkpoint (2026-10-12)

**Evidence source:** sequential owner-supplied *photographs inside the current conversation*, NOT automatic hardware telemetry. This file intentionally contains textual facts only, never the actual customer/home screenshots, storage serial numbers, MACs, IPs, login secrets, or password.

**STATE: READY-TO-INSTALL SCREEN VISIBLE. NO owner report yet confirming click on the final "Install" button, drive erasure, completed installer, disk boot, Linux updates, remote connection, or on-site relocation. Do NOT report Ubuntu installed.**

## Machine identity / owner intent
- Intended dedicated local TrendOS server: **Apple iMac Model Identifier iMac12,1**, approximate 2011 vintage; reported **8 GB RAM**. Owner reported "128 GB SSD" initially, but the live disk tool later established actual internal **120 GB nominal** SSD (manufacturer-marked 120G), model **HS-SSD-C100 120G**. In the observed Ubuntu Live session this device enumerated as **/dev/sda**. Hardware name and disk path must be re-verified on any later run; /dev/sda is not a fixed permanent identity.
- Physically **at owner HOME**; destination will be printshop after installation and safe powered-off transport. No alternative always-on computer currently inside shop, per prior owner statement.
- Owner explicitly declared no important existing iMac data, waived backup and requested full disk format. This is **owner's data disposition**, not independent examination of existing Windows files. Existing iMac Windows will be overwritten if the installer is actually committed.
- Shop Windows 7 x64 computer, original customer data, shop drivers and print workflow must remain unchanged. Example owner-reported actual workday path: D:\print\الشغل\10-2026\Tooday\10-10 (do not correct "Tooday"). Actual proposed share root has not been verified and no VPN exists.
- Goal is eventually a full TrendOS autonomous printshop local server, but initial plan is light services + secure private gateway, not full image originals/AI training on a 120 GB disk.

## Verified installation media and boot path — photographed
1. Owner downloaded **ubuntu-24.04.5.1-desktop-amd64.iso** (Desktop ISO, not Ubuntu Server installer). Rufus **4.15.2396** on Windows prepared a **32 GB nominal USB**; later Linux enumerated it as **31 GB Drive** (USB vendor generic label). Rufus visible settings: **GPT**, **UEFI (non CSM)**, FAT32, persistent partition size **0**, image selected, progress green **READY** after writing. Independent cryptographic ISO SHA256 verification not evidenced; media file name alone does not establish supply-chain integrity.
2. iMac actually reached **GNU GRUB 2.12** from USB, menu with "Try or Install Ubuntu" and "Ubuntu (safe graphics)". The owner selected first option and reached Ubuntu splash and welcome wizard.
3. Selected English, passed accessibility screen, chose **Do not connect to the internet**. Wizard displayed **No wired connection detected**. This was without a LAN cable (owner confirmed none available). **Ethernet hardware and actual Internet reachability NOT TESTED**; no inference of hardware failure.
4. Owner selected **Try Ubuntu** and supplied a live GNOME desktop photo (display rendered, GUI mouse cursor visible), confirming basic USB live boot/display/input; **not** a GPU acceleration, SSD endurance or reliable 24/7 operation test.
5. GNOME **Disks** screenshot: internal **120 GB** disk labeled **HS-SSD-C100 120G**, mapped **/dev/sda**, **GPT** partitions. Disks showed **"Disk is OK (30°C / 86°F)"**; informational assessment and temperature only, **not** a logged SMART extended test. Previous layout shows Windows Recovery NTFS **~472 MB**, FAT boot partition **~105 MB**, Microsoft reserved/unknown **~17 MB**, visible basic data NTFS **~73 GB** (and possibly other partitions beyond photo crop). The installer later identified **Windows Boot Manager**. USB 31 GB separate; Linux Live loop devices are virtual.
6. No format/delete was performed within the Disks application, based on observed screens.

## Ubuntu Desktop installer selections — photographed
7. From Live desktop launched **Install Ubuntu 24.04.5 LTS**; setup wizard English, interactive (NOT automated), no additional proprietary graphics/Wi-Fi/media codec packages selected; network remained offline.
8. On Disk setup, rejected "Install alongside Windows Boot Manager", selected **"Erase disk and install Ubuntu"**, not Manual. Chose guided default options, not customized disk partitioning.
9. Account wizard user-entered:
   - Display name: **Trend Mall**.
   - Requested machine name: **TrendosShop** (exact UI spelling); actual postinstall hostname not independently established.
   - Requested login username: **trend-main** (EXACT from photo; do not conflate with former suggested trendadmin).
   - Installer indicated a **Strong password** and confirmed match, **Require my password to log in** checked; **password/secret NEVER captured in repo**. Installer strength assessment alone is not a security audit.
   - Active Directory not enabled.
10. LAST PHOTO: **Ready to install / Review your choices** page:
   - Disk setup: **Erase disk and install Ubuntu**.
   - Installation disk: **HS-SSD-C100 120G sda**. This matches the live session internal **120 GB SSD /dev/sda**, not the **31 GB USB**.
   - Applications: **Default selection**.
   - Disk encryption: **None** — at-rest data will *not* be full-disk encrypted in this installation profile. Record security limitation; consider threat model and physical security after actual install.
   - Proprietary software: **None**.
   - Proposed new partition **sda1 FAT32, /boot/efi** and **sda2 ext4, /**. These were **installer-proposed changes**, not yet proven applied.
   - The green **Install** button was visible; preceding assistant authorized user to press it after warnings. **The user has not confirmed that they pressed it; installation status remains UNCONFIRMED/NOT VERIFIED**.
   - Timezone "Cairo" was suggested; **no photo independently established final selected timezone**.

## Formal phase gates and next action
- **Before any further step:** Owner asked to **record all details, then chat**. Do not order immediate install, shutdown, USB removal, file migration, VPN setup, OS changes or transport merely to complete logging. Wait for their topic/request.
- Installation final selection is **destructive**: once actually pressed, it wipes owner-declared original Windows and contents of selected internal 120 GB disk; an easy rollback is unavailable. Prior owner accepted this data loss. Never wipe other disks, especially shop Win7 or 31 GB USB.
- Ubuntu GUI live boot qualified only **basic visual compatibility**, not stable internal SSD installation. Do not imply server production-ready; verify later after owner reports result: Linux boots from internal disk without USB, credentials are locally retained (do not ask for them), correct hostname, disk and health, graphics/network/power/thermals, software updates and modern security baseline.
- When the iMac reaches shop, require power/ventilation/LAN, modern Linux VPN routing (deny by default to exactly owner-approved Win7 IP TCP445), scoped SMB2+ share + ACL, secure *supported/patched* home endpoint, synthetic tests. Never public SMB/RDP, legacy NetBird on Win7, unapproved entire D: share, customer originals mirroring, AI-heavy workloads, auto print, live D1 writes or Production deploy.
- AP-127/128 exact final-proof approval for new custom designs and existing staff exceptions stay effective. No hardware integration or TrendOS local service has actually been deployed.

## Truthful status snapshot
AP137_OWNER_PHOTOS=REVIEWED_MANUALLY
AP137_IMAC_LOCATION=HOME_OWNER_CONFIRMED
AP137_RAM=8GB_OWNER_REPORTED
AP137_ACTUAL_SSD=HS-SSD-C100_120G_DEV_SDA_IN_LIVE_SESSION
AP137_USB_BOOT_AND_DESKTOP_TRY=PHOTOGRAPHICALLY_OBSERVED
AP137_USB_MEDIA_ISO_SHA256=NOT_INDEPENDENTLY_VERIFIED
AP137_NO_LAN_CABLE=OWNER_CONFIRMED
AP137_WIRED_NETWORK=NOT_TESTED
AP137_DISK_HEALTH=DISKS_OK_30C_ONLY_NO_EXTENDED_TEST
AP137_ACCOUNT_DISPLAY_NAME=TREND_MALL
AP137_HOSTNAME_REQUESTED=TrendosShop
AP137_LOGIN_USERNAME_REQUESTED=trend-main
AP137_LOGIN_PASSWORD=NOT_STORED
AP137_INSTALL_TARGET=HS-SSD-C100_120G_sda_OBSERVED_ON_READY_SCREEN
AP137_DISK_ENCRYPTION=NONE_SELECTED
AP137_INSTALL_CLICK=NOT_CONFIRMED
AP137_INTERNAL_SSD_ERASE=NOT_CONFIRMED
AP137_UBUNTU_INSTALLED=NOT_VERIFIED
AP137_PRINTERS_WIN7=UNTOUCHED
AP137_SHOP_LAN_VPN_SMB=NOT_CONNECTED
AP137_TRENDOS_LOCAL_AGENT=NOT_DEPLOYED
AP137_D1_OR_PRODUCTION_WRITES=0
