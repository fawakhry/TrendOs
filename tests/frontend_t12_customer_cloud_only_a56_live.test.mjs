import assert from 'node:assert/strict';
import fs from 'node:fs';

const edge=fs.readFileSync('trendos-edge-orders-read-v1.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const config=fs.readFileSync('config.js','utf8');

assert.match(edge,/EDGE_ORDERS_T12_CUSTOMER_CLOUD_ONLY_A56_20260929/);
assert.match(edge,/var CUSTOMER_WRITE_PATH = '\/v1\/t12\/customers\/write'/);
assert.match(edge,/if \(action === 'createCustomer'\)/);
assert.match(edge,/return await edgeCustomerWrite\(params \|\| \{\}\)/);
assert.match(edge,/customerAuthority: 'cloud-only'/);
assert.match(edge,/CUSTOMER_CLOUD_SEARCH_UNAVAILABLE/);
assert.match(edge,/CUSTOMER_CLOUD_WRITE_UNAVAILABLE/);
assert.match(edge,/لم يتم الرجوع إلى Google/);
assert.match(edge,/لم يتم الإرسال إلى Google/);

const searchBlock=edge.slice(edge.indexOf("if (action === 'searchCustomers')"),edge.indexOf("if (action === 'createCustomer')"));
assert.doesNotMatch(searchBlock,/original\.apply|original\.call|Apps Script fallback/);

const resolver=edge.slice(edge.indexOf('async function resolveRegisteredCustomerForCloud'),edge.indexOf('async function t12CreateManualOrder'));
assert.doesNotMatch(resolver,/original\.call\(context, 'searchCustomers'/);

assert.doesNotMatch(app,/حفظ بيانات العميل في الشيت/);
assert.doesNotMatch(app,/حفظ بيانات العميل في شيت العملاء/);
assert.match(app,/تم حفظ بيانات العميل على Cloud/);
assert.match(config,/trendos-edge-orders-read-v1\.js\?v=20260929-t12-a56-customer-cloud-only-live/);

console.log('T12 A56 live customer Cloud-only frontend contract: PASS');
