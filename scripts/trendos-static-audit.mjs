import fs from 'node:fs';

const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['Code.gs', 'app.js'];

function lineOf(src, pos) {
  return src.slice(0, pos).split('\n').length;
}

function functionDeclarations(src) {
  const re = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
  const matches = [];
  let m;
  while ((m = re.exec(src))) {
    matches.push({ name: m[1], index: m.index, line: lineOf(src, m.index) });
  }

  // Do not brace-parse this historical patch stack: it contains large template/string
  // sections and embedded source snippets. For hotspot indicators use the text between
  // consecutive declarations. Duplicate counting remains exact for declaration syntax.
  return matches.map((entry, i) => {
    const next = matches[i + 1];
    const end = next ? next.index : src.length;
    return { ...entry, body: src.slice(entry.index, end) };
  });
}

const mutationPatterns = [
  ['setValue', /\.setValue\s*\(/],
  ['setValues', /\.setValues\s*\(/],
  ['appendRow', /\.appendRow\s*\(/],
  ['insertSheet', /\.insertSheet\s*\(/],
  ['deleteRow/Sheet', /\.(?:deleteRow|deleteRows|deleteSheet)\s*\(/],
  ['clear', /\.clear(?:Content|Format|DataValidations)?\s*\(/],
  ['ensureHeader', /\bensureHeader(?:IfAnyMissing)?_?\s*\(/],
  ['safeSet', /\bsafeSet_\s*\(/],
  ['ensureSheet/helper', /\b(?:mbEnsureSheet_|ensureAccountingSheets_|accountsEnsure\w*_|cmEnsure\w*_|cfbEnsure\w*_)\s*\(/]
];

const expensivePatterns = [
  ['getDataRange().getValues()', /getDataRange\s*\(\s*\)\s*\.getValues\s*\(/],
  ['getDataRange().getDisplayValues()', /getDataRange\s*\(\s*\)\s*\.getDisplayValues\s*\(/],
  ['getLastColumn range', /getRange\([^\n;]*getLastColumn\s*\(\s*\)/],
  ['full rows by lastRow', /getRange\(\s*2\s*,[^\n;]*getLastRow\s*\(\s*\)/],
  ['script lock', /LockService\.getScriptLock\s*\(/]
];

let md = '# TrendOS static source audit\n\n';
md += `Generated: ${new Date().toISOString()}\n\n`;

for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const fns = functionDeclarations(src);
  const byName = new Map();
  for (const fn of fns) {
    if (!byName.has(fn.name)) byName.set(fn.name, []);
    byName.get(fn.name).push(fn.line);
  }
  const duplicates = [...byName.entries()]
    .filter(([, lines]) => lines.length > 1)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  md += `## ${file}\n\n`;
  md += `- Bytes: ${Buffer.byteLength(src)}\n`;
  md += `- Lines: ${src.split('\n').length}\n`;
  md += `- Named function declarations: ${fns.length}\n`;
  md += `- Unique function names: ${byName.size}\n`;
  md += `- Duplicate function names: ${duplicates.length}\n\n`;

  if (duplicates.length) {
    md += '### Duplicate declarations\n\n| Function | Count | Lines |\n|---|---:|---|\n';
    for (const [name, lines] of duplicates) {
      md += `| \`${name}\` | ${lines.length} | ${lines.join(', ')} |\n`;
    }
    md += '\n';
  }

  const suspicious = [];
  for (const fn of fns) {
    if (!/^(get|find|build|load|verify|authorize|check|status|health|.*Map|.*Rows)/i.test(fn.name)) continue;
    const muts = mutationPatterns.filter(([, re]) => re.test(fn.body)).map(([label]) => label);
    const exp = expensivePatterns.filter(([, re]) => re.test(fn.body)).map(([label]) => label);
    if (muts.length || exp.length) suspicious.push({ fn, muts, exp });
  }

  if (suspicious.length) {
    md += '### Read/auth-style functions with mutation or expensive-scan indicators\n\n';
    md += '| Function | Line | Mutation indicators | Expensive indicators |\n|---|---:|---|---|\n';
    for (const x of suspicious) {
      md += `| \`${x.fn.name}\` | ${x.fn.line} | ${x.muts.join(', ') || '-'} | ${x.exp.join(', ') || '-'} |\n`;
    }
    md += '\n';
  }

  const apiCalls = [...src.matchAll(/\bapi\s*\(\s*["']([^"']+)["']/g)].map((m) => m[1]);
  if (apiCalls.length) {
    const counts = new Map();
    apiCalls.forEach((a) => counts.set(a, (counts.get(a) || 0) + 1));
    md += '### Frontend/API action literals\n\n';
    for (const [name, count] of [...counts.entries()].sort()) md += `- \`${name}\`: ${count}\n`;
    md += '\n';
  }
}

fs.mkdirSync('audit-output', { recursive: true });
fs.writeFileSync('audit-output/trendos-static-audit.md', md);
console.log(md);
