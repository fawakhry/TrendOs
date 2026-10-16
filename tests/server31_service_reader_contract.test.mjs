/** SERVER-31: strict, OFF-by-default service reader contract; no real credentials. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const path = fileURLToPath(new URL('../autonomous-printshop/print-server/SERVICE_ORDER_READER_POLICY_V1.json',import.meta.url));
const p = JSON.parse(fs.readFileSync(path,'utf8'));
test('identity is dedicated and no live account is provisioned',()=>{
  assert.equal(p.principal.id,'trendosshop_order_reader');
  assert.equal(p.principal.kind,'dedicated-service-principal');
  assert.equal(p.principal.provisioned,false);
  assert.equal(p.principal.enabled,false);
  assert.equal(p.principal.mayUseEmployeeIdentity,false);
});
test('only print and laser read permissions, with per-line isolation',()=>{
  assert.equal(p.authorization.operation,'orders.read');
  assert.deepEqual(p.authorization.screens,['print','laser']);
  assert.equal(p.authorization.defaultDeny,true);
  assert.equal(p.authorization.authority,'D1-backend-only');
  assert.equal(p.authorization.lineScoped,true);
  assert.equal(p.authorization.requireMatchedOrderIdAndLineId,true);
  assert.equal(p.authorization.requestedScreenNeverGrantsAccess,true);
  for(const blocked of ['service','press',''])assert.ok(p.authorization.forbiddenScreens.includes(blocked));
});
test('response fields cannot disclose customer directory, finance or device authority',()=>{
  assert.deepEqual(p.authorization.acceptedFields,['orderId','lineId','screen','serviceCode','status','quantity']);
  for(const action of ['orders.write','orders.status.change','customers.directory.read','accounting.read','accounting.write','devices.execute','laser.execute'])
    assert.ok(p.authorization.forbiddenOperations.includes(action));
});
test('transport starts OFF and requires separately approved production gates',()=>{
  assert.equal(p.readClient.enabled,false);
  assert.equal(p.readClient.oneShotOnly,true);
  assert.equal(p.readClient.httpsOutgoingOnly,undefined); // HTTPS is a mandatory security rule, not a runtime claim
  assert.equal(p.security.httpsOutgoingOnly,true);
  assert.equal(p.security.allowRedirects,false);
  assert.equal(p.security.externalSecretSourceRequired,true);
  assert.equal(p.security.liveCloudflareAccessVerified,false);
  assert.equal(p.evidence.serverSideAuthorizationImplemented,false);
  for(const value of Object.values(p.changeGates))assert.equal(value,true);
});
