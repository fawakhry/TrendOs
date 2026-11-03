'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {witness} = require('../tools/customer_stage_code_ast_witness_v1.cjs');
const original = 'export default { async fetch(request,env){ if(env.OFF!=="true") return new Response("OFF",{status:503}); return new Response("private"); }};';
test('formatting and comments alone preserve the full program AST', () => {
  assert.equal(witness('// banner\n' + original.replaceAll(';', ';\n') + '\n//# sourceMappingURL=local.map', original).sameAst, true);
});
test('a changed feature gate is rejected', () => {
  assert.equal(witness(original.replace('!==', '==='), original).sameAst, false);
});
test('an injected statement is rejected', () => {
  assert.equal(witness('fetch("https://fake.invalid");' + original, original).sameAst, false);
});
test('a changed response or literal is rejected', () => {
  assert.equal(witness(original.replace('private', 'public'), original).sameAst, false);
});
test('renamed identifiers and omitted code are rejected', () => {
  assert.equal(witness(original.replaceAll('env', 'other'), original).sameAst, false);
  assert.equal(witness('export default {};', original).sameAst, false);
});
test('invalid JavaScript cannot produce a positive witness', () => {
  assert.throws(() => witness('export default {', original));
});
test('BigInt and regexp values remain semantic content', () => {
  assert.equal(witness('export default [10n,/abc/gi];', 'export default [10n, /abc/gi];').sameAst, true);
  assert.equal(witness('export default [11n,/abc/gi];', 'export default [10n,/abc/gi];').sameAst, false);
  assert.equal(witness('export default /def/i;', 'export default /abc/i;').sameAst, false);
});
