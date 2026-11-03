'use strict';
// Parse as data, never execute either Worker. Ignore only formatting metadata.
const fs = require('node:fs');
const crypto = require('node:crypto');
const acorn = require('acorn');
function canonical(source) {
  const tree = acorn.parse(source, {ecmaVersion: 'latest', sourceType: 'module'});
  return JSON.stringify(tree, (key, value) =>
    ['start', 'end', 'loc', 'raw'].includes(key) ? undefined :
      typeof value === 'bigint' ? {bigintValue: value.toString()} : value);
}
function witness(actual, expected) {
  const a = canonical(actual), b = canonical(expected);
  return {sameAst: a === b,
    actualAstSha256: crypto.createHash('sha256').update(a).digest('hex'),
    expectedAstSha256: crypto.createHash('sha256').update(b).digest('hex')};
}
module.exports = {witness};
if (require.main === module) {
  try {
    if (process.argv.length !== 4) throw new Error('args');
    const actual = fs.readFileSync(process.argv[2], 'utf8');
    const expected = fs.readFileSync(process.argv[3], 'utf8');
    const result = witness(actual, expected);
    console.log(JSON.stringify(result));
    process.exitCode = result.sameAst ? 0 : 3;
  } catch {
    console.error('POSTBIND_AST_WITNESS_UNAVAILABLE');
    process.exitCode = 3;
  }
}
