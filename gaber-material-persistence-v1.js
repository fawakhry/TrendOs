/*
 * TrendOS — Gaber Material Persistence Contract V1
 * PURE / STORE-INDEPENDENT / ZERO EXTERNAL WRITES.
 *
 * Converts validated movement events into deterministic append-only persistence
 * records. A concrete store may append the returned records in one atomic batch.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.TrendOSGaberMaterialPersistenceV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='GABER_MATERIAL_PERSISTENCE_V1_20260910';

  function text(v){return String(v==null?'':v).trim();}
  function round(n,p=10){const m=Math.pow(10,p);return Math.round((Number(n)||0)*m)/m;}
  function canonical(v){
    if(Array.isArray(v))return v.map(canonical);
    if(v&&typeof v==='object'){const out={};Object.keys(v).sort().forEach(k=>{if(v[k]!==undefined)out[k]=canonical(v[k]);});return out;}
    if(typeof v==='number')return Number.isFinite(v)?round(v):null;
    return v;
  }
  function stableStringify(v){return JSON.stringify(canonical(v));}
  function hash(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(16).padStart(8,'0');}
  function fingerprint(v){const body=stableStringify(v);return 'GMP1-'+hash(body)+'-'+body.length.toString(36);}
  function blocker(code,extra){return Object.assign({code},extra||{});}

  function recordPayload(raw){
    if(raw&&raw.payload&&typeof raw.payload==='object')return raw.payload;
    const json=text(raw&& (raw.payloadJson||raw.eventJson||raw.json));
    if(!json)return null;
    try{return JSON.parse(json);}catch(e){return null;}
  }

  function decodeExistingRecords(records,ledgerApi){
    records=Array.isArray(records)?records:[];
    const events=[],blockers=[],seenRecords=new Set();
    records.forEach((raw,index)=>{
      const recordId=text(raw&&raw.recordId),eventId=text(raw&&raw.eventId);
      if(!recordId){blockers.push(blocker('PERSISTENCE_RECORD_ID_REQUIRED',{recordIndex:index,eventId}));return;}
      if(seenRecords.has(recordId)){blockers.push(blocker('PERSISTENCE_RECORD_ID_DUPLICATE',{recordIndex:index,recordId}));return;}
      seenRecords.add(recordId);
      const payload=recordPayload(raw);
      if(!payload){blockers.push(blocker('PERSISTENCE_PAYLOAD_INVALID',{recordIndex:index,recordId,eventId}));return;}
      if(eventId&&text(payload.eventId)!==eventId){blockers.push(blocker('PERSISTENCE_EVENT_ID_MISMATCH',{recordIndex:index,recordId,eventId,payloadEventId:text(payload.eventId)}));return;}
      if(!ledgerApi||typeof ledgerApi.validateEvent!=='function'){
        blockers.push(blocker('MOVEMENT_LEDGER_DEPENDENCY_MISSING'));return;
      }
      const valid=ledgerApi.validateEvent(payload);
      if(!valid||valid.valid!==true){blockers.push(blocker('PERSISTED_MOVEMENT_INVALID',{recordIndex:index,recordId,eventId:text(payload.eventId),details:valid&&valid.blockers||[]}));return;}
      const storedFingerprint=text(raw&&raw.eventFingerprint);
      if(storedFingerprint&&storedFingerprint!==valid.eventFingerprint){
        blockers.push(blocker('PERSISTENCE_FINGERPRINT_MISMATCH',{recordIndex:index,recordId,eventId:valid.event.eventId}));return;
      }
      events.push(valid.event);
    });
    return canonical({events,blockers,valid:blockers.length===0});
  }

  function makeTransactionIdentity(meta,incomingEvents,ledgerApi){
    meta=meta||{};
    const taskId=text(meta.taskId),orderId=text(meta.orderId),lineId=text(meta.lineId),decisionFingerprint=text(meta.decisionFingerprint);
    const scope={taskId,orderId,lineId,decisionFingerprint,eventIds:(incomingEvents||[]).map(e=>text(e&&e.eventId)).sort()};
    const txFingerprint=fingerprint(scope);
    const transactionId=text(meta.transactionId)||('GMTX-'+hash(stableStringify(scope)));
    const materialCloseId=text(meta.materialCloseId)||('GMC-'+hash(stableStringify({taskId,orderId,lineId,decisionFingerprint})));
    return {transactionId,materialCloseId,transactionFingerprint:txFingerprint};
  }

  function prepareAppendTransaction(existingRecords,incomingEvents,ledgerApi,meta){
    incomingEvents=Array.isArray(incomingEvents)?incomingEvents:[];
    meta=meta||{};
    const blockers=[];
    if(!ledgerApi||typeof ledgerApi.buildAppendPlan!=='function'||typeof ledgerApi.validateEvent!=='function'){
      return canonical({version:VERSION,canCommit:false,blockers:[blocker('MOVEMENT_LEDGER_DEPENDENCY_MISSING')],records:[],replayedEventIds:[]});
    }
    if(!text(meta.taskId))blockers.push(blocker('PERSISTENCE_TASK_ID_REQUIRED'));
    if(!text(meta.orderId))blockers.push(blocker('PERSISTENCE_ORDER_ID_REQUIRED'));
    if(!text(meta.lineId))blockers.push(blocker('PERSISTENCE_LINE_ID_REQUIRED'));
    if(!text(meta.decisionFingerprint))blockers.push(blocker('PERSISTENCE_DECISION_FINGERPRINT_REQUIRED'));
    if(!incomingEvents.length)blockers.push(blocker('PERSISTENCE_MOVEMENT_EVENTS_REQUIRED'));

    const decoded=decodeExistingRecords(existingRecords,ledgerApi);
    decoded.blockers.forEach(b=>blockers.push(b));
    if(blockers.length)return canonical({version:VERSION,canCommit:false,blockers,records:[],replayedEventIds:[]});

    const plan=ledgerApi.buildAppendPlan(decoded.events,incomingEvents);
    if(!plan||plan.canCommit!==true){
      return canonical({version:VERSION,canCommit:false,blockers:(plan&&plan.blockers)||[blocker('MOVEMENT_APPEND_PLAN_INVALID')],records:[],replayedEventIds:[]});
    }

    const identity=makeTransactionIdentity(meta,incomingEvents,ledgerApi);
    const createdAt=text(meta.createdAt);
    const records=(plan.acceptedEvents||[]).map(function(event){
      const valid=ledgerApi.validateEvent(event);
      const payload=valid.event;
      return canonical({
        recordId:'GMR-'+hash(payload.eventId+'|'+valid.eventFingerprint),
        transactionId:identity.transactionId,
        transactionFingerprint:identity.transactionFingerprint,
        materialCloseId:identity.materialCloseId,
        eventId:payload.eventId,
        eventFingerprint:valid.eventFingerprint,
        workDate:payload.workDate,
        department:payload.department,
        type:payload.type,
        materialId:payload.materialId,
        taskId:payload.taskId,
        orderId:payload.orderId,
        lineId:payload.lineId,
        purchaseId:payload.purchaseId,
        wasteId:payload.wasteId,
        sourceRef:payload.sourceRef,
        createdAt,
        payloadJson:stableStringify(payload)
      });
    });

    const allReplay=records.length===0&&(plan.replayedEventIds||[]).length===incomingEvents.length;
    return canonical({
      version:VERSION,canCommit:true,isReplay:allReplay,
      transactionId:identity.transactionId,transactionFingerprint:identity.transactionFingerprint,
      materialCloseId:identity.materialCloseId,
      records,replayedEventIds:plan.replayedEventIds||[],blockers:[],
      appendCount:records.length
    });
  }

  return {VERSION,decodeExistingRecords,prepareAppendTransaction,stableStringify,fingerprint,_pure:{recordPayload,makeTransactionIdentity}};
});