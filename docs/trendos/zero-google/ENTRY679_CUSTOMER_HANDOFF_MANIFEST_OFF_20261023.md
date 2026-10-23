# Entry679 — Comprehensive draft manifest inventory (read-only, OFF)

**Purpose:** Prepare full customer draft item + private file metadata inventory, *without* claiming T12 can currently submit it or any live customer deployment.

- Bounded: exactly 1..50 ordered draft items, contiguous ordinals, each existing item ID unique; 0..250 private R2 file records, each READY with allowed type, SHA metadata, byte bounds, exact owner, exact item and deterministic private key. Reject pending/invalid/duplicate files, >5 per item, out-of-order or bad line flags.
- Customer login/ownership control is reused from original Entry667 SQL, reusing exact native session MAC and active D1 account controls. Does not weaken existing single-line/no-attachment preflight or expose customer data in a route.
- The result is **diagnostic read-only** only: SHA256 *observed metadata digest* of identity, items and file keys is returned internally, **not** file-body verification, not an authentication proof, not a D1 atomic seal, not immutable, not a T12 single-writer handoff. This digest MUST NOT be exposed through a public route before independent authorization/policy.
- Files remain private R2 objects; no bucket reads/writes/deletion. No order, finance, Printshop, Google, Google proxy or second writer. No Worker import/HTTP route. Entirely fake tests + D1-compatible disposable SQLite.
- Final release requirements: atomic/transactional snapshot seal + authenticated service actor + existing T12 idempotent ledger replay, batch of 1..50 items with complete attachment mapping, lost-ACK audit/reconcile, malware scanning and historical 25MiB policy parity, separate Cloudflare stage and rollback authority.
- `ENTRY679=SOURCE_ONLY_OFF`, `CUSTOMER_SUBMIT=NO_GO`, `ZERO_GOOGLE_RETIREMENT=0/9_VERIFIED`, `DEPLOY=NO`.


## Entry680 — D1 transactional read snapshot (source only)

- تم تصحيح فجوة `owner → items → files` متعددة الرحلات في Entry679: يستخدم جرد العميل الآن `D1Database.batch([owner SELECT, item SELECT, file SELECT])` **مرة واحدة** وفق توثيق Cloudflare الرسمي الذي يضمن تنفيذ الـbatch كتسلسل داخل معاملة. تظل كل الاستعلامات `SELECT` فقط، وأي فشل جزئي أو ترتيب غير متوقع أو عدم دعم `batch` يجعل الوظيفة ترفض بوضوح دون fallback متعدد القراءات.
- تُرجع الوحدة `transactionalReadBatch=true` بعد نجاح قراءات المعاملة، مع `snapshotSealed=false` و`atomicConsistencyVerified=false` لأن المعاملة قارئة ولا تمنع تعديل المسودة **بعد** خروجها، ولا تثبت R2 bytes أو تنشئ أمرًا رسميًا.
- Node fake adapter يمنع استخدام `.first/.all` المنفصلتين ويختبر رَدّ الـbatch الناقص وفشل الاستعلام؛ Python SQLite تستخدم 3 SELECT داخل SAVEPOINT حقيقي على جدول العملاء والبنود والمرفقات الأصلي، وتثبت ثبات النتائج من القراءة حتى التأكيد اللاحق في معاملة منفصلة، دون لمس الإنتاج.
- لا يوجد Worker import ولا Route أو D1 migration أو R2 mutation أو T12 writer جديد؛ هذا تحسين بنية PREPARE فقط. لازم لاحقًا durable snapshot seal / CAS + trusted actor + canonical T12 full items and files handoff before `GO`.
