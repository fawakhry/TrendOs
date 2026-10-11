# AP-133 — Printshop router model discovery (2026-10-11)

**State: SOURCE_ONLY. Router model, hardware version, current firmware and VPN capability are NOT KNOWN.** Owner confirms NO second always-on Windows/Linux PC at the shop. Source baseline: AP-132 book commit ce7731e1b8644f4a778e93114ec2fbd2dd1e937a, CI 38084685726 SUCCESS.

## One owner action now

Look at the **physical router inside the printshop**. Reply with the **manufacturer and exact Model / Model No. on the sticker**. Do not send or photograph the Wi-Fi/admin password, SSID QR code, serial, MAC, WPS PIN, IP address, credentials or customer data. A tightly cropped sticker photo showing manufacturer and Model only is acceptable. No router login/configuration yet.

## Model-specific qualification AFTER owner identifies it

1. Use vendor official manuals for the **exact model/hardware revision/region**. Verify current security firmware and built-in WireGuard VPN *server*, not mere VPN passthrough, PPTP or marketing about another model.
2. Check whether the router can restrict an authenticated remote VPN peer to ONLY the Win7 shop host LAN address, **TCP 445**. Consumer routers that expose the entire LAN are NOT automatically eligible. No WAN SMB/RDP/FTP, SMB1, UPnP forwarding to Win7, guest/Everyone, or third-party firmware flashing.
3. Check WAN inbound reachability/CGNAT without disclosing address. A native VPN server may not be accessible behind CGNAT. For unsupported hardware/inbound cases consider a supported Linux gateway device with outbound overlay or a maintained compatible router; do not claim free hardware.
4. Windows 7 is legacy and stays LAN-only. Onsite share-root audit must approve intended content of D:\print\الشغل, confirm existing D:\print\الشغل\10-2026\Tooday\10-10 and ديجتال/فوتو child directories, then (with permission) scoped dedicated nonadmin NTFS+share ACL and SMB2+. Never rename Tooday, overwrite jobs, or modify print drivers.
5. HOME Windows 10 Enterprise 2016 LTSB 1607 build 14393.0 is not qualified: security updates end **2026-10-13** per Microsoft, installed updates unknown, ESU may require eligibility and licensing. Qualify supported patched secure remote device before customer-file access.
6. Only after explicit approval to configure: authenticate VPN from outside shop, deny unauthorized peers, synthetic read + unique-filename upload, SHA256 compare, verify no overwrite, maintain independent backup, then separate order-file-linking in TrendOS. AP-127/128 customer design approval vs ordinary print-ready rules remain unchanged.

## Source contract and guardrails

- core/printshop-router-model-gate-v1.mjs: requires confirmed Win7 plus no spare modern PC, then exact label, independent vendor-capability checks, firmware/WireGuard, CGNAT, router per-host ACL, shop SMB2/ACL, secure home endpoint and explicit owner approval. Return always declares ALL network/file/production permissions and physical verification FALSE.
- tests/ap133_router_model_gate_v1.test.mjs: synthetic unknown and generic model cases, malicious getters/private data redaction, unsupported VPN, firmware, CGNAT, per-host policy, SMB, home, user approval, and literal Tooday/فوتو preservation.
- GitHub CI source-only, no router or customer access, no Production merge, no D1 change.

## References

- https://docs.netbird.io/help/support-matrix/netbird-client/windows
- https://learn.microsoft.com/en-us/windows/release-health/supported-versions-windows-client
- https://learn.microsoft.com/en-us/windows/whats-new/ltsc/enable-extended-security-updates-windows-10-ltsb-2016
- Router maker's exact manual: TO BE SELECTED AFTER EXACT MODEL.

**Stop:** AP133_SHOP_SECOND_GATEWAY=NO; AP133_ROUTER_MODEL=UNKNOWN; AP133_WIREGUARD_AND_FIRMWARE=NOT_PROVEN; AP133_HOME_ENDPOINT=NOT_QUALIFIED; AP133_REMOTE_FILE_ACCESS=NOT_CONNECTED; AP133_PRODUCTION_DEPLOY=NO.
