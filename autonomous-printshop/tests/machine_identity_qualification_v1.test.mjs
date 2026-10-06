import assert from 'node:assert/strict';
import { qualifyMachineIdentityV1 } from '../core/machine-identity-qualification-v1.mjs';
import { buildRegisterMachineWithIdentitySqlV1 } from '../core/machine-identity-command-v1.mjs';

let q=qualifyMachineIdentityV1({
  machineId:'HP-2026-0001',machineIdExplicit:true,
  displayName:'Heat Press Main',department:'طباعة',machineClass:'HEAT_PRESS',
  identitySourceKind:'NAMEPLATE',identitySourceRef:'nameplate-photo-ref',
  serialOrAssetTag:'SN-ABC-001'
});
assert.equal(q.qualified,true);
assert.equal(q.inferredIdentity,false);
assert.equal(q.readyStateGranted,false);
assert.equal(q.lineMappingGranted,false);

q=qualifyMachineIdentityV1({
  machineId:'press-01',machineIdExplicit:false,
  displayName:'Press',department:'طباعة',machineClass:'HEAT_PRESS',
  identitySourceKind:'NAMEPLATE',identitySourceRef:'',serialOrAssetTag:''
});
assert.equal(q.qualified,false);
assert.ok(q.reasons.includes('MACHINE_ID_MUST_BE_EXPLICIT'));
assert.ok(q.reasons.includes('IDENTITY_SOURCE_REF_REQUIRED'));
assert.ok(q.reasons.includes('SERIAL_OR_ASSET_TAG_REQUIRED'));

q=qualifyMachineIdentityV1({
  machineId:'LASER-ASSET-7',machineIdExplicit:true,
  displayName:'Laser',department:'ليزر',machineClass:'LASER',
  identitySourceKind:'OPERATOR_GUESS',identitySourceRef:'verbal',serialOrAssetTag:'7'
});
assert.equal(q.qualified,false);
assert.ok(q.reasons.includes('IDENTITY_SOURCE_NOT_QUALIFIED'));

const sql=buildRegisterMachineWithIdentitySqlV1({
  identityEventId:'identity-001',
  machineId:'LASER-ASSET-7',machineIdExplicit:true,
  displayName:'Laser Main',department:'ليزر',machineClass:'LASER',
  identitySourceKind:'OWNER_ASSET_REGISTRY',identitySourceRef:'asset-register-row-7',
  serialOrAssetTag:'ASSET-7',capabilities:['cut','engrave'],
  identityEvidence:{directIdentityCheck:true}
});
assert.match(sql,/autonomous_machine_identity_events/);
assert.match(sql,/autonomous_machines/);
assert.match(sql,/OWNER_ASSET_REGISTRY/);
assert.match(sql,/ASSET-7/);
assert.match(sql,/WHERE EXISTS/);
assert.doesNotMatch(sql,/autonomous_machine_observations/);
assert.doesNotMatch(sql,/autonomous_line_machine_mapping_events/);

console.log('MACHINE_IDENTITY_QUALIFICATION_V1=PASS');
console.log('EXPLICIT_MACHINE_ID_REQUIRED=YES');
console.log('NAMEPLATE_OR_OWNER_REGISTRY_REQUIRED=YES');
console.log('IDENTITY_EVENT_APPEND_ONLY=YES');
console.log('IDENTITY_DOES_NOT_GRANT_READY=YES');
console.log('IDENTITY_DOES_NOT_MAP_LINE=YES');
