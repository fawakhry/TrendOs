#!/usr/bin/env python3
from pathlib import Path
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
app = root / 'app.js'
index = root / 'index.html'

app_text = app.read_text(encoding='utf-8')
index_text = index.read_text(encoding='utf-8')

old_status_cell = '"<td class=\\"status-cell\\"><div class=\\"priority-pill\\">" + escapeHtml(r.priority || "-") + "</div>" + statusSelect(r.status) + "</td>" +'
new_status_cell = '"<td class=\\"status-cell\\">" + statusBadges(r) + statusSelect(r.status) + "</td>" +'

old_post_save = '      loadRows(true); // V1925: أظهر نجاح الحفظ فورًا ثم حدّث الجدول في الخلفية.\n      setTimeout(function () { btn.textContent = "حفظ"; }, 900);'
new_post_save = '      // 02CV UX: the authoritative write already succeeded. Re-render the local\n      // state immediately so hidden statuses disappear without waiting for another\n      // Apps Script page read. A later manual/qualified refresh remains authoritative.\n      applyFiltersAndRender(false);\n      setLoading("تم حفظ التعديل في الشيت.");\n      setTimeout(function () { btn.textContent = "حفظ"; }, 900);'

old_app_cache = 'app.js?v=trendos-02cu-resume-20260906a'
new_app_cache = 'app.js?v=trendos-02cv-statusux-20260906b'

checks = [
    ('status cell', old_status_cell, app_text.count(old_status_cell)),
    ('post-save reload', old_post_save, app_text.count(old_post_save)),
    ('app cache token', old_app_cache, index_text.count(old_app_cache)),
]
for name, _, count in checks:
    if count != 1:
        raise SystemExit(f'02CV patch refused: expected exactly one {name}, found {count}')

app_text = app_text.replace(old_status_cell, new_status_cell, 1)
app_text = app_text.replace(old_post_save, new_post_save, 1)
index_text = index_text.replace(old_app_cache, new_app_cache, 1)

if 'function statusBadges(r)' not in app_text or '⚡ طباعة على الطاير' not in app_text:
    raise SystemExit('02CV patch refused: fly-print badge renderer missing')
if 'loadRows(true); // V1925: أظهر نجاح الحفظ فورًا ثم حدّث الجدول في الخلفية.' in app_text:
    raise SystemExit('02CV patch refused: immediate post-save page read still present')

app.write_text(app_text, encoding='utf-8')
index.write_text(index_text, encoding='utf-8')
print('PERF_CF_02CV_ORDER_STATUS_UX_PATCH_APPLIED')
