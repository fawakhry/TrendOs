# Matbagy Google Drive Project Structure

**Date:** 2026-09-04  
**Status:** IMPLEMENTED / VERIFIED IN GOOGLE DRIVE

## User decision

اعتمد المستخدم أن My Drive يجب أن يحتوي على فولدر رئيسي واحد فقط للمشروع، وألا تنتشر مجلدات الـCases والـAssets في جذر Drive.

## Implemented project root

- name: `مشروع مطبعجي - Matbagy Project`
- folder_id: `1kP_JAO-ZOJltX9FCkAsylxYAfRar-RQV`
- url: `https://drive.google.com/drive/folders/1kP_JAO-ZOJltX9FCkAsylxYAfRar-RQV`
- parent: My Drive root

## Direct children created

- `01_Design_Cases`
  - folder_id: `1qhoxC_c2MF3X_hhHcWiDo2SzW2ySCch_`
- `02_Orders`
  - folder_id: `19vhyOha215dLr5_pxv8BdZy_-sq7LgDm`
- `03_Shared_Assets`
  - folder_id: `1cBMs21DKCuTPzcfmkj2UjgFfHdqQGVgl`
- `04_Archive`
  - folder_id: `1kke5hm_Bsq1Q_XHEuTpOkTTRkjpMEz5K`
- `05_System`
  - folder_id: `14amOaEUH4kGP4iFWTlMDfZ1c3c9edMH7`

## Migration method

لم يتم نسخ شجرة الصور القديمة إلى فولدر جديد.

الفولدر القديم:

`صندوق مطبعجي - الصور`

بـFolder ID:

`1qhoxC_c2MF3X_hhHcWiDo2SzW2ySCch_`

تم:
1. نقله من My Drive root إلى Project Root الجديد.
2. إعادة تسميته إلى `01_Design_Cases`.
3. الحفاظ على نفس Folder ID.

الهدف: عدم كسر Year/Case/File IDs أو إنشاء Duplicates.

## Canonical design case path

`My Drive/مشروع مطبعجي - Matbagy Project/01_Design_Cases/YYYY/<CASE_ID>/`

## Existing case migration verification

### DESIGN-2026-000001

- year_folder_id: `1AP68g1gP0S3fNNzgyOkithg3VfH4kEgE`
- year_folder_url: `https://drive.google.com/drive/folders/1AP68g1gP0S3fNNzgyOkithg3VfH4kEgE`
- case_folder_id: `1uA9k8SLnq0s21C4K79-SlkDE2U8qXQrj`
- case_folder_url: `https://drive.google.com/drive/folders/1uA9k8SLnq0s21C4K79-SlkDE2U8qXQrj`

Linked asset:

- asset_id: `DESIGN-2026-000001-A001`
- drive_file_id: `1srMthjL-cR0cdk7VOOkMZjrEmUCWwFS-`
- file_name: `DESIGN-2026-000001-A001.png`
- file_url: `https://drive.google.com/file/d/1srMthjL-cR0cdk7VOOkMZjrEmUCWwFS-/view`
- status: `LINKED`

Drive metadata verification confirmed the asset still has parent case folder `1uA9k8SLnq0s21C4K79-SlkDE2U8qXQrj` after the project-root migration.

## Matbagy memory updates

Canonical Matbagy repository was updated with:
- `صندوق_مطبعجي/STORAGE/GOOGLE_DRIVE_STRUCTURE.md`
- updated `صندوق_مطبعجي/SCHEMA/ASSET_LINKING_CONTRACT.md`
- updated `صندوق_مطبعجي/اقرأني_أولاً.md`
- updated `صندوق_مطبعجي.md`
- `ROOMS/2026/DESIGN-2026-000001/STORAGE.md`
- updated Case Room `STATUS.md`

## Operating rule

From this checkpoint onward:
- no Matbagy Case/Asset folder is created directly in My Drive root.
- Design cases go only under `01_Design_Cases/YYYY/<CASE_ID>/`.
- preserve Drive IDs when parent moves/renames are sufficient.
- GitHub stores metadata/links; customer assets stay in Drive.

## TrendOS boundary

This storage reorganization does not change TrendOS authoritative operational/financial write sources and does not affect Cloudflare or Apps Script production cutover state.
