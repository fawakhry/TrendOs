import assert from 'node:assert/strict';
import {
  buildRegisterMachineSqlV1,
  buildRecordMachineObservationSqlV1,
  buildMapLineToMachineSqlV1
} from '../core/machine-evidence-command-v1.mjs';

let sql=buildRegisterMachineSqlV1({
  machineId:'press-01',displayName:'مكبس 1',department:'طباعة',
  machineClass:'HEAT_PRESS',capabilities:['mug','shirt']
});
assert.match(sql,/autonomous_machines/);
assert.match(sql,/press-01/);
assert.match(sql,/ON CONFLICT/);

sql=buildRecordMachineObservationSqlV1({
  observationId:'obs-001',machineId:'press-01',machineState:'READY',
  sourceKind:'OPERATOR_CHECK',sourceRef:'manual-check',ttlMinutes:10,
  evidence:{directCheck:true,note:"tested"}
});
assert.match(sql,/autonomous_machine_observations/);
assert.match(sql,/mode='SHADOW'/);
assert.match(sql,/directCheck/);

assert.throws(()=>buildRecordMachineObservationSqlV1({
  observationId:'obs-002',machineId:'press-01',machineState:'READY',
  sourceKind:'SYSTEM',sourceRef:'no-fault',ttlMinutes:10,
  evidence:{directCheck:true}
}),/READY_DIRECT_CHECK_SOURCE_REQUIRED/);

assert.throws(()=>buildRecordMachineObservationSqlV1({
  observationId:'obs-003',machineId:'press-01',machineState:'READY',
  sourceKind:'SELF_TEST',sourceRef:'self',ttlMinutes:30,
  evidence:{directCheck:true}
}),/READY_TTL_TOO_LONG/);

sql=buildMapLineToMachineSqlV1({
  mappingEventId:'map-001',lineId:'123-1',machineId:'press-01',
  mappingState:'ACTIVE',sourceKind:'OPERATOR',sourceRef:'manual-map'
});
assert.match(sql,/autonomous_line_machine_mapping_events/);
assert.match(sql,/employee_core_lines_v1/);
assert.match(sql,/t12_prod_lines/);

assert.throws(()=>buildRegisterMachineSqlV1({
  machineId:"x';DROP TABLE autonomous_machines;--",
  displayName:'bad',department:'x',machineClass:'PRESS'
}),/MACHINE_ID_INVALID/);

assert.throws(()=>buildMapLineToMachineSqlV1({
  mappingEventId:'map-002',lineId:"x';DELETE FROM t12_prod_lines;--",
  machineId:'press-01'
}),/LINE_ID_INVALID/);

console.log('MACHINE_EVIDENCE_COMMAND_V1=PASS');
console.log('SQL_INJECTION_GUARD=PASS');
console.log('MACHINE_SHADOW_REQUIRED=YES');
console.log('REAL_LINE_EXISTENCE_REQUIRED=YES');
console.log('READY_DIRECT_CHECK_REQUIRED=YES');
