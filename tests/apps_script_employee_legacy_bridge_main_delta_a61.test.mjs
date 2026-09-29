import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const main = execFileSync('git',['show','origin/main:Code.gs'],{encoding:'utf8'});
let branch = fs.readFileSync('Code.gs','utf8');

function extractAuthorize(src){
  const marker='function authorize_(username, token)';
  const start=src.indexOf(marker);
  if(start<0) return null;
  const open=src.indexOf('{',start);
  let depth=0, sq=false, dq=false, tq=false, esc=false, line=false, block=false;
  for(let i=open;i<src.length;i++){
    const c=src[i], n=src[i+1];
    if(line){ if(c==='\n') line=false; continue; }
    if(block){ if(c==='*'&&n==='/'){ block=false; i++; } continue; }
    if(!sq&&!dq&&!tq&&c==='/'&&n==='/'){ line=true; i++; continue; }
    if(!sq&&!dq&&!tq&&c==='/'&&n==='*'){ block=true; i++; continue; }
    if(esc){ esc=false; continue; }
    if((sq||dq||tq)&&c==='\\'){ esc=true; continue; }
    if(!dq&&!tq&&c==="'") sq=!sq;
    else if(!sq&&!tq&&c==='"') dq=!dq;
    else if(!sq&&!dq&&c==='\x60') tq=!tq;
    if(sq||dq||tq) continue;
    if(c==='{') depth++;
    else if(c==='}'){ depth--; if(depth===0) return src.slice(start,i+1); }
  }
  return null;
}

const mainAuth=extractAuthorize(main);
assert.ok(mainAuth,'main authorize missing');

const start=branch.indexOf('// T12 A61 compatibility bridge.');
const end=branch.indexOf('function logoutEmployee_(e)',start);
assert.ok(start>=0&&end>start,'bridge block missing');
branch=branch.slice(0,start)+mainAuth+'\n\n'+branch.slice(end);

const early=[
  '  const earlyAction = normalize_(payload.action || (e.parameter && e.parameter.action));',
  '  if (earlyAction === "cloudEmployeeLegacyBridgeExecuteV1") {',
  '    return output_(trendosCloudEmployeeLegacyBridgeExecuteV1_(payload), "");',
  '  }',
  '',
  ''
].join('\n');
branch=branch.replace(early,'');

assert.equal(branch,main,'Code.gs contains changes outside qualified A61 bridge delta');
console.log('A61_MAIN_CODE_NORMALIZED_EQUALS_MAIN=YES');
console.log('UNRELATED_BACKEND_REGRESSION=NO');
