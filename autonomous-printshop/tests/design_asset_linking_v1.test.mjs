import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  validateDesignAssetBindingV1,
  latestDesignAssetBindingsV1,
  productionAssetBindingStateV1
} from '../core/design-asset-linking-v1.mjs';

const sql=fs.readFileSync('autonomous-printshop/migrations/0025_design_asset_binding_v1.sql','utf8');
assert.match(sql,/AUTONOMOUS_DESIGN_ASSET_BINDING_APPEND_ONLY/);
assert.match(sql,/CUSTOMER_PRIVATE/);
assert.match(sql,/GITHUB_PUBLIC/);
assert.doesNotMatch(sql,/GOOGLE_DRIVE/i);
assert.doesNotMatch(sql,/\bDROP\b/i);
assert.doesNotMatch(sql,/\bALTER\b/i);

const linked=validateDesignAssetBindingV1({
  bindingEventId:'b1',
  artifactId:'a1',
  tenantId:'TENANT_001',
  bindingStatus:'LINKED',
  privacyClass:'CUSTOMER_PRIVATE',
  storageProvider:'R2',
  storageRef:'r2://designs/a1.png',
  observedAtMs:1000
},{tenantId:'TENANT_001'});
assert.equal(linked.bindingStatus,'LINKED');

assert.throws(()=>validateDesignAssetBindingV1({
  artifactId:'a1',
  tenantId:'TENANT_001',
  bindingStatus:'LINKED',
  privacyClass:'CUSTOMER_PRIVATE',
  storageProvider:'GITHUB_PUBLIC',
  storageRef:'https://github.com/public.png',
  observedAtMs:1000
},{tenantId:'TENANT_001'}),/ASSET_PRIVATE_PUBLIC_STORAGE_FORBIDDEN/);

assert.throws(()=>validateDesignAssetBindingV1({
  artifactId:'a1',
  tenantId:'TENANT_002',
  bindingStatus:'LINKED',
  privacyClass:'PUBLIC_SAFE',
  storageProvider:'R2',
  storageRef:'x',
  observedAtMs:1000
},{tenantId:'TENANT_001'}),/ASSET_TENANT_MISMATCH/);

assert.throws(()=>validateDesignAssetBindingV1({
  artifactId:'a1',
  tenantId:'TENANT_001',
  bindingStatus:'LINKED',
  privacyClass:'PUBLIC_SAFE',
  storageProvider:'',
  storageRef:'',
  observedAtMs:1000
},{tenantId:'TENANT_001'}),/ASSET_LINKED_STORAGE_REQUIRED/);

const latest=latestDesignAssetBindingsV1([
  {bindingEventId:'b1',artifactId:'a1',tenantId:'TENANT_001',bindingStatus:'PENDING_UPLOAD',privacyClass:'CUSTOMER_PRIVATE',observedAtMs:1000},
  {bindingEventId:'b2',artifactId:'a1',tenantId:'TENANT_001',bindingStatus:'LINKED',privacyClass:'CUSTOMER_PRIVATE',storageProvider:'R2',storageRef:'r2://a1',observedAtMs:2000}
],{tenantId:'TENANT_001'});
assert.equal(latest.get('a1').bindingStatus,'LINKED');
assert.equal(productionAssetBindingStateV1(latest.get('a1')).available,true);
assert.equal(productionAssetBindingStateV1({bindingStatus:'MISSING'}).state,'BLOCKED');
assert.equal(productionAssetBindingStateV1({bindingStatus:'PENDING_UPLOAD'}).state,'UNKNOWN');

console.log('AUTONOMOUS_PRINTSHOP_DESIGN_ASSET_LINKING_V1=PASS');
console.log('STORAGE=PROVIDER_AGNOSTIC');
console.log('CROSS_TENANT=FAIL_CLOSED');
console.log('CUSTOMER_PRIVATE_PUBLIC_STORAGE=FORBIDDEN');
console.log('LINKED_REQUIRES_REAL_STORAGE_REF=YES');
