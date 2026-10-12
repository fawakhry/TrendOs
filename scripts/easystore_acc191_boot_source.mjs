#!/usr/bin/env node
// ACC191: offline checks against exact pinned EasyStore boot and UI sources.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export const PIN='373d06381594e3ab32a55009fcc74907b1c37c9c';
export class BootStop extends Error {}
function check(ok,tag){if(!ok)throw new BootStop('ACC191_STOP_'+tag);}
export function inspect(app,cfg,index){
 check([app,cfg,index].every(s=>typeof s==='string'),'SOURCE_NOT_TEXT');
 const version='ES47 V1922 Unified Safe Build';
 const cache='a213-custody-close-canary-20261007-cloud-safety-20261008-closed1';
 for(const [name,src] of [['app',app],['config',cfg],['index',index]])
   check(src.includes(version),'VERSION_DRIFT_'+name);
 check(cfg.includes(cache)&&index.includes(cache),'CACHE_DRIFT');
 check(index.indexOf('config.js?v='+cache)<index.indexOf('app.js?v='+cache)&&
   index.indexOf('config.js?v='+cache)>0,'CONFIG_SCRIPT_ORDER');
 for(const [name,re] of [
  ['READONLY',/EASYSTORE_ACCOUNTING_D1_READONLY\s*=\s*true/],
  ['WRITES_OFF',/EASYSTORE_ACCOUNTING_D1_WRITES\s*=\s*false/],
  ['MODE_OFF',/EASYSTORE_ACCOUNTING_D1_WRITE_MODE\s*=\s*'OFF'/],
  ['CANARY_EMPTY',/EASYSTORE_ACCOUNTING_D1_WRITE_CANARY_ACTIONS\s*=\s*\[\]/]
 ])check(re.test(cfg),'CONFIG_'+name);
 for(const [name,needle] of [
  ['PILOT_NOT_ARMED','let a213PilotServerReady=false;'],
  ['NEW_HANDOFF_CLEARS_OLD_SESSION',"sessionStorage.removeItem('EASYSTORE_SESSION_V1922')"],
  ['SSO_ORIGIN',"if(!TRENDOS_SSO_ALLOWED_ORIGINS.has(String(event.origin || ''))) return;"],
  ['SSO_OPENER',"if(!window.opener || event.source !== window.opener) return;"],
  ['SSO_NONCE',"if(!expectedNonce || String(data.nonce || '') !== expectedNonce) return;"],
  ['SSO_FRESHNESS','Math.abs(Date.now() - issuedAt) > 30000'],
  ['SSO_SINGLE_USE','if(ssoReadySettled) return;'],
  ['WRITE_OFF_ENFORCED',"if(accountingWriteRequested && writeMode!=='CANARY')"],
  ['RESTRICT_CANARY_TO_CUSTODY',"if(accountingWriteRequested && writeMode==='CANARY' && !writeActionRequested)"],
  ['WRITE_ONE_ACTION_GATE',"if(writeActionRequested && writeMode==='CANARY' && !a213CustodyCloseCanaryEnabled())"],
  ['REQUIRE_SESSION_FOR_READ','const hasSession = await ensureTrendosSso();'],
  ['SESSION_ABSENT_DENY',"if(!hasSession) throw new Error('"],
  ['READ_ONLY_ROUTE','const useD1Accounting = useD1Read || useD1Write;']
 ])check(app.includes(needle),'APP_'+name);
 return {schema:'ACC191_EASYSTORE_BOOT_OFFLINE_V1',
   source_version:version,source_cache_tag:cache,write_mode:'OFF',canary_actions:0,
   sso_origin_opener_nonce_freshness_replay_guards:true,
   source_only:true,actual_browser_navigation:false,
   production_network_calls:0,real_sessions_verified:false,
   release_decision:'NO_GO'};
}
function main(){
 const [root,out]=process.argv.slice(2);check(root&&out,'ARGS');
 check(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim()===PIN,'PIN_DRIFT');
 const sources=['app.js','config.js','index.html'].map(p=>fs.readFileSync(path.join(root,p),'utf8'));
 const r=inspect(...sources);r.pinned_easystore_sha=PIN;
 r.source_hashes=Object.fromEntries(['app.js','config.js','index.html'].map((name,i)=>[name,crypto.createHash('sha256').update(sources[i]).digest('hex')]));
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(r,null,2)+'\n');
 console.log('ACC191_VERSION_CACHE_BOOT_ORDER=PASS');
 console.log('ACC191_SSO_AND_ACCOUNTING_OFF_SOURCE_GATES=PASS');
 console.log('ACC191_ACTUAL_BROWSER_AND_LIVE_SSO=NOT_TESTED');
 console.log('ACC191_RELEASE_DECISION=NO_GO');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{main();}catch(e){console.error(String(e));process.exitCode=1;}
}
