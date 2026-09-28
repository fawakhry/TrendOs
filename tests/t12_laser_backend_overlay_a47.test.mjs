import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mapT12CloudNativeRows, filterT12OverlayRows, mergeT12ReadOverlayRows } from '../cloudflare-d1/src/t12-read-overlay.mjs';

const route=fs.readFileSync(new URL('../cloudflare-d1/src/edge-orders-read-02cr-canary.mjs',import.meta.url),'utf8');

assert.ok(route.includes("readT12CloudNativeOverlay(env, screen)"));
assert.ok(route.includes("mergeT12ReadOverlayRows(mapped, overlay.rows)"));
assert.ok(route.indexOf("mergeT12ReadOverlayRows(mapped, overlay.rows)") < route.indexOf("rowMatchesAppsFilters(row, params)"));
assert.ok(route.indexOf("mergeT12ReadOverlayRows(mapped, overlay.rows)") < route.indexOf("const pageSize ="));

const raw=[
 {orderId:'5001',lineId:'5001-01',department:'ليزر',itemName:'حفر',qty:1,priority:'عادي',status:'تحت التنفيذ',heatPress:0,flyPrint:0,customerName:'عميل ليزر',customerPhone:'0101',source:'داخلي'},
 {orderId:'5002',lineId:'5002-01',department:'طباعة',itemName:'بنر',qty:1,priority:'عادي',status:'طلب جديد',heatPress:0,flyPrint:0,customerName:'عميل طباعة',customerPhone:'0102',source:'داخلي'}
];
const laser=mapT12CloudNativeRows(raw,'laser');
assert.equal(laser.length,1);
assert.equal(laser[0].lineId,'5001-01');
assert.equal(laser[0].status,'تحت التنفيذ');
assert.equal(laser[0].cloudNative,true);

const service=mapT12CloudNativeRows(raw,'service');
assert.equal(service.length,2);
assert.equal(filterT12OverlayRows(service,{statusFilter:'تحت التنفيذ'}).length,1);

const merged=mergeT12ReadOverlayRows([{orderId:'5001',lineId:'5001-01',status:'طلب جديد'}],laser);
assert.equal(merged.length,1);
assert.equal(merged[0].status,'تحت التنفيذ');
assert.equal(merged[0].cloudNative,true);

console.log('T12_LASER_BACKEND_OVERLAY_A47=PASS');
