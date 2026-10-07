# TrendOS Print Server V0.2

Local Windows print-server bridge for TrendOS.

## Platform connection

Open the local UI and enter a normal TrendOS employee username/password in the **ربط المنصة** section.

- The password is used only for the login request and is not written to disk.
- The returned native employee session token remains in memory only.
- The bridge polls the existing read-only employee-core `getRows` action.
- The first successful sync is a baseline only: it does not create folders for historical rows.
- After baseline, a line entering `بدأ التنفيذ` or `تحت التنفيذ` creates/ensures its local order folder.
- The bridge performs no TrendOS business write.

The platform currently has no separate employee Claim action. Therefore V0.2 deliberately maps the existing human **start execution** status transition to the local folder-creation event rather than inventing a new claim authority.

## Folder rules

- Heat press / `مكبس = نعم` -> `طباعة/فوتو/سبلميشن/x`
- Photo print -> `طباعة/فوتو/طباعة/x`
- Tableaux -> `طباعة/فوتو/تابلوهات/x`
- Couche -> `طباعة/ديجتال/كوشيه/x`
- Sticker -> `طباعة/ديجتال/استيكر/x`
- Laser -> `ليزر/x`

Only routes actually needed by the observed line are created. Later lines for the same order merge into the same local order state instead of overwriting earlier routes.

## Safety boundary

This bridge does not:
- write order status;
- assign employees;
- activate Operator Task;
- write Design/Material/Machine READY;
- mutate Accounting;
- treat `x` as authoritative printed truth.

The local connection is a read bridge only.


## Cloudflare transport compatibility

The packaged client sends a browser-compatible User-Agent because the current Cloudflare zone rejects Python urllib's default browser signature with Error 1010 before the request reaches the Worker. No Cloudflare security rule is weakened by the client-side compatibility fix.
