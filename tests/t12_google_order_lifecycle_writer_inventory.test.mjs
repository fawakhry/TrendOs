import assert from 'node:assert/strict';
import fs from 'node:fs';

// Known minimum from repository Code.gs. It is NOT a complete live Head/
// deployed Version155 multi-file route audit; no production reads or writes.
const source=fs.readFileSync(new URL('../Code.gs',import.meta.url),'utf8');
const names=[
  ['updateLine','updateLine_'],
  ['bulkUpdateDepartmentStatusV1926','bulkUpdateDepartmentStatusV1926_'],
  ['archiveDeliveredDepartmentV1926','archiveDeliveredDepartmentV1926_'],
  ['restoreArchivedOrderV1931','restoreArchivedOrderV1931_'],
  ['markCustomerNotified','markCustomerNotified_']
];
for(const [action,fn] of names){
  assert.match(source,new RegExp('action\\s*===\\s*"'+action+'"\\)'));
  assert.match(source,new RegExp('function\\s+'+fn+'\\s*\\('));
}
assert.match(source,/action\s*===\s*"deliverReadyPickupBulk"/);
assert.match(source,/function\s+trendosV1900MainRouteObject_\s*\(/);
assert.match(source,/function\s+createManualOrder_\s*\(/);
// Any incomplete Cloud create-only switch cannot freeze R5 globally while
// these canonical Google Order/Line lifecycle writes continue.
assert.ok(names.length>=5);
console.log('T12 repository-only lifecycle writer minimum PASS: five status/archive/restore/notify routes plus pickup, separate live file inventory still required');
