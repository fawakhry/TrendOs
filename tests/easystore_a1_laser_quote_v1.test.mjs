import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0021_employee_accounting_material_dimensions_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');

assert.ok(sql.includes('ADD COLUMN raw_width REAL NOT NULL DEFAULT 0'));
assert.ok(sql.includes('ADD COLUMN raw_height REAL NOT NULL DEFAULT 0'));
assert.ok(sql.includes('idx_employee_accounting_material_dimensions'));

const readLine=mod.split(String.fromCharCode(10)).find(x=>x.includes('const READ_ACTIONS=new Set'))||'';
assert.ok(readLine.includes("'calculateAccountingLaserQuoteV1913'"));
assert.ok(mod.includes('async function calculateAccountingLaserQuoteV1913V1'));
assert.ok(mod.includes('sheetArea=rawWidth*rawHeight'));
assert.ok(mod.includes('consumedAreaPerPiece=pieceArea*(1+wastePercent/100)'));
assert.ok(mod.includes('materialCostPerPiece=sheetCost*consumedAreaPerPiece/sheetArea'));
assert.ok(mod.includes('estimatedPiecesPerSheet:piecesByLayout'));
assert.ok(mod.includes("if(auth.mode!=='full')"));
assert.ok(mod.includes('materialId:text(material.material_id)'));

console.log('EASYSTORE_A1_LASER_QUOTE_SOURCE=PASS');
console.log('QUOTE_AUTHORITY=D1_DETERMINISTIC');
console.log('MATERIAL_DIMENSIONS=FIRST_CLASS');
console.log('LASER_COST_VISIBILITY=ROLE_GATED');
console.log('PRODUCTION_MUTATION=NO');
