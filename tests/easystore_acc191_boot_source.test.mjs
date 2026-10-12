import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inspect,BootStop} from '../scripts/easystore_acc191_boot_source.mjs';
const root=process.argv[2]||'isolated-easystore-source';
const originals=['app.js','config.js','index.html'].map(p=>fs.readFileSync(root+'/'+p,'utf8'));
const safe=inspect(...originals);
assert.equal(safe.release_decision,'NO_GO');
assert.equal(safe.write_mode,'OFF');
assert.equal(safe.canary_actions,0);
assert.equal(safe.sso_origin_opener_nonce_freshness_replay_guards,true);
function checkMutation(which,from,to,code){
 const altered=originals.slice();
 assert.ok(altered[which].includes(from),'upstream baseline changed');
 altered[which]=from==='ES47 V1922 Unified Safe Build' ? altered[which].split(from).join(to) : altered[which].replace(from,to);
 assert.throws(()=>inspect(...altered),e=>e instanceof BootStop&&e.message.includes(code));
}
checkMutation(1,"WRITE_MODE = 'OFF'","WRITE_MODE = 'GENERAL'",'CONFIG_MODE_OFF');
checkMutation(1,'D1_WRITES = false','D1_WRITES = true','CONFIG_WRITES_OFF');
checkMutation(1,'D1_READONLY = true','D1_READONLY = false','CONFIG_READONLY');
checkMutation(2,'config.js?v=','config-alt.js?v=','CONFIG_SCRIPT_ORDER');
checkMutation(2,'ES47 V1922 Unified Safe Build','ES47 BAD','VERSION_DRIFT_index');
console.log('ACC191_5_MUTANT_SOURCE_SAFETY_GATES=PASS');
console.log('ACC191_OFFLINE_BOOT_AND_SESSION_BOUNDARY_SOURCE=PASS');
