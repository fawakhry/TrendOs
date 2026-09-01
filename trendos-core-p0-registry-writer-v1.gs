/**
 * TrendOS CORE-P0 resolution-registry writer V1.
 *
 * GITHUB-ONLY SAFETY TOOL. Do not install or run without a separate explicit
 * production-data-write checkpoint.
 *
 * Contracts:
 * - public preview is read-only;
 * - write/rollback require a one-use Script Property equal to the exact plan hash;
 * - every mutation runs under ScriptLock while all business families are OFF;
 * - live evidence is re-read before and after the append;
 * - source sheets are never mutated;
 * - rollback is append-only and never deletes registry or source history.
 */
const TRENDOS_CORE_P0_REGISTRY_WRITER_VERSION_V1='TRENDOS_CORE_P0_REGISTRY_WRITER_V1_20260901';
const TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1='TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_V1';
const TRENDOS_CORE_P0_REGISTRY_ROLLBACK_APPROVAL_PROP_V1='TRENDOS_CORE_P0_REGISTRY_ROLLBACK_APPROVAL_V1';
const TRENDOS_CORE_P0_REGISTRY_EXPECTED_ROWS_V1=34;

function trendosCoreP0RegistrySpecsV1_(){return[
  {metricId:'DUPLICATE_ATTENDANCE_SESSIONS',entityKey:'جابر|2026-08-31',canonicalId:'AT-20260831-جابر-98f40226',supersededId:'AT-20260831-جابر-36fed31c',classification:'SUPERSEDED_LEGACY_DUPLICATE',reason:'Exact historical attendance duplicate resolution',evidenceHash:'5cfb0d17d26cedb5ed66b85619d2058e1823459fa0b54d5a7537dee4bc9d1050',sourceCount:2},
  {metricId:'DUPLICATE_ATTENDANCE_SESSIONS',entityKey:'ريفان|2026-08-27',canonicalId:'AT-20260827-ريفان-c90877a5',supersededId:'AT-20260827-ريفان-87248baa',classification:'SUPERSEDED_LEGACY_DUPLICATE',reason:'Exact historical attendance duplicate resolution',evidenceHash:'b6e8539721dcb8fcba1d6f24f5f6736408e9022a18399156a5f80ebe2fb4409f',sourceCount:3},
  {metricId:'DUPLICATE_ATTENDANCE_SESSIONS',entityKey:'ريفان|2026-08-27',canonicalId:'AT-20260827-ريفان-c90877a5',supersededId:'AT-20260827-ريفان-83dd3162',classification:'SUPERSEDED_LEGACY_DUPLICATE',reason:'Exact historical attendance duplicate resolution',evidenceHash:'b6e8539721dcb8fcba1d6f24f5f6736408e9022a18399156a5f80ebe2fb4409f',sourceCount:3},
  {metricId:'DUPLICATE_ATTENDANCE_SESSIONS',entityKey:'ريفان|2026-08-29',canonicalId:'AT-20260829-ريفان-1f338175',supersededId:'AT-20260829-ريفان-89ef1c58',classification:'SUPERSEDED_LEGACY_DUPLICATE',reason:'Exact historical attendance duplicate resolution',evidenceHash:'99c1c04cfb75a07b554e10d0d7cfce122773f4758846183558fa896719d560b6',sourceCount:2},
  {metricId:'DUPLICATE_ATTENDANCE_SESSIONS',entityKey:'ريفان|2026-08-30',canonicalId:'AT-20260830-ريفان-ea4e5707',supersededId:'AT-20260830-ريفان-bcc4c8ce',classification:'SUPERSEDED_LEGACY_DUPLICATE',reason:'Exact historical attendance duplicate resolution',evidenceHash:'57db9d60a97058dc08e2b0620c70cc74b7ec28967404ec3853c13f4c18ec6e10',sourceCount:2},
  {metricId:'DUPLICATE_ATTENDANCE_SESSIONS',entityKey:'وائل|2026-08-29',canonicalId:'AT-20260829-وائل-5167c552',supersededId:'AT-20260829-وائل-467e27ab',classification:'SUPERSEDED_LEGACY_DUPLICATE',reason:'Exact historical attendance duplicate resolution',evidenceHash:'03d7d68eeaa9006cdd364e9067f395eceb2c3814bcf53c9ea342c8f686120777',sourceCount:2},

  {metricId:'DUPLICATE_CLEANING_RECORDS',entityKey:'جابر|2026-08-24',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_DUPLICATE',reason:'Exact completed no-problem Cleaning baseline',evidenceHash:'480e8696d0415c096403eabd331f9884a37d6e44c769e1eeeec29760e984521f',sourceCount:3},
  {metricId:'DUPLICATE_CLEANING_RECORDS',entityKey:'جابر|2026-08-25',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_DUPLICATE',reason:'Exact completed no-problem Cleaning baseline',evidenceHash:'bb343ec2c3f76a04525bc7117ba781e3feb78395e9db402c5aa1ea84ac01cd75',sourceCount:2},
  {metricId:'DUPLICATE_CLEANING_RECORDS',entityKey:'جابر|2026-08-27',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_DUPLICATE',reason:'Exact completed no-problem Cleaning baseline',evidenceHash:'a208f9ea0d8b9f30d814c2ad9dbce5e25f53fc07726c7390a2eda24ea4f7521e',sourceCount:2},
  {metricId:'DUPLICATE_CLEANING_RECORDS',entityKey:'جابر|2026-08-31',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_DUPLICATE',reason:'Exact completed no-problem Cleaning baseline',evidenceHash:'3829ef52492543895a46c1fe44aa1daa6afcc26ce75033ba337d2473c3708936',sourceCount:3},
  {metricId:'DUPLICATE_CLEANING_RECORDS',entityKey:'ريفان|2026-08-25',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_DUPLICATE',reason:'Exact completed no-problem Cleaning baseline',evidenceHash:'eb339aac6d2674ad8476f77cfaab426d3ecd3e08a01e8513af741c090791358c',sourceCount:2},
  {metricId:'DUPLICATE_CLEANING_RECORDS',entityKey:'ريفان|2026-08-26',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_DUPLICATE',reason:'Exact completed no-problem Cleaning baseline',evidenceHash:'e8edf15a6e3679237da130420fa7f4854a42810ec412fcd7ef790b9cd4856d14',sourceCount:4},
  {metricId:'DUPLICATE_CLEANING_RECORDS',entityKey:'ريفان|2026-08-29',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_DUPLICATE',reason:'Exact completed no-problem Cleaning baseline',evidenceHash:'f5667740201782248319f677814bd29941fda0d2caecf16ec9e360244d398266',sourceCount:2},
  {metricId:'DUPLICATE_CLEANING_RECORDS',entityKey:'ريفان|2026-08-30',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_DUPLICATE',reason:'Exact completed no-problem Cleaning baseline',evidenceHash:'a614b1ec7eabd5af24923c934f9b97be87196d12b271745bb886aca216f15bf4',sourceCount:3},
  {metricId:'DUPLICATE_CLEANING_RECORDS',entityKey:'شريف|2026-08-27',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_DUPLICATE',reason:'Exact completed no-problem Cleaning baseline',evidenceHash:'6a6c19700c467ebb9beaa2c0371aaa8aaead7cb042bd3c9be4de2c013fd844fe',sourceCount:2},
  {metricId:'DUPLICATE_CLEANING_RECORDS',entityKey:'وائل|2026-08-27',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_DUPLICATE',reason:'Exact completed no-problem Cleaning baseline',evidenceHash:'03e0f3b719f949ec168e78a4a23a53f5ce9e42b1087193270b6996bdc82f57c7',sourceCount:2},
  {metricId:'DUPLICATE_CLEANING_RECORDS',entityKey:'وائل|2026-08-30',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_DUPLICATE',reason:'Exact completed no-problem Cleaning baseline',evidenceHash:'77d1107fe0ff056cf72804d56a207d701424a814b4d57fbdc4c0d45a4c0e1bbd',sourceCount:2},

  {metricId:'DUPLICATE_INVOICE_DRAFTS',entityKey:'3569',canonicalId:'DR-19c18636',supersededId:'DR-55d94661',classification:'SUPERSEDED_LEGACY_DUPLICATE',reason:'Exact zero-value unsent Draft supersession',evidenceHash:'06afbe9d9646aa151ce7f8c9bc6b1da57d4d0aafc5635784fed7c622de215023',sourceCount:2},
  {metricId:'DUPLICATE_INVOICE_DRAFTS',entityKey:'3572',canonicalId:'DR-69e8cb63',supersededId:'DR-fe3c766a',classification:'SUPERSEDED_LEGACY_DUPLICATE',reason:'Exact zero-value unsent Draft supersession',evidenceHash:'d496b057f5843f87b2c32cee86d53016e14a170706325820fdf0eb759d1c19d2',sourceCount:2},
  {metricId:'DUPLICATE_INVOICE_DRAFTS',entityKey:'3577',canonicalId:'DR-3466cb0d',supersededId:'DR-ceed6b65',classification:'SUPERSEDED_LEGACY_DUPLICATE',reason:'Exact zero-value unsent Draft supersession',evidenceHash:'d0913e2a85a73b2b391a2d2f04789f78d4b4b26412e9adeefe195c75297a3d77',sourceCount:2},

  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'3536-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'02ec63d746d1bda0f3d1505ac807c3e0baaeb3188c194ed0b5c24d8704796293',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'3585-02',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'d906acc860f8e45994ba102e0cc1bb72f2a3317be64cf19d14a76989116c462e',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'3628-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'f36248c431e6f9168117183b2614ee331148454238537eb5bb090e9a40f889f4',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'3669-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'114dfe7854f58d2e2e7189e9710fc1c633b6c21e82c0eacd00d8368701ea6c02',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'3756-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'adc3f9301511987db344f47250b457d0758fae98ef9a837d7f355477ae9b27b4',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'3758-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'1e02115a8fd0b85677e9a37e7be207bdb2bd9962e45204d005515316d1d456ee',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'3764-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'e8cd1fb469954d79b0a0c721f2662e0e18e34368e711bb4c2c81b6869576721c',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'3770-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'2cfc10ef93ed783ead009ca081446cad525c4796146880fc03e29be5785150c5',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'3774-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'649bd4c787469bed1f0d399bdaae90d447f7bc4710ebcf836f6dfba79e2841d9',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'3779-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'fe9113d092b3b08b7da1841c391da758171ebe32bb2a3e3f690e5ba59ac7963a',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'3788-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'f40677ba84dd6a798b2911244686ef05ea377226e69e87fe2cd2ed0ed810ddf6',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'TM2606140061-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'a1307eb5cad11cd39fdb0ad0305a681d840328f039a49e0273555078afff7459',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'TM2606160140-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'f25d77b63a029ae20c286f5f3290431b775ede52178fa783f2708b524022c65e',sourceCount:1},
  {metricId:'PRESS_COMPLETED_WITHOUT_SESSION',entityKey:'TM2606160181-01',canonicalId:'',supersededId:'',classification:'ACKNOWLEDGED_HISTORICAL_TRACEABILITY',reason:'Exact historical Press completion without Line-session evidence',evidenceHash:'f9de60d0a28f74686c49b12596f9136843b434a5e4135289c22433f2f91d7d05',sourceCount:1}
];}

function trendosCoreP0RegistryIdentityV1_(x){return[
  trendosRemediationTextV1_(x['Canonical ID']!==undefined?x['Canonical ID']:x.canonicalId),
  trendosRemediationTextV1_(x['Superseded ID']!==undefined?x['Superseded ID']:x.supersededId),
  trendosRemediationTextV1_(x.Classification!==undefined?x.Classification:x.classification)
].join('\u001f');}
function trendosCoreP0RegistryGroupKeyV1_(x){return trendosRemediationTextV1_(x.metricId||x['Metric ID']).toUpperCase()+'\u001f'+trendosRemediationTextV1_(x.entityKey||x['Entity Key']);}
function trendosCoreP0RegistryPlanHashV1_(){return trendosSha256HexV1_(trendosStableJsonV1_({
  version:TRENDOS_CORE_P0_REGISTRY_WRITER_VERSION_V1,
  headers:TRENDOS_INTEGRITY_RESOLUTION_HEADERS_V1,
  specs:trendosCoreP0RegistrySpecsV1_()
}));}
function trendosCoreP0RegistryDependenciesV1_(){
  const required=['trendosIntegrityEvidenceHashV1_','trendosIntegrityGroupEvidenceV1_','trendosIntegrityInvoiceDraftEvidenceV1_','trendosHealthSnapshotV1_','trendosHealthValV1_','trendosHealthDateV1_','trendosHealthLineIdV1_','trendosHealthPressFlagV1_','trendosHealthInvoiceDraftDtoV1_','trendosIntegrityFeatureStateV1_','trendosIntegrityResolutionV1_','trendosIntegrityResolutionRowsV1_','trendosSpreadsheetV1_','trendosWithLock_'];
  return required.filter(function(name){try{return typeof globalThis[name]!=='function';}catch(e){return true;}});
}
function trendosCoreP0RegistrySourceRowsV1_(metricId,entityKey,snap){
  if(metricId==='DUPLICATE_ATTENDANCE_SESSIONS')return(snap.attendance||[]).filter(function(r){
    const employee=trendosRemediationTextV1_(trendosHealthValV1_(r,['employee','الموظف']));
    const date=trendosHealthDateV1_(trendosHealthValV1_(r,['date','التاريخ']));return employee+'|'+date===entityKey;
  });
  if(metricId==='DUPLICATE_CLEANING_RECORDS')return(snap.cleaning||[]).filter(function(r){
    const employee=trendosRemediationTextV1_(trendosHealthValV1_(r,['employee','الموظف']));
    const date=trendosHealthDateV1_(trendosHealthValV1_(r,['date','التاريخ','تاريخ العمل']));return employee+'|'+date===entityKey;
  });
  if(metricId==='DUPLICATE_INVOICE_DRAFTS')return(snap.drafts||[]).filter(function(r){
    return trendosNormalizeOrderId_(trendosHealthValV1_(r,['orderId','رقم الأوردر','Order ID']))===entityKey;
  });
  if(metricId==='PRESS_COMPLETED_WITHOUT_SESSION')return(snap.lines||[]).filter(function(r){return trendosHealthLineIdV1_(r)===entityKey;});
  return[];
}
function trendosCoreP0RegistryEvidenceV1_(metricId,entityKey,rows){
  if(metricId==='DUPLICATE_INVOICE_DRAFTS')return trendosIntegrityInvoiceDraftEvidenceV1_(rows.map(trendosHealthInvoiceDraftDtoV1_));
  return trendosIntegrityGroupEvidenceV1_(metricId,entityKey,rows);
}
function trendosCoreP0RegistrySortedV1_(values){return(values||[]).map(trendosRemediationTextV1_).filter(Boolean).sort();}
function trendosCoreP0RegistrySameListV1_(a,b){return trendosStableJsonV1_(trendosCoreP0RegistrySortedV1_(a))===trendosStableJsonV1_(trendosCoreP0RegistrySortedV1_(b));}
function trendosCoreP0RegistryLivePlanV1_(snap){
  snap=snap||trendosHealthSnapshotV1_();const specs=trendosCoreP0RegistrySpecsV1_(),groups={},errors=[],items=[];
  specs.forEach(function(spec){const k=trendosCoreP0RegistryGroupKeyV1_(spec);(groups[k]||(groups[k]=[])).push(spec);});
  Object.keys(groups).forEach(function(k){
    const planned=groups[k],first=planned[0],rows=trendosCoreP0RegistrySourceRowsV1_(first.metricId,first.entityKey,snap);
    const evidence=trendosCoreP0RegistryEvidenceV1_(first.metricId,first.entityKey,rows),actualHash=trendosIntegrityEvidenceHashV1_(evidence);
    const expectedHashes=[...new Set(planned.map(function(x){return x.evidenceHash;}))];
    const groupErrors=[];
    if(expectedHashes.length!==1)groupErrors.push('plan contains multiple evidence hashes');
    if(rows.length!==first.sourceCount)groupErrors.push('source row count '+rows.length+' != '+first.sourceCount);
    if(expectedHashes[0]!==actualHash)groupErrors.push('live evidence hash mismatch');
    if(first.metricId==='DUPLICATE_ATTENDANCE_SESSIONS'){
      const ids=rows.map(function(r){return trendosHealthValV1_(r,['sessionId','معرف الجلسة']);});
      const expected=[first.canonicalId].concat(planned.map(function(x){return x.supersededId;}));
      if(!trendosCoreP0RegistrySameListV1_(ids,expected))groupErrors.push('attendance Session IDs do not match the exact plan');
    }
    if(first.metricId==='DUPLICATE_INVOICE_DRAFTS'){
      const ids=rows.map(function(r){return trendosHealthInvoiceDraftDtoV1_(r).draftId;});
      const expected=[first.canonicalId].concat(planned.map(function(x){return x.supersededId;}));
      if(!trendosCoreP0RegistrySameListV1_(ids,expected))groupErrors.push('invoice Draft IDs do not match the exact plan');
    }
    if(first.metricId==='PRESS_COMPLETED_WITHOUT_SESSION'){
      const sessionIds=(snap.pressSessionLineIds||[]).map(trendosRemediationTextV1_);
      if(sessionIds.indexOf(first.entityKey)!==-1)groupErrors.push('Line now has Press session evidence');
      rows.forEach(function(r){
        const status=trendosRemediationTextV1_(trendosHealthValV1_(r,['status','الحالة','Status']));
        if(!trendosHealthPressFlagV1_(r)||['تم التنفيذ','جاهز للاستلام','تم التسليم'].indexOf(status)===-1)groupErrors.push('Line is no longer an eligible Press completion');
      });
    }
    groupErrors.forEach(function(message){errors.push(first.metricId+' '+first.entityKey+': '+message);});
    planned.forEach(function(spec){items.push({spec:spec,evidence:evidence,actualHash:actualHash,valid:groupErrors.length===0,errors:groupErrors.slice()});});
  });
  return{success:errors.length===0,expectedCount:specs.length,items:items,errors:errors,snapshot:snap};
}
function trendosCoreP0RegistryPreviewV1(){
  const missing=trendosCoreP0RegistryDependenciesV1_(),planHash=trendosCoreP0RegistryPlanHashV1_();
  if(missing.length)return{success:false,readOnly:true,version:TRENDOS_CORE_P0_REGISTRY_WRITER_VERSION_V1,planHash:planHash,missing:missing};
  const live=trendosCoreP0RegistryLivePlanV1_();
  return{
    success:live.success,readOnly:true,version:TRENDOS_CORE_P0_REGISTRY_WRITER_VERSION_V1,planHash:planHash,
    expectedCount:TRENDOS_CORE_P0_REGISTRY_EXPECTED_ROWS_V1,actualPlanCount:live.items.length,errors:live.errors,
    writeApprovalProperty:TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1,
    rollbackApprovalProperty:TRENDOS_CORE_P0_REGISTRY_ROLLBACK_APPROVAL_PROP_V1,
    checks:live.items.map(function(x){return{metricId:x.spec.metricId,entityKey:x.spec.entityKey,expectedHash:x.spec.evidenceHash,actualHash:x.actualHash,valid:x.valid,errors:x.errors};})
  };
}
function trendosCoreP0RegistryFlagGuardV1_(){
  const state=trendosIntegrityFeatureStateV1_(),families=state&&state.families||{},business=['ORDER_LINE','ATTENDANCE_CLEANING','PRESS','INVOICE','WHATSAPP','OPS','AUTOMATION'];
  if(!state||!state.master||!families.HEALTH)throw new Error('Registry write requires Master+HEALTH ON.');
  const enabled=business.filter(function(k){return!!families[k];});if(enabled.length)throw new Error('Registry write requires all business families OFF: '+enabled.join(', '));
  const props=PropertiesService.getScriptProperties();
  if(trendosRemediationBoolV1_(props.getProperty('TRENDOS_FAST_AUTH_V25_ENABLED')))throw new Error('Registry write requires Fast Auth OFF.');
  return props;
}
function trendosCoreP0RegistryConsumeApprovalV1_(props,propertyName,planHash){
  const actual=trendosRemediationTextV1_(props.getProperty(propertyName));
  if(actual!==planHash)throw new Error('Missing or mismatched one-use registry approval: '+propertyName);
  props.deleteProperty(propertyName);
}
function trendosCoreP0RegistryActorV1_(){
  let actor='';try{actor=Session.getEffectiveUser().getEmail();}catch(e){}
  actor=trendosRemediationTextV1_(actor);if(!actor)throw new Error('Unable to resolve the effective approving user.');return actor;
}
function trendosCoreP0RegistryExactHeadersV1_(sh){
  if(!sh||sh.getLastRow()<1||sh.getLastColumn()!==TRENDOS_INTEGRITY_RESOLUTION_HEADERS_V1.length)return false;
  const actual=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(trendosRemediationTextV1_);
  return trendosStableJsonV1_(actual)===trendosStableJsonV1_(TRENDOS_INTEGRITY_RESOLUTION_HEADERS_V1);
}
function trendosCoreP0RegistrySheetV1_(create){
  const ss=trendosSpreadsheetV1_();let sh=ss.getSheetByName(TRENDOS_INTEGRITY_RESOLUTION_SHEET_V1);
  if(!sh&&create){sh=ss.insertSheet(TRENDOS_INTEGRITY_RESOLUTION_SHEET_V1);sh.getRange(1,1,1,TRENDOS_INTEGRITY_RESOLUTION_HEADERS_V1.length).setValues([TRENDOS_INTEGRITY_RESOLUTION_HEADERS_V1]);}
  if(sh&&!trendosCoreP0RegistryExactHeadersV1_(sh))throw new Error('TrendOS resolution registry must have the exact 10-header schema.');
  return sh;
}
function trendosCoreP0RegistryLatestByIdentityV1_(rows){
  const out={};(rows||[]).forEach(function(r,i){
    const key=trendosCoreP0RegistryGroupKeyV1_(r)+'\u001f'+trendosCoreP0RegistryIdentityV1_(r),n=Number(r.__rowNumber),order=isFinite(n)&&n>=2?n:i;
    if(!out[key]||order>out[key].order||(order===out[key].order&&i>out[key].index))out[key]={row:r,order:order,index:i};
  });return out;
}
function trendosCoreP0RegistryAppendV1_(sh,specs,active,actor,reasonOverride){
  if(!specs.length)return 0;const now=new Date(),rows=specs.map(function(spec){return[
    spec.metricId,spec.entityKey,spec.canonicalId,spec.supersededId,spec.classification,reasonOverride||spec.reason,
    spec.evidenceHash,now,actor,!!active
  ];});
  sh.getRange(sh.getLastRow()+1,1,rows.length,TRENDOS_INTEGRITY_RESOLUTION_HEADERS_V1.length).setValues(rows);return rows.length;
}
function trendosCoreP0RegistryPendingAppendsV1_(sh,specs){
  const rows=sh?trendosIntegrityResolutionRowsV1_():[],latest=trendosCoreP0RegistryLatestByIdentityV1_(rows),plannedByGroup={},pending=[],errors=[];
  specs.forEach(function(spec){const group=trendosCoreP0RegistryGroupKeyV1_(spec),id=trendosCoreP0RegistryIdentityV1_(spec);(plannedByGroup[group]||(plannedByGroup[group]={}))[id]=true;const found=latest[group+'\u001f'+id];
    if(!found){pending.push(spec);return;}
    const row=found.row;if(!trendosRemediationBoolV1_(row['Active?'])){errors.push(spec.metricId+' '+spec.entityKey+': exact mapping is explicitly inactive');return;}
    if(trendosRemediationTextV1_(row['Evidence Hash'])!==spec.evidenceHash)errors.push(spec.metricId+' '+spec.entityKey+': active mapping has a different evidence hash');
  });
  Object.keys(latest).forEach(function(k){const row=latest[k].row;if(!trendosRemediationBoolV1_(row['Active?']))return;const group=trendosCoreP0RegistryGroupKeyV1_(row),id=trendosCoreP0RegistryIdentityV1_(row);if(plannedByGroup[group]&&!plannedByGroup[group][id])errors.push(group.replace('\u001f',' ')+': unexpected active mapping exists');});
  return{pending:pending,errors:errors,rows:rows};
}
function trendosCoreP0RegistryVerifyActiveV1_(live){
  const rows=trendosIntegrityResolutionRowsV1_(),groups={},errors=[];(live.items||[]).forEach(function(item){const k=trendosCoreP0RegistryGroupKeyV1_(item.spec);(groups[k]||(groups[k]=[])).push(item);});
  Object.keys(groups).forEach(function(k){const items=groups[k],first=items[0],resolution=trendosIntegrityResolutionV1_(first.spec.metricId,first.spec.entityKey,first.evidence,rows);
    if(!resolution.resolved){errors.push(first.spec.metricId+' '+first.spec.entityKey+': registry did not resolve after append');return;}
    const expectedSuperseded=items.map(function(x){return x.spec.supersededId;});
    if(trendosRemediationTextV1_(resolution.canonicalId)!==first.spec.canonicalId||!trendosCoreP0RegistrySameListV1_(resolution.supersededIds,expectedSuperseded))errors.push(first.spec.metricId+' '+first.spec.entityKey+': resolved IDs do not match the exact plan');
  });return errors;
}
function trendosCoreP0RegistryWriteV1(){return trendosWithLock_('script',function(){
  const props=trendosCoreP0RegistryFlagGuardV1_(),planHash=trendosCoreP0RegistryPlanHashV1_();trendosCoreP0RegistryConsumeApprovalV1_(props,TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1,planHash);
  const missing=trendosCoreP0RegistryDependenciesV1_();if(missing.length)throw new Error('Registry writer dependencies missing: '+missing.join(', '));
  const live=trendosCoreP0RegistryLivePlanV1_();if(!live.success||live.items.length!==TRENDOS_CORE_P0_REGISTRY_EXPECTED_ROWS_V1)throw new Error('Registry live preflight failed: '+live.errors.join(' | '));
  const existing=trendosCoreP0RegistrySheetV1_(false),check=trendosCoreP0RegistryPendingAppendsV1_(existing,trendosCoreP0RegistrySpecsV1_());if(check.errors.length)throw new Error('Registry existing-state check failed: '+check.errors.join(' | '));
  const actor=trendosCoreP0RegistryActorV1_(),sh=existing||trendosCoreP0RegistrySheetV1_(true),appended=trendosCoreP0RegistryAppendV1_(sh,check.pending,true,actor,'');
  try{
    if(typeof SpreadsheetApp!=='undefined'&&SpreadsheetApp.flush)SpreadsheetApp.flush();
    const after=trendosCoreP0RegistryLivePlanV1_(),verifyErrors=after.success?trendosCoreP0RegistryVerifyActiveV1_(after):after.errors.slice();
    if(!after.success||verifyErrors.length)throw new Error(verifyErrors.join(' | ')||'unknown post-write verification error');
  }catch(postError){
    let rollbackStatus='no new mappings required rollback';
    if(check.pending.length){
      try{trendosCoreP0RegistryAppendV1_(sh,check.pending,false,actor,'AUTO_ROLLBACK: post-write evidence or registry verification failed');if(typeof SpreadsheetApp!=='undefined'&&SpreadsheetApp.flush)SpreadsheetApp.flush();rollbackStatus='appended mappings were deactivated';}
      catch(rollbackError){rollbackStatus='automatic deactivation failed: '+trendosRemediationTextV1_(rollbackError&&rollbackError.message||rollbackError);}
    }
    throw new Error('Registry post-write verification failed; '+rollbackStatus+': '+trendosRemediationTextV1_(postError&&postError.message||postError));
  }
  return{success:true,version:TRENDOS_CORE_P0_REGISTRY_WRITER_VERSION_V1,planHash:planHash,expectedCount:TRENDOS_CORE_P0_REGISTRY_EXPECTED_ROWS_V1,appended:appended,alreadyPresent:TRENDOS_CORE_P0_REGISTRY_EXPECTED_ROWS_V1-appended,totalRegistryRows:sh.getLastRow()-1,sourceSheetsMutated:false};
},30000);}
function trendosCoreP0RegistryRollbackV1(){return trendosWithLock_('script',function(){
  const props=trendosCoreP0RegistryFlagGuardV1_(),planHash=trendosCoreP0RegistryPlanHashV1_();trendosCoreP0RegistryConsumeApprovalV1_(props,TRENDOS_CORE_P0_REGISTRY_ROLLBACK_APPROVAL_PROP_V1,planHash);
  const sh=trendosCoreP0RegistrySheetV1_(false);if(!sh)return{success:true,alreadyInactive:true,appended:0,planHash:planHash};
  const specs=trendosCoreP0RegistrySpecsV1_(),latest=trendosCoreP0RegistryLatestByIdentityV1_(trendosIntegrityResolutionRowsV1_()),active=specs.filter(function(spec){const found=latest[trendosCoreP0RegistryGroupKeyV1_(spec)+'\u001f'+trendosCoreP0RegistryIdentityV1_(spec)];return!!(found&&trendosRemediationBoolV1_(found.row['Active?']));});
  const actor=trendosCoreP0RegistryActorV1_(),appended=trendosCoreP0RegistryAppendV1_(sh,active,false,actor,'APPROVED_ROLLBACK: deactivate exact CORE-P0 registry mapping');if(typeof SpreadsheetApp!=='undefined'&&SpreadsheetApp.flush)SpreadsheetApp.flush();
  const after=trendosCoreP0RegistryLatestByIdentityV1_(trendosIntegrityResolutionRowsV1_()),stillActive=specs.filter(function(spec){const found=after[trendosCoreP0RegistryGroupKeyV1_(spec)+'\u001f'+trendosCoreP0RegistryIdentityV1_(spec)];return!!(found&&trendosRemediationBoolV1_(found.row['Active?']));});
  if(stillActive.length)throw new Error('Registry rollback verification failed for '+stillActive.length+' exact mappings.');
  return{success:true,version:TRENDOS_CORE_P0_REGISTRY_WRITER_VERSION_V1,planHash:planHash,appended:appended,alreadyInactive:active.length===0,totalRegistryRows:sh.getLastRow()-1,sourceSheetsMutated:false};
},30000);}
