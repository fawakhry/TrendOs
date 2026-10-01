#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const API_BASE='https://api.cloudflare.com/client/v4';
const WORKER_NAME='trendos-ui';
const MAIN_MODULE='frontend-static-worker.mjs';
const COMPATIBILITY_DATE='2026-09-27';
const QUALIFIED_SOURCE='6a9cd90649cfa0ac75b25b725d53e9f779bb2c61';

function fail(message){ console.error('ERROR:',message); process.exit(1); }
function mimeFor(file){
  const ext=path.extname(file).toLowerCase();
  const map={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.pdf':'application/pdf'};
  return map[ext]||'application/octet-stream';
}
function walkFiles(root,current=root,out=[]){
  for(const entry of fs.readdirSync(current,{withFileTypes:true})){
    const full=path.join(current,entry.name);
    if(entry.isDirectory()) walkFiles(root,full,out);
    else if(entry.isFile()) out.push(full);
  }
  return out;
}
function createManifest(assetsDir){
  const manifest={},byHash=new Map(),files=walkFiles(assetsDir);
  if(!files.length) fail('No frontend assets found');
  for(const full of files){
    const rel=path.relative(assetsDir,full).replace(/\\/g,'/');
    const content=fs.readFileSync(full);
    const extension=path.extname(rel).substring(1);
    const hash=crypto.createHash('sha256').update(content.toString('base64')+extension).digest('hex').slice(0,32);
    manifest['/'+rel]={hash,size:content.length};
    byHash.set(hash,{content,mime:mimeFor(rel)});
  }
  return {manifest,byHash};
}
function assertQualified(packageDir){
  const required=[
    ['frontend-dist/config.js','trendos-edge-orders-read-v1.js?v=20261001-duplicate-order-guard-ui'],
    ['frontend-dist/trendos-edge-orders-read-v1.js',"reason === 'duplicate-order-window-active'"],
    ['frontend-dist/trendos-edge-orders-read-v1.js','تم منع إنشاء أوردر مكرر'],
    ['frontend-dist/trendos-edge-orders-read-v1.js','recoverPostWriteBarrier'],
    ['frontend-dist/trendos-edge-orders-read-v1.js','postWriteBarrierRecoveries'],
    ['frontend-dist/app.js','function loadInitialRowsWhenEdgeReady()'],
    ['frontend-dist/app.js','function secureApiChainHasEdgeOrdersRouter(fn)'],
    ['frontend-dist/index.html','config.js?v=20261001-duplicate-order-guard-ui'],
    ['frontend-dist/index.html','app.js?v=20261001-initial-edge-ready'],
    [MAIN_MODULE,'env.ASSETS.fetch(request)']
  ];
  for(const [rel,marker] of required){
    const full=path.join(packageDir,rel);
    if(!fs.existsSync(full)) fail('Missing required frontend file: '+rel);
    const txt=fs.readFileSync(full,'utf8');
    if(!txt.includes(marker)) fail('Qualification marker missing in '+rel+': '+marker);
  }
}
async function cfJson(url,options,label){
  const response=await fetch(url,options);
  const txt=await response.text();
  let body;
  try{ body=txt?JSON.parse(txt):{}; }catch{ fail(label+' returned non-JSON HTTP '+response.status); }
  if(!response.ok||body?.success===false){
    const errors=Array.isArray(body?.errors)?body.errors.map(x=>x?.message||JSON.stringify(x)).join('; '):'';
    fail(label+' failed HTTP '+response.status+(errors?': '+errors:''));
  }
  return body;
}
async function startUploadSession(accountId,apiToken,manifest){
  const url=`${API_BASE}/accounts/${encodeURIComponent(accountId)}/workers/scripts/${WORKER_NAME}/assets-upload-session`;
  const body=await cfJson(url,{method:'POST',headers:{Authorization:`Bearer ${apiToken}`,'content-type':'application/json'},body:JSON.stringify({manifest})},'Asset manifest registration');
  const jwt=body?.result?.jwt,buckets=body?.result?.buckets;
  if(!jwt||!Array.isArray(buckets)) fail('Upload session response missing jwt/buckets');
  return {jwt,buckets};
}
async function uploadBucket(accountId,uploadJwt,hashes,byHash,index,total){
  const form=new FormData();
  for(const hash of hashes){
    const asset=byHash.get(hash);
    if(!asset) fail('Unknown asset hash requested: '+hash);
    form.append(hash,new Blob([asset.content.toString('base64')],{type:asset.mime}),hash);
  }
  const url=`${API_BASE}/accounts/${encodeURIComponent(accountId)}/workers/assets/upload?base64=true`;
  const body=await cfJson(url,{method:'POST',headers:{Authorization:`Bearer ${uploadJwt}`},body:form},`Asset upload bucket ${index}/${total}`);
  return body?.result?.jwt||null;
}
async function createVersion(accountId,apiToken,completionJwt,mainPath){
  const metadata={
    main_module:MAIN_MODULE,
    compatibility_date:COMPATIBILITY_DATE,
    bindings:[{type:'assets',name:'ASSETS'}],
    assets:{jwt:completionJwt,config:{not_found_handling:'single-page-application'}},
    annotations:{'workers/message':`TrendOS duplicate-order guard UI; source ${QUALIFIED_SOURCE}; create only before guarded promote`}
  };
  const form=new FormData();
  form.append('metadata',JSON.stringify(metadata));
  form.append(MAIN_MODULE,new Blob([fs.readFileSync(mainPath)],{type:'application/javascript+module'}),MAIN_MODULE);
  const url=`${API_BASE}/accounts/${encodeURIComponent(accountId)}/workers/scripts/${WORKER_NAME}/versions`;
  const body=await cfJson(url,{method:'POST',headers:{Authorization:`Bearer ${apiToken}`},body:form},'Create Worker version');
  const versionId=body?.result?.id;
  if(!versionId) fail('Version created but no version ID returned');
  return versionId;
}

async function main(){
  const packageDir=path.resolve(process.argv[2]||'dist/entry594');
  const assetsDir=path.join(packageDir,'frontend-dist');
  const mainPath=path.join(packageDir,MAIN_MODULE);
  assertQualified(packageDir);
  const {manifest,byHash}=createManifest(assetsDir);
  const accountId=String(process.env.CLOUDFLARE_ACCOUNT_ID||'').trim();
  const apiToken=String(process.env.CLOUDFLARE_API_TOKEN||'').trim();
  if(!accountId) fail('CLOUDFLARE_ACCOUNT_ID is not set');
  if(!apiToken) fail('CLOUDFLARE_API_TOKEN is not set');

  console.log('ENTRY594_PACKAGE=QUALIFIED');
  console.log('FRONTEND_SOURCE_COMMIT='+QUALIFIED_SOURCE);
  console.log('TARGET_WORKER='+WORKER_NAME);
  console.log('ASSET_COUNT='+Object.keys(manifest).length);
  console.log('DEPLOYMENT_ACTION=NONE_BEFORE_PROMOTE_STEP');
  console.log('TRAFFIC_CHANGE=NONE_BEFORE_PROMOTE_STEP');

  const session=await startUploadSession(accountId,apiToken,manifest);
  let completionJwt=session.jwt;
  if(session.buckets.length){
    completionJwt=null;
    for(let i=0;i<session.buckets.length;i+=1){
      const maybe=await uploadBucket(accountId,session.jwt,session.buckets[i],byHash,i+1,session.buckets.length);
      if(maybe) completionJwt=maybe;
    }
    if(!completionJwt) fail('Asset upload completed without completion JWT');
  }

  const versionId=await createVersion(accountId,apiToken,completionJwt,mainPath);
  console.log('ENTRY594_VERSION_CREATED=YES');
  console.log('VERSION_ID='+versionId);
  console.log('TRAFFIC_CHANGED=NO');
  console.log('DEPLOYMENT_CREATED=NO');
}

main().catch(error=>{console.error('ERROR:',error?.stack||error?.message||String(error));process.exit(1);});
