import assert from 'node:assert/strict';
import fs from 'node:fs';

const client=fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../config.js',import.meta.url),'utf8');

assert.ok(client.includes("EDGE_ORDERS_T12_LASER_SERVICE_02CR_20260928"));
assert.match(client,/function pagePathFor\(params\)[\s\S]*?return QUALIFIED_PAGE_PATH;/);
assert.ok(!client.includes("return isServiceScreen(params) ? SERVICE_PAGE_PATH : QUALIFIED_PAGE_PATH;"));
assert.ok(!client.includes("return isServiceScreen(params) ? validateServiceResponse(body) : normalizeEdgeLineIdentities(validateRequiredMirrors(body));"));
assert.ok(client.includes("return normalizeEdgeLineIdentities(validateRequiredMirrors(body));"));
assert.ok(client.includes("serviceUsesQualified02CR: true"));
assert.ok(config.includes("window.MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS = ['print','laser','press','service'];"));
assert.ok(client.includes("var QUALIFIED_PAGE_PATH = '/v1/edge/orders/02cr/page';"));

console.log('T12_LASER_SERVICE_FRONTEND_02CR_A46=PASS');
