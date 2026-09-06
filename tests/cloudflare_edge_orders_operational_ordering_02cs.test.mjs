import assert from 'node:assert/strict';
import { sortOperationalRows } from '../cloudflare-d1/src/edge-orders-read-02cr-canary.mjs';

const printRows = [
  { orderId:'P-NORMAL', department:'طباعة', priority:'عادي', flyPrint:'لا' },
  { orderId:'P-URGENT', department:'طباعة', priority:'عاجل', flyPrint:'لا' },
  { orderId:'P-FLY', department:'طباعة', priority:'عادي', flyPrint:'نعم' },
  { orderId:'P-DEFERRED', department:'طباعة', priority:'مؤجل', flyPrint:'لا' }
];
assert.deepEqual(
  sortOperationalRows(printRows, 'print').map((row) => row.orderId),
  ['P-FLY','P-URGENT','P-NORMAL','P-DEFERRED'],
  'print must be Fly Print -> urgent/VIP -> normal -> deferred'
);

const printVariantRows = [
  { orderId:'P-U', department:'طباعة', priority:'عاجل', quickPrint:'لا' },
  { orderId:'P-F', department:'طباعة', priority:'عادي', quickPrint:'على الطاير' }
];
assert.deepEqual(
  sortOperationalRows(printVariantRows, 'print').map((row) => row.orderId),
  ['P-F','P-U'],
  'Arabic Fly Print variants must outrank urgent on print'
);

const laserRows = [
  { orderId:'L-NORMAL-FLY-FLAG', department:'ليزر', priority:'عادي', flyPrint:'نعم' },
  { orderId:'L-URGENT', department:'ليزر', priority:'عاجل', flyPrint:'لا' },
  { orderId:'L-NORMAL', department:'ليزر', priority:'عادي', flyPrint:'لا' },
  { orderId:'L-DEFERRED', department:'ليزر', priority:'مؤجل', flyPrint:'لا' }
];
assert.deepEqual(
  sortOperationalRows(laserRows, 'laser').map((row) => row.orderId),
  ['L-URGENT','L-NORMAL-FLY-FLAG','L-NORMAL','L-DEFERRED'],
  'laser must ignore Fly Print and use urgent/VIP -> normal -> deferred'
);

const serviceRows = [
  { orderId:'S-NORMAL-FLY-FLAG', department:'طباعة', priority:'عادي', flyPrint:'نعم' },
  { orderId:'S-URGENT', department:'ليزر', priority:'عاجل', flyPrint:'لا' }
];
assert.deepEqual(
  sortOperationalRows(serviceRows, 'service').map((row) => row.orderId),
  ['S-URGENT','S-NORMAL-FLY-FLAG'],
  'Fly Print must not become a global priority outside the print screen'
);

console.log('PERF_CF_02CS_OPERATIONAL_ORDERING_PASS');
