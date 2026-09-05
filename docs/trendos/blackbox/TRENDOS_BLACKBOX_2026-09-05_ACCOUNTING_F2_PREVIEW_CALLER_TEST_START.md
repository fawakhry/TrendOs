# TrendOS Accounting F2 — Preview caller regression START

Date: 2026-09-05

Material implementation `accounting/preview-persistence-caller-v1.js` completed after its pre-step record.

Before further mutation, record the next material step: add regression coverage proving:
- default ZERO_WRITE does not call D1 batch;
- production remains ZERO_WRITE even with capability/opt-in/DB;
- exact preview gate delegates a valid transaction plan to D1 commit;
- invalid/incomplete plans fail before persistence.

No production binding, migration or remote D1 write is authorized by this step.