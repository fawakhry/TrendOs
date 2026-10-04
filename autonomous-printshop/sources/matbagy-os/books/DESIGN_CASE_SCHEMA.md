# Design Case Schema — صندوق مطبعجي

> **Canonical schema for all extracted design conversations.**

كل Design Case تستخدم نفس البناء حتى تصبح الذاكرة قابلة للبحث والاستدعاء والتعلم.

## Identity

- `tenant_id`: إلزامي في Platform writes. `TENANT_001` = مطبعجي الحالي.
- `branch_id`: اختياري حسب الفرع التشغيلي للمطبعة.
- `case_id`: مثل `DESIGN-2026-000001`
- `case_status`: DRAFT | APPROVED_FOR_SAVE | SAVED | NOT_CONFIRMED
- `conversation_date`
- `extraction_date`
- `source`: CHATGPT_CHAT | OTHER_CHAT | MANUAL
- `source_reference`

## Customer / Order Context

- `customer_id`: إن كان معروفًا فقط
- `customer_name`: إن كان مسموحًا ومفيدًا
- `order_id`: إن وجد بوضوح، وإلا `UNKNOWN`
- `line_id`: اختياري
- `repeat_customer`: YES | NO | UNKNOWN

`case_id` ليس مفتاحًا عالميًا بمفرده في SaaS. الهوية التشغيلية الآمنة هي `tenant_id + case_id`. `order_id` رابط Business/Foreign Key فقط، وقد يرتبط Order ID واحد بأكثر من Design Case.

## Request

- `customer_request_raw`
- `request_summary`
- `product_type`
- `dimensions`
- `unit`
- `quantity`
- `required_text`

## Design Intent

- `layout_intent`
- `style_intent`
- `color_preferences`
- `font_preferences`
- `composition_notes`
- `print_or_cut_requirements`

## Constraints

### Must Keep
كل ما يجب الحفاظ عليه.

### Must Avoid
كل ما تم منعه أو رفضه.

## Assets

راجع `ASSET_LINKING_CONTRACT.md`.

لكل Asset:

- `tenant_id`: يجب أن يساوي Tenant الخاص بالـCase.
- `asset_id`: أثناء Draft مثل `DRAFT-A001`، وبعد الحفظ مثل `DESIGN-2026-000001-A001`
- `case_id`
- `order_id`
- `source_role`: customer_original | reference_design | generated_result | final_approved | unknown
- `conversation_position`
- `purpose`
- `instructions`
- `attempt_id`
- `derived_from_asset_id`
- `privacy_class`: PUBLIC_SAFE | CUSTOMER_PRIVATE | UNKNOWN
- `asset_binding_status`: LINKED | PENDING_UPLOAD | MISSING | REMOVED
- `storage_provider`: GOOGLE_DRIVE
- `drive_root_folder_id`
- `drive_year_folder_id`
- `drive_case_folder_id`
- `drive_file_id`
- `storage_ref`
- `file_name`
- `mime_type`
- `content_hash`: اختياري
- `linked_at`

### Google Drive الرسمي

Current canonical Project Root Folder ID for Tenant 001:
`1kP_JAO-ZOJltX9FCkAsylxYAfRar-RQV`

> الـRoot القديم `1qhoxC_c2MF3X_hhHcWiDo2SzW2ySCch_` غير Canonical ولا يجوز استخدامه في writes جديدة.

إذا الصورة معروفة من الشات لكن الملف نفسه لم يُرفع بعد:

- `asset_binding_status: PENDING_UPLOAD`
- `storage_provider: GOOGLE_DRIVE`
- `drive_file_id: PENDING`

لا تستخدم `LINKED` إلا بعد وجود Drive File ID حقيقي.

## Attempts Timeline

لكل محاولة:

- `attempt_id`: V1 / V2 / V3 ...
- `input_basis`
- `prompt_or_instruction_used`
- `result_description`
- `result_asset_id`
- `customer_feedback_raw`
- `feedback_class`: LIKED | PARTIAL | REJECTED | UNKNOWN
- `requested_changes`
- `what_worked`
- `what_failed`

## Approval

- `approval.status`: FINAL_APPROVED | EXPLICITLY_LIKED | PARTIAL_ACCEPTANCE | REJECTED | NOT_CONFIRMED
- `approval.final_attempt_id`
- `approval.final_asset_id`
- `approval.evidence`

## Learning

- `reusable_rules`
- `customer_preferences`
- `negative_preferences`
- `product_patterns`
- `search_tags`
- `confidence_notes`

## Truth Labels

- `EXPLICIT`
- `INFERRED`
- `UNKNOWN`

## Save Format

Legacy Tenant 001 path:
`CASES/YYYY/DESIGN-YYYY-NNNNNN.md`

Commercial SaaS target must be tenant-scoped, مثل:
`TENANTS/<tenant_id>/CASES/YYYY/DESIGN-YYYY-NNNNNN.md`

لا يتم نقل الملفات الفعلية للمسار الجديد قبل Migration موثقة، لكن أي Adapter تجاري جديد يجب ألا يفترض Tenant واحد.

يفضل YAML front matter يحتوي مثلًا:

```yaml
---
tenant_id: TENANT_001
branch_id: null
case_id: DESIGN-2026-000001
case_status: SAVED
order_id: UNKNOWN
approval_status: NOT_CONFIRMED
asset_count: 1
linked_asset_count: 0
pending_asset_count: 1
storage_provider: GOOGLE_DRIVE
drive_case_folder_id: PENDING
---
```

ثم تفاصيل Request، Timeline، Assets، Approval، Learning.

## تحديث الصور لاحقًا

- لا تغيّر `case_id`.
- لا تغيّر Asset IDs.
- لا تعيد استخراج الشات.
- ارفع الصورة إلى مجلد الـCase على Google Drive.
- حدّث `drive_file_id` و`storage_ref` و`asset_binding_status` و`linked_at` فقط مع الحفاظ على التاريخ.

## Learning Priority

1. FINAL_APPROVED
2. EXPLICITLY_LIKED
3. PARTIAL_ACCEPTANCE
4. REJECTED

لا تستخدم نتيجة مرفوضة كنموذج إيجابي.