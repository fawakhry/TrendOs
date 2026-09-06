from pathlib import Path
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
app_path = root / 'app.js'
index_path = root / 'index.html'
app = app_path.read_text(encoding='utf-8')
index = index_path.read_text(encoding='utf-8')

anchor = '''  function isFlyPrint(value) {\n    const v = text(value).trim().toLowerCase();\n    return v === "نعم" || v === "true" || v === "1" || v === "on" || v === "طباعة على الطاير" || v === "طباعة ع الطاير" || v === "على الطاير" || v === "ع الطاير";\n  }\n\n'''
helper = '''  function preserveFlyPrintAcrossMissingFields(previousRows, nextRows) {\n    const knownFlyByLineId = {};\n    (previousRows || []).forEach(function (row) {\n      const lineId = text(row && row.lineId).trim();\n      if (!lineId) return;\n      const fly = row && (row.flyPrint || row.quickPrint || row.fastPrint || row["طباعة على الطاير"] || row["طباعة ع الطاير"]);\n      if (isFlyPrint(fly)) knownFlyByLineId[lineId] = true;\n    });\n\n    return (nextRows || []).map(function (row) {\n      if (!row || typeof row !== "object") return row;\n      const hasExplicitFlyField = ["flyPrint", "quickPrint", "fastPrint", "طباعة على الطاير", "طباعة ع الطاير"].some(function (key) {\n        return Object.prototype.hasOwnProperty.call(row, key);\n      });\n      if (hasExplicitFlyField) return row;\n\n      const lineId = text(row.lineId).trim();\n      if (lineId && knownFlyByLineId[lineId]) {\n        row.flyPrint = "نعم";\n        row.quickPrint = "نعم";\n      }\n      return row;\n    });\n  }\n\n'''

if 'function preserveFlyPrintAcrossMissingFields(' not in app:
    if anchor not in app:
        raise SystemExit('isFlyPrint anchor not found')
    app = app.replace(anchor, anchor + helper, 1)

old = '      state.rows = Array.isArray(res.rows) ? res.rows : [];'
new = '      const nextRows = Array.isArray(res.rows) ? res.rows : [];\n      state.rows = preserveFlyPrintAcrossMissingFields(state.rows, nextRows);'
if new not in app:
    if old not in app:
        raise SystemExit('state.rows assignment anchor not found')
    app = app.replace(old, new, 1)

old_loader = '<script src="app.js?v=trendos-02cv-statusux-20260906b"></script>'
new_loader = '<script src="app.js?v=trendos-02cv-flylane-20260906c"></script>'
if new_loader not in index:
    if old_loader not in index:
        raise SystemExit('app.js cache-bust anchor not found')
    index = index.replace(old_loader, new_loader, 1)

app_path.write_text(app, encoding='utf-8')
index_path.write_text(index, encoding='utf-8')
print('PERF_CF_02CV_FLYPRINT_LANE_STABILITY_PATCH_APPLIED')
