// SELECT results arrive via stdin; emit counts only, never identities or rows.
import { readFileSync } from 'node:fs';
import { mapMirrorRows } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import { applyLegacyRuntimeOverlay } from '../cloudflare-d1/src/t12-legacy-line-runtime.mjs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const mapped = mapMirrorRows(input.headers, input.rows.map(row => ({
  rowNumber: row.rowNumber, values: JSON.parse(row.valuesJson), display: JSON.parse(row.displayJson)
})), 'service');
const effective = applyLegacyRuntimeOverlay(mapped, input.runtime);
const closed = new Set(['تم التسليم', 'ملغى', 'ملغي', 'مكرر']);
const groups = new Map();
for (const row of effective) {
  const key = String(row.orderId) + '\u0000' + String(row.lineId);
  const values = groups.get(key) || [];
  values.push(row); groups.set(key, values);
}
const counts = { totalLines: effective.length, readyLines: 0, deliveredLines: 0,
  duplicateLines: 0, cancelledLines: 0, otherOpenLines: 0, pressDepartmentLines: 0,
  openPressDepartmentLines: 0, duplicateIdentityGroups: 0, mixedStatusIdentityGroups: 0,
  mixedDepartmentIdentityGroups: 0, openAmbiguousIdentityGroups: 0 };
for (const row of effective) {
  const status = String(row.status || '').trim();
  if (status === 'جاهز للاستلام') counts.readyLines++;
  else if (status === 'تم التسليم') counts.deliveredLines++;
  else if (status === 'مكرر') counts.duplicateLines++;
  else if (status === 'ملغى' || status === 'ملغي') counts.cancelledLines++;
  else if (!closed.has(status)) counts.otherOpenLines++;
  if (row.department === 'مكبس') {
    counts.pressDepartmentLines++;
    if (!closed.has(status)) counts.openPressDepartmentLines++;
  }
}
for (const rows of groups.values()) {
  if (rows.length < 2) continue;
  counts.duplicateIdentityGroups++;
  if (new Set(rows.map(x => x.status)).size > 1) counts.mixedStatusIdentityGroups++;
  if (new Set(rows.map(x => x.department)).size > 1) counts.mixedDepartmentIdentityGroups++;
  if (rows.some(x => !closed.has(String(x.status || '').trim()))) counts.openAmbiguousIdentityGroups++;
}
console.log(JSON.stringify(counts));
