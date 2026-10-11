# AP-138 — Ubuntu Desktop installer reports Installation complete; first internal SSD boot STILL PENDING

Date 2026-10-12. Evidence: a new owner-supplied photograph (reviewed in chat, **not checked into GitHub**) of the official Ubuntu installer completion screen, with the text:

> Installation complete
>
> Ubuntu 24.04.5 LTS is installed and ready to use
>
> Restart to complete the installation or continue testing. Any changes you make will not be saved.

The screen visibly offered **Continue testing** and **Restart now**.

## What has newly been confirmed
- At AP-137 the owner reached Ready to install with chosen internal **HS-SSD-C100 120G**, Linux installer device **sda**, "Erase disk and install Ubuntu," proposed EFI FAT32 /boot/efi and ext4 /, disk encryption **None**. The new photo indicates the **Ubuntu 24.04.5 Desktop installer's workflow completed successfully** after that screen.
- Previously recorded user-entered settings: visible display name **Trend Mall**, requested machine name **TrendosShop**, username **trend-main**, password masked and **NOT recorded**, password-required login checked.
- The physical machine is the owner-reported iMac12,1, 8GB RAM, at HOME, with actual nominal **120GB internal SSD** and boot USB **31GB**. No network cable is yet available; no wired network test, updates, modern VPN, production print workflow or TrendOS local service.
- Owner previously explicitly declined backup and accepted loss of existing iMac data upon erasure. **Installer completion strongly supports that it wrote Ubuntu to the chosen SSD, but there is no independent verification of partition write, operating system boot or persistent storage until reboot succeeds**. Do not claim the new Ubuntu system has successfully started from the SSD yet.
- The installer remains in the USB live session until **Restart now**; "Continue testing" changes in the live session are not persistent.

## Next human action, one step at a time
1. Owner presses **Restart now** on the installed-complete screen.
2. If prompted "Please remove the installation medium, then press Enter", safely remove the **Ubuntu USB** and press Enter.
3. Confirm actual startup *with USB removed* from the iMac internal SSD, login with locally retained account **trend-main**, then photograph only non-secret login/desktop (no password).
4. If boot falls back to USB or fails, diagnose boot rather than repeat format/reinstall by default.
5. Only later with wired LAN: test links/Internet, security patches, SMART extended health, thermals/reliability and SSD free space; acknowledge no full-disk encryption selected. Install/secure gateway/NetBird via separate owner-approved changes, deny WAN SMB, scope access to one Win7 host TCP445 and work share after root/ACL inspection, no production automation.

## Security/operational guardrails
- Never request Ubuntu account password, install tokens, Wi-Fi secrets, customer files or machine serials in chat/GitHub.
- Leave Win7 shop host, original files D:\print\الشغل\10-2026\Tooday\10-10, staff proof approvals and printers unchanged.
- No D1 writes, no production deploy/merge, no physical control through GitHub.
- GH Actions CI for this documentation branch is a repository integrity check ONLY, not independent hardware proof.

AP138_UBUNTU_INSTALLER_COMPLETION_SCREEN=OWNER_PHOTO_CONFIRMED
AP138_UBUNTU_VERSION=24.04.5_LTS_DESKTOP
AP138_INSTALL_TARGET=HS-SSD-C100_120G_sda_SELECTED
AP138_INSTALLER_COMPLETED=YES_PHOTO
AP138_USB_LIVE_SESSION_STILL_OPEN_AT_SCREENSHOT=YES
AP138_RESTART_CLICK=NOT_REPORTED
AP138_USB_REMOVED=NOT_REPORTED
AP138_INTERNAL_SSD_BOOT=NOT_VERIFIED
AP138_NETWORK_CABLE=NOT_AVAILABLE_AT_LAST_REPORT
AP138_TRENDOS_GATEWAY=NOT_CONFIGURED
AP138_SHOP_WIN7_OR_CUSTOMER_FILES=NOT_TOUCHED
AP138_PRODUCTION_OR_D1=NO_CHANGES
