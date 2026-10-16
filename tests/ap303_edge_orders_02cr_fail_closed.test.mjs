/** AP-303 source-level offline scope regression — NO customer/production API. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
  allowsOrdersReadScreen,
  handleEdgeOrders02CRCanaryRequest,
} from '../cloudflare-d1/src/edge-orders-read-02cr-canary.mjs';
import { issueOrdersEdgeToken } from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import deployedRouterCandidate from '../cloudflare-d1/src/index_v2.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const SECRET = 'AP303_SYNTHETIC_HMAC_SECRET_NOT_REAL';
const BASE = 'https://trendos-02cr-regression.invalid/v1/edge/orders/02cr/page?screen=print';

function fakeEnv() {
  return {
    EDGE_SESSION_SECRET: SECRET,
    DB: {
      prepare() { throw new Error('AP303_DB_SHOULD_NOT_BE_CALLED_ON_DENIED_REQUEST'); }
    }
  };
}

async function callWithSignedScreens(screens, screen='print') {
  const token = await issueOrdersEdgeToken(
    { sub:'FAKE_AP303_SERVICE', role:'service', screens }, SECRET,
  );
  const request = new Request(
    'https://trendos-02cr-regression.invalid/v1/edge/orders/02cr/page?screen=' + screen,
    { method:'GET', headers:{Authorization:'Bearer ' + token} },
  );
  return handleEdgeOrders02CRCanaryRequest(request, fakeEnv());
}

test('missing screen claims always deny, even with valid signature', async () => {
  const response = await callWithSignedScreens(undefined);
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, 'orders-screen-not-authorized');
});

test('empty screen list never becomes broad data access', async () => {
  const response = await callWithSignedScreens([]);
  assert.equal(response.status, 403);
});

test('nonmatching legitimate screen is forbidden', async () => {
  const response = await callWithSignedScreens(['laser'], 'print');
  assert.equal(response.status, 403);
});

test('service role without print grant cannot read print', async () => {
  const response = await callWithSignedScreens(['service'], 'print');
  assert.equal(response.status, 403);
});

test('missing signature is still rejected at token gate', async () => {
  const response = await handleEdgeOrders02CRCanaryRequest(
    new Request(BASE, { method:'GET' }), fakeEnv(),
  );
  assert.equal(response.status, 401);
});

test('strict helper rejects empty, missing, wrong and mixed claim types', () => {
  const badClaims = [
    null, {}, {screens:undefined}, {screens:null}, {screens:[]},
    {screens:'print'}, {screens:['laser']}, {screens:['print',7]},
    {screens:['print',null]}, {screens:['print',{}]}, {screens:[{}]},
    {screens:[true]}, {screens:[true,'print']},
  ];
  for(const item of badClaims) {
    assert.equal(allowsOrdersReadScreen(item,'print'),false,JSON.stringify(item));
  }
});

test('strict helper accepts exact matching granted screen only', () => {
  assert.equal(allowsOrdersReadScreen({screens:['print']},'print'),true);
  assert.equal(allowsOrdersReadScreen({screens:['laser']},'laser'),true);
  assert.equal(allowsOrdersReadScreen({screens:['print','press','']},'print'),true);
  assert.equal(allowsOrdersReadScreen({screens:['print','press','']},'laser'),false);
  assert.equal(allowsOrdersReadScreen({screens:['laser']},'service'),false);
});

test('full v2 router rejects signed empty scope before D1 mirror metadata', async () => {
  let dbQueries = 0;
  const token = await issueOrdersEdgeToken(
    { sub:'FAKE_AP303_SERVICE', role:'service', screens:[] }, SECRET,
  );
  const response = await deployedRouterCandidate.fetch(
    new Request(BASE, { method:'GET', headers:{Authorization:'Bearer ' + token} }),
    { EDGE_SESSION_SECRET:SECRET, DB:{ prepare(){ dbQueries++; throw new Error('D1 MUST NOT BE TOUCHED'); } } },
    {},
  );
  assert.equal(response.status,403);
  assert.equal(dbQueries,0);
});

test('full v2 router rejects signed wrong-screen scope before D1', async () => {
  let dbQueries = 0;
  const token = await issueOrdersEdgeToken(
    { sub:'FAKE_AP303_SERVICE', role:'laser', screens:['laser'] }, SECRET,
  );
  const response = await deployedRouterCandidate.fetch(
    new Request(BASE, { method:'GET', headers:{Authorization:'Bearer ' + token} }),
    { EDGE_SESSION_SECRET:SECRET, DB:{ prepare(){ dbQueries++; throw new Error('D1 MUST NOT BE TOUCHED'); } } },
    {},
  );
  assert.equal(response.status,403);
  assert.equal(dbQueries,0);
});

test('non-routable test host only; no network client, backend or secrets', () => {
  assert.equal(new URL(BASE).hostname.endsWith('.invalid'),true);
  assert.equal(SECRET.includes('PROD_QUALIFY'),false);
});
