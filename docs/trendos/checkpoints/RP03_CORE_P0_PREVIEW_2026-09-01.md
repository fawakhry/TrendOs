# RP-03 CORE-P0 Production-Shaped Preview

> Date: **2026-09-01**  
> Mode: **READ-ONLY**  
> Production: Apps Script Version **145**, master+HEALTH ON only  
> Remediation source: `24b4e89a3d3866f8f95d28ec609a302ba908486e`  
> CI: `33491831765` — **SUCCESS**

## Safety boundary

No Google Sheet cell, Apps Script source, Script Property, trigger, deployment, route, or feature flag was changed. The proposed registry sheet `إدارة - معالجات السلامة V1` does not exist and was not created.

The workbook timezone is `America/Los_Angeles`; TrendOS business/runtime timezone is `Africa/Cairo`. Generic evidence hashes therefore use exact displayed Sheet values plus stable row identity. Invoice hashes use material draft state and exclude non-material update-time text.

## Read ranges

- `بنود الأوردرات!A1:CN242`
- `سجل الدوام!A1:T200`
- `تشغيل - النظافة اليومية!A1:V200`
- `حسابات - مسودات الفواتير!A1:X200`
- `واجهة المكبس!A1:R200`
- `تشغيل - جلسات المكبس!A1:AB200`

## 1. Order / Line adapter preview — PASS

| Check | Actual |
|---|---:|
| Data rows | 241 |
| Legacy Date/numeric Line IDs recovered | 229 / 229 |
| Invalid Line IDs | 0 |
| Active duplicate Line IDs | 0 |
| Order/Line mismatches | 0 |
| Legacy open Lines | 98 |
| Current-format open Lines | 4 |
| Total open Lines | 102 |

Open statuses:

| Status | Count |
|---|---:|
| `طلب جديد` | 38 |
| `جاهز للاستلام` | 57 |
| `تحت التنفيذ` | 7 |

Conclusion: the known-column raw+display adapter resolves every legacy open Line uniquely without rewriting the source cells.

## 2. Attendance historical groups — PASS preview

| Entity key | Rows | Canonical Session | Superseded Session(s) | Evidence hash |
|---|---|---|---|---|
| `جابر\|2026-08-31` | 28, 29 | `AT-20260831-جابر-98f40226` | `AT-20260831-جابر-36fed31c` | `5cfb0d17d26cedb5ed66b85619d2058e1823459fa0b54d5a7537dee4bc9d1050` |
| `ريفان\|2026-08-27` | 12, 13, 14 | `AT-20260827-ريفان-c90877a5` | `AT-20260827-ريفان-87248baa`, `AT-20260827-ريفان-83dd3162` | `b6e8539721dcb8fcba1d6f24f5f6736408e9022a18399156a5f80ebe2fb4409f` |
| `ريفان\|2026-08-29` | 21, 22 | `AT-20260829-ريفان-1f338175` | `AT-20260829-ريفان-89ef1c58` | `99c1c04cfb75a07b554e10d0d7cfce122773f4758846183558fa896719d560b6` |
| `ريفان\|2026-08-30` | 24, 25 | `AT-20260830-ريفان-ea4e5707` | `AT-20260830-ريفان-bcc4c8ce` | `57db9d60a97058dc08e2b0620c70cc74b7ec28967404ec3853c13f4c18ec6e10` |
| `وائل\|2026-08-29` | 18, 19 | `AT-20260829-وائل-5167c552` | `AT-20260829-وائل-467e27ab` | `03d7d68eeaa9006cdd364e9067f395eceb2c3814bcf53c9ea342c8f686120777` |

Groups: 5. Excess rows: 6.

## 3. Cleaning historical groups — PASS preview

| Entity key | Rows | Evidence hash |
|---|---|---|
| `جابر\|2026-08-24` | 3, 4, 5 | `480e8696d0415c096403eabd331f9884a37d6e44c769e1eeeec29760e984521f` |
| `جابر\|2026-08-25` | 10, 11 | `bb343ec2c3f76a04525bc7117ba781e3feb78395e9db402c5aa1ea84ac01cd75` |
| `جابر\|2026-08-27` | 19, 20 | `a208f9ea0d8b9f30d814c2ad9dbce5e25f53fc07726c7390a2eda24ea4f7521e` |
| `جابر\|2026-08-31` | 34, 35, 36 | `3829ef52492543895a46c1fe44aa1daa6afcc26ce75033ba337d2473c3708936` |
| `ريفان\|2026-08-25` | 8, 9 | `eb339aac6d2674ad8476f77cfaab426d3ecd3e08a01e8513af741c090791358c` |
| `ريفان\|2026-08-26` | 13, 14, 15, 16 | `e8edf15a6e3679237da130420fa7f4854a42810ec412fcd7ef790b9cd4856d14` |
| `ريفان\|2026-08-29` | 24, 25 | `f5667740201782248319f677814bd29941fda0d2caecf16ec9e360244d398266` |
| `ريفان\|2026-08-30` | 28, 29, 30 | `a614b1ec7eabd5af24923c934f9b97be87196d12b271745bb886aca216f15bf4` |
| `شريف\|2026-08-27` | 21, 22 | `6a6c19700c467ebb9beaa2c0371aaa8aaead7cb042bd3c9be4de2c013fd844fe` |
| `وائل\|2026-08-27` | 17, 18 | `03e0f3b719f949ec168e78a4a23a53f5ce9e42b1087193270b6996bdc82f57c7` |
| `وائل\|2026-08-30` | 31, 32 | `77d1107fe0ff056cf72804d56a207d701424a814b4d57fbdc4c0d45a4c0e1bbd` |

Groups: 11. Excess rows: 16.

## 4. Invoice canonical mappings — PASS preview

| Order | Source rows | Canonical Draft | Superseded Draft | Evidence hash |
|---|---|---|---|---|
| `3569` | 20, 21 | `DR-19c18636` | `DR-55d94661` | `06afbe9d9646aa151ce7f8c9bc6b1da57d4d0aafc5635784fed7c622de215023` |
| `3572` | 18, 19 | `DR-69e8cb63` | `DR-fe3c766a` | `d496b057f5843f87b2c32cee86d53016e14a170706325820fdf0eb759d1c19d2` |
| `3577` | 16, 17 | `DR-3466cb0d` | `DR-ceed6b65` | `d0913e2a85a73b2b391a2d2f04789f78d4b4b26412e9adeefe195c75297a3d77` |

Every protected row still has subtotal 0, status `يحتاج تسعير/اعتماد`, blocker `لا توجد بنود معتمدة بسعر بيع.`, and no Invoice Number, WhatsApp state, or Meta ID. Any drift must cancel the mapping.

## 5. Press preview — SCOPE CORRECTED / PLAN PARTIAL

Recovered source queue: 9 Lines.

- `3796-01`
- `3803-01`
- `3809-01`
- `3813-01`
- `3817-01`
- `TM2606150097-01`
- `TM2606150098-01`
- `TM2606150105-01`
- `TM2606160146-01`

`واجهة المكبس` has zero data rows. `تشغيل - جلسات المكبس` has one data row. The Line-session ledger `تشغيل - بنود جلسات المكبس V1` does not exist.

Completed-without-Line-session evidence: 14 Lines.

| Line ID | Source row | Evidence hash |
|---|---:|---|
| `3536-01` | 108 | `02ec63d746d1bda0f3d1505ac807c3e0baaeb3188c194ed0b5c24d8704796293` |
| `3585-02` | 96 | `d906acc860f8e45994ba102e0cc1bb72f2a3317be64cf19d14a76989116c462e` |
| `3628-01` | 124 | `f36248c431e6f9168117183b2614ee331148454238537eb5bb090e9a40f889f4` |
| `3669-01` | 140 | `114dfe7854f58d2e2e7189e9710fc1c633b6c21e82c0eacd00d8368701ea6c02` |
| `3756-01` | 175 | `adc3f9301511987db344f47250b457d0758fae98ef9a837d7f355477ae9b27b4` |
| `3758-01` | 178 | `1e02115a8fd0b85677e9a37e7be207bdb2bd9962e45204d005515316d1d456ee` |
| `3764-01` | 182 | `e8cd1fb469954d79b0a0c721f2662e0e18e34368e711bb4c2c81b6869576721c` |
| `3770-01` | 188 | `2cfc10ef93ed783ead009ca081446cad525c4796146880fc03e29be5785150c5` |
| `3774-01` | 192 | `649bd4c787469bed1f0d399bdaae90d447f7bc4710ebcf836f6dfba79e2841d9` |
| `3779-01` | 198 | `fe9113d092b3b08b7da1841c391da758171ebe32bb2a3e3f690e5ba59ac7963a` |
| `3788-01` | 207 | `f40677ba84dd6a798b2911244686ef05ea377226e69e87fe2cd2ed0ed810ddf6` |
| `TM2606140061-01` | 3 | `a1307eb5cad11cd39fdb0ad0305a681d840328f039a49e0273555078afff7459` |
| `TM2606160140-01` | 10 | `f25d77b63a029ae20c286f5f3290431b775ede52178fa783f2708b524022c65e` |
| `TM2606160181-01` | 13 | `f9de60d0a28f74686c49b12596f9136843b434a5e4135289c22433f2f91d7d05` |

This is not permission to invent Press session links or acknowledge the rows in production. The live Press consumer contract must be diagnosed read-only before choosing between view repair and explicit legacy-view WARN.

## Result

- Order/Line adapter: **PASS**
- Attendance evidence: **PASS**
- Cleaning evidence: **PASS**
- Invoice evidence: **PASS**
- Press evidence acquisition: **PASS**
- Earlier Press remediation scope: **PARTIAL / CORRECTED**
- Production impact: **READ-ONLY**
- Next: update the remediation plan to this exact scope, then diagnose the live Press consumer contract read-only.
