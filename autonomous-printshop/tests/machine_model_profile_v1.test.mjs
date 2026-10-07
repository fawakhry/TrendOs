import assert from 'node:assert/strict';
import {
  loadMachineModelCatalogV1,
  getMachineModelProfileV1,
  buildMachineRegistrationCandidateFromModelV1
} from '../core/machine-model-profile-v1.mjs';

const catalog=loadMachineModelCatalogV1();
const p=getMachineModelProfileV1(catalog,'CANON_IMAGEPROGRAF_PRO_2100');

assert.ok(p);
assert.equal(p.manufacturer,'Canon');
assert.equal(p.model,'imagePROGRAF PRO-2100');
assert.equal(p.nominalMediaWidthIn,24);
assert.equal(p.maxMediaWidthMm,609.6);
assert.equal(p.maxPrintResolutionDpi.x,2400);
assert.equal(p.maxPrintResolutionDpi.y,1200);
assert.equal(p.inkSystem.channels,12);
assert.equal(p.inkSystem.type,'PIGMENT');
assert.equal(p.media.maxRollDiameterMm,170);
assert.equal(p.power.maxW,93);
assert.equal(p.physicalIdentityRequired,true);
assert.equal(p.grantsReady,false);
assert.equal(p.grantsRegistration,false);

let q=buildMachineRegistrationCandidateFromModelV1({
  catalog,modelKey:'CANON_IMAGEPROGRAF_PRO_2100'
});
assert.equal(q.modelProfileQualified,true);
assert.equal(q.physicalIdentityComplete,false);
assert.equal(q.registrationAllowed,false);
assert.equal(q.readyAllowed,false);
assert.equal(q.reason,'PHYSICAL_MACHINE_IDENTITY_REQUIRED');

q=buildMachineRegistrationCandidateFromModelV1({
  catalog,modelKey:'CANON_IMAGEPROGRAF_PRO_2100',
  physicalIdentity:{
    machineId:'canon-pro2100-01',
    serialOrAssetTag:'OWNER-TAG-001',
    identitySourceKind:'OWNER_ASSET_REGISTRY',
    identitySourceRef:'owner-registry:001'
  }
});
assert.equal(q.physicalIdentityComplete,true);
assert.equal(q.registrationAllowed,true);
assert.equal(q.readyAllowed,false);

console.log('MACHINE_MODEL_PROFILE_V1=PASS');
console.log('CANON_IMAGEPROGRAF_PRO_2100_PROFILE=QUALIFIED');
console.log('MODEL_PROFILE_GRANTS_REGISTRATION=NO');
console.log('MODEL_PROFILE_GRANTS_READY=NO');
console.log('PHYSICAL_IDENTITY_REQUIRED=YES');
