/*
 * TrendOS — Gaber Material Control UI V1
 * GITHUB CANDIDATE ONLY / NO DIRECT BUSINESS WRITES.
 *
 * Browser bridge for Operator Task V2. Server remains authoritative for
 * Task identity, material identity/cost, purchase facts and waste approval.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.TrendOSGaberMaterialUiV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='GABER_MATERIAL_UI_V1_20260911';
  const ABNORMAL=new Set(['MATERIAL_DEFECT','MACHINE_FAULT','SETUP_ERROR','WRONG_SIZE','OPERATOR_ERROR','DESIGN_OR_FILE_ERROR','REWORK','OTHER']);
  const REASONS=[
    ['NORMAL_CUT_LOSS','هالك قص طبيعي'],['MATERIAL_DEFECT','عيب في الخامة'],['MACHINE_FAULT','عطل ماكينة'],
    ['SETUP_ERROR','خطأ تجهيز'],['WRONG_SIZE','مقاس خطأ'],['OPERATOR_ERROR','خطأ تشغيل'],
    ['DESIGN_OR_FILE_ERROR','ملف/تصميم خطأ'],['REWORK','إعادة شغل'],['OTHER','أخرى']
  ];
  const states=Object.create(null),mounts=Object.create(null);

  function text(v){return String(v==null?'':v).trim();}
  function num(v){if(v===''||v==null)return null;const n=Number(v);return Number.isFinite(n)?n:null;}
  function nonNegative(v){const n=num(v);return n!=null&&n>=0?n:null;}
  function round(n,p=8){const m=Math.pow(10,p);return Math.round((Number(n)||0)*m)/m;}
  function esc(v){return text(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function dateKey(v){const s=text(v);if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);const d=new Date(v);return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):'';}
  function taskKey(task){return text(task&&task.taskId);}
  function blankMaterial(){return {materialId:'',issuedQty:0,consumedQty:0,returnedQty:0,offcutQty:0,wasteQty:0,wasteId:'',reasonCode:'NORMAL_CUT_LOSS',evidenceRef:''};}
  function makeWasteId(taskId,materialId,index){return 'GW-'+text(taskId).replace(/[^\w-]/g,'')+'-'+text(materialId).replace(/[^\w-]/g,'')+'-'+String(index+1);}

  function createState(task,bootstrap){
    task=task||{};bootstrap=bootstrap||{};
    const k=taskKey(task);if(!k)throw new Error('Task ID مطلوب لواجهة الخامات.');
    const existing=states[k];if(existing)return existing;
    const s={taskId:k,orderId:text(task.orderId),lineId:text(task.lineId),workDate:dateKey(task.startedAt)||dateKey(new Date()),purchaseDeclaration:'NO_PURCHASE',purchaseIds:[],materials:[blankMaterial()],catalog:Array.isArray(bootstrap.materials)?bootstrap.materials:[],purchases:Array.isArray(bootstrap.purchases)?bootstrap.purchases:[],serverClose:bootstrap.persistedClose||null};
    states[k]=s;return s;
  }

  function normalizeMaterialRow(raw,index,taskId){
    raw=raw||{};const wasteQty=nonNegative(raw.wasteQty),materialId=text(raw.materialId);
    return {
      materialId:materialId,
      issuedQty:nonNegative(raw.issuedQty),consumedQty:nonNegative(raw.consumedQty),returnedQty:nonNegative(raw.returnedQty),offcutQty:nonNegative(raw.offcutQty),wasteQty:wasteQty,
      wasteId:wasteQty>0?(text(raw.wasteId)||makeWasteId(taskId,materialId,index)):'',
      reasonCode:wasteQty>0?text(raw.reasonCode||'NORMAL_CUT_LOSS').toUpperCase():'',
      evidenceRef:wasteQty>0?text(raw.evidenceRef):''
    };
  }

  function validateState(state){
    state=state||{};const errors=[];
    const mats=(Array.isArray(state.materials)?state.materials:[]).map((m,i)=>normalizeMaterialRow(m,i,state.taskId));
    if(!state.taskId||!state.orderId||!state.lineId)errors.push('هوية التاسك غير مكتملة.');
    if(!mats.length)errors.push('أضف خامة واحدة على الأقل.');
    const seen=new Set();
    mats.forEach((m,i)=>{
      if(!m.materialId)errors.push('اختر الخامة في السطر '+(i+1)+'.');
      if(m.materialId&&seen.has(m.materialId))errors.push('الخامة مكررة في أكثر من سطر.');seen.add(m.materialId);
      ['issuedQty','consumedQty','returnedQty','offcutQty','wasteQty'].forEach(k=>{if(m[k]==null)errors.push('كمية غير صحيحة في السطر '+(i+1)+'.');});
      if(m.issuedQty!=null&&m.consumedQty!=null&&m.returnedQty!=null&&m.offcutQty!=null&&m.wasteQty!=null){
        const accounted=round(m.consumedQty+m.returnedQty+m.offcutQty+m.wasteQty);if(Math.abs(m.issuedQty-accounted)>1e-6)errors.push('السطر '+(i+1)+': المستلم لازم يساوي الخارج + المرتجع + البواقي + التالف.');
      }
      if((m.wasteQty||0)>0){if(!m.reasonCode)errors.push('سبب التالف مطلوب في السطر '+(i+1)+'.');if(ABNORMAL.has(m.reasonCode)&&!m.evidenceRef)errors.push('مرجع/صورة إثبات التالف غير الطبيعي مطلوبة في السطر '+(i+1)+'.');}
    });
    const dec=text(state.purchaseDeclaration).toUpperCase();
    if(dec!=='NO_PURCHASE'&&dec!=='PURCHASE_RECORDED')errors.push('حدد هل حصل شراء أثناء التاسك أم لا.');
    if(dec==='PURCHASE_RECORDED'&&!(state.purchaseIds||[]).length)errors.push('اختر فاتورة/مشتريات EasyStore الفعلية.');
    return {valid:errors.length===0,errors,materials:mats};
  }

  function serializeState(state){
    const v=validateState(state);if(!v.valid){const e=new Error(v.errors.join('\n'));e.validationErrors=v.errors;throw e;}
    const wastes=[];v.materials.forEach(m=>{if((m.wasteQty||0)>0)wastes.push({wasteId:m.wasteId,materialId:m.materialId,qty:m.wasteQty,reasonCode:m.reasonCode,evidenceRef:m.evidenceRef});});
    return {taskId:text(state.taskId),orderId:text(state.orderId),lineId:text(state.lineId),workDate:text(state.workDate),purchaseDeclaration:text(state.purchaseDeclaration).toUpperCase(),purchases:(state.purchaseIds||[]).map(id=>({purchaseId:text(id)})),materials:v.materials.map(m=>({materialId:m.materialId,issuedQty:m.issuedQty,consumedQty:m.consumedQty,returnedQty:m.returnedQty,offcutQty:m.offcutQty,wasteQty:m.wasteQty})),wastes};
  }

  function wasteRequests(state){
    const payload=serializeState(state),out=[];payload.wastes.forEach(w=>{if(!ABNORMAL.has(text(w.reasonCode).toUpperCase()))return;out.push({taskId:payload.taskId,orderId:payload.orderId,lineId:payload.lineId,materialId:w.materialId,wasteId:w.wasteId,qty:w.qty,reasonCode:w.reasonCode,evidenceRef:w.evidenceRef});});return out;
  }

  function reasonOptions(selected){return REASONS.map(x=>'<option value="'+x[0]+'"'+(x[0]===selected?' selected':'')+'>'+esc(x[1])+'</option>').join('');}
  function materialOptions(state,selected){return '<option value="">اختر الخامة</option>'+state.catalog.map(x=>'<option value="'+esc(x.materialId)+'"'+(text(x.materialId)===text(selected)?' selected':'')+'>'+esc(x.materialName||x.name||x.materialId)+' — '+esc(x.unit||'')+(x.unitCost!=null?' — تكلفة '+esc(x.unitCost):'')+'</option>').join('');}
  function purchaseOptions(state){if(!state.purchases.length)return '<div style="font-size:12px;color:#856404">لا توجد مشتريات مخزون فعالة متاحة لهذا اليوم.</div>';return state.purchases.map(p=>'<label style="display:block;margin:5px 0"><input type="checkbox" data-gm-purchase="'+esc(p.purchaseId)+'" '+(state.purchaseIds.indexOf(text(p.purchaseId))!==-1?'checked':'')+'> '+esc(p.purchaseId)+' — '+esc(p.materialName||p.material||'')+' — '+esc(p.stockAppliedQty||p.qty||'')+' '+esc(p.unit||'')+' — '+esc(p.supplier||'')+'</label>').join('');}
  function rowHtml(state,m,i){
    const w=(Number(m.wasteQty)||0)>0;
    return '<div data-gm-row="'+i+'" style="border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin:8px 0;background:#fbfdff">'+
      '<div style="display:grid;grid-template-columns:minmax(180px,2fr) repeat(5,minmax(80px,1fr));gap:7px;align-items:end">'+
      '<label>الخامة<select data-gm-field="materialId" style="width:100%">'+materialOptions(state,m.materialId)+'</select></label>'+
      '<label>المستلم<input data-gm-field="issuedQty" type="number" step="any" min="0" value="'+esc(m.issuedQty)+'" style="width:100%"></label>'+
      '<label>خارج أوردر<input data-gm-field="consumedQty" type="number" step="any" min="0" value="'+esc(m.consumedQty)+'" style="width:100%"></label>'+
      '<label>مرتجع<input data-gm-field="returnedQty" type="number" step="any" min="0" value="'+esc(m.returnedQty)+'" style="width:100%"></label>'+
      '<label>بواقي قابلة<input data-gm-field="offcutQty" type="number" step="any" min="0" value="'+esc(m.offcutQty)+'" style="width:100%"></label>'+
      '<label>تالف<input data-gm-field="wasteQty" type="number" step="any" min="0" value="'+esc(m.wasteQty)+'" style="width:100%"></label></div>'+
      '<div data-gm-waste-box style="display:'+(w?'grid':'none')+';grid-template-columns:1fr 1fr 2fr;gap:7px;margin-top:8px"><label>Waste ID<input data-gm-field="wasteId" value="'+esc(m.wasteId)+'" placeholder="يتولد تلقائيًا"></label><label>سبب التالف<select data-gm-field="reasonCode">'+reasonOptions(text(m.reasonCode||'NORMAL_CUT_LOSS').toUpperCase())+'</select></label><label>مرجع الإثبات<input data-gm-field="evidenceRef" value="'+esc(m.evidenceRef)+'" placeholder="رقم صورة/ملف/مرجع"></label></div>'+
      '<div style="text-align:left;margin-top:7px"><button type="button" data-gm-action="removeRow" data-index="'+i+'" class="ghost">حذف السطر</button></div></div>';
  }

  function taskHtml(state){
    return '<div style="margin-top:12px;border:1px solid #9bd3c7;border-radius:12px;padding:11px;background:#f7fffc" data-gm-root="'+esc(state.taskId)+'">'+
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div><b>🧾 قفلة خامات الليزر</b><div style="font-size:11px;color:#60756f">التكلفة من EasyStore فقط — لا تكتب تكلفة يدويًا.</div></div><button type="button" data-gm-action="addRow" class="ghost">+ خامة</button></div>'+
      '<div data-gm-rows>'+state.materials.map((m,i)=>rowHtml(state,m,i)).join('')+'</div>'+
      '<div style="margin-top:10px;padding:9px;border:1px solid #d8e2ec;border-radius:9px"><b>هل حصل شراء خامة أثناء التاسك؟</b><label style="margin-right:10px"><input type="radio" name="gm-purchase-'+esc(state.taskId)+'" value="NO_PURCHASE" data-gm-declaration '+(state.purchaseDeclaration==='NO_PURCHASE'?'checked':'')+'> لا</label><label style="margin-right:10px"><input type="radio" name="gm-purchase-'+esc(state.taskId)+'" value="PURCHASE_RECORDED" data-gm-declaration '+(state.purchaseDeclaration==='PURCHASE_RECORDED'?'checked':'')+'> نعم</label><div data-gm-purchases style="margin-top:7px;display:'+(state.purchaseDeclaration==='PURCHASE_RECORDED'?'block':'none')+'">'+purchaseOptions(state)+'</div></div>'+
      '<div data-gm-errors style="display:none;margin-top:8px;padding:8px;border-radius:8px;background:#fff0f0;color:#9b1c1c;font-size:12px"></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px"><button type="button" data-gm-action="validate" class="ghost">راجع القفلة</button><button type="button" data-gm-action="requestWaste" class="ghost">طلب اعتماد التالف غير الطبيعي</button></div></div>';
  }

  function syncFromDom(taskId){
    const m=mounts[taskId],state=states[taskId];if(!m||!state)return state;const root=m.container.querySelector('[data-gm-root]');if(!root)return state;
    const rows=[];root.querySelectorAll('[data-gm-row]').forEach((el,i)=>{const r={};el.querySelectorAll('[data-gm-field]').forEach(inp=>{const k=inp.getAttribute('data-gm-field');r[k]=['issuedQty','consumedQty','returnedQty','offcutQty','wasteQty'].includes(k)?inp.value:inp.value;});rows.push(normalizeMaterialRow(r,i,taskId));});state.materials=rows;
    const dec=root.querySelector('[data-gm-declaration]:checked');state.purchaseDeclaration=dec?dec.value:'NO_PURCHASE';state.purchaseIds=Array.from(root.querySelectorAll('[data-gm-purchase]:checked')).map(x=>x.getAttribute('data-gm-purchase'));return state;
  }
  function showErrors(taskId,errors){const m=mounts[taskId];if(!m)return;const el=m.container.querySelector('[data-gm-errors]');if(!el)return;if(!errors||!errors.length){el.style.display='none';el.textContent='';return;}el.style.display='block';el.innerHTML=errors.map(x=>'• '+esc(x)).join('<br>');}
  function rerender(taskId){const m=mounts[taskId],s=states[taskId];if(!m||!s)return;m.container.innerHTML=taskHtml(s);bindTask(taskId);}
  function bindTask(taskId){
    const m=mounts[taskId];if(!m)return;const c=m.container;
    c.oninput=function(e){const row=e.target&&e.target.closest&&e.target.closest('[data-gm-row]');if(row&&e.target.getAttribute('data-gm-field')==='wasteQty'){const box=row.querySelector('[data-gm-waste-box]');if(box)box.style.display=Number(e.target.value)>0?'grid':'none';}};
    c.onchange=function(e){if(e.target&&e.target.hasAttribute('data-gm-declaration')){syncFromDom(taskId);rerender(taskId);}};
    c.onclick=async function(e){const b=e.target&&e.target.closest?e.target.closest('[data-gm-action]'):null;if(!b)return;const a=b.getAttribute('data-gm-action');syncFromDom(taskId);const s=states[taskId];
      if(a==='addRow'){s.materials.push(blankMaterial());rerender(taskId);return;}
      if(a==='removeRow'){const i=Number(b.getAttribute('data-index'));if(s.materials.length>1)s.materials.splice(i,1);else s.materials=[blankMaterial()];rerender(taskId);return;}
      if(a==='validate'){const v=validateState(s);showErrors(taskId,v.errors);if(v.valid&&typeof alert==='function')alert('قفلة الخامات متوازنة مبدئيًا. السيرفر سيعيد التحقق عند الإنهاء.');return;}
      if(a==='requestWaste'){const v=validateState(s);if(!v.valid){showErrors(taskId,v.errors);return;}const reqs=wasteRequests(s);if(!reqs.length){if(typeof alert==='function')alert('لا يوجد تالف غير طبيعي يحتاج طلب اعتماد.');return;}if(typeof m.api!=='function')return;try{for(const r of reqs){const d=await m.api('gaberMaterialRequestWaste',{taskId:s.taskId,requestJson:JSON.stringify(r)});if(!d||!d.success)throw new Error(d&&d.message||'تعذر تسجيل طلب اعتماد التالف.');}if(typeof alert==='function')alert('تم إرسال طلب/طلبات اعتماد التالف للإدارة.');}catch(err){if(typeof alert==='function')alert(text(err&&err.message||err));}}
    };
  }

  function mountTask(container,opts){opts=opts||{};if(!container||!opts.task)return null;const s=createState(opts.task,opts.bootstrap||{});s.catalog=Array.isArray(opts.bootstrap&&opts.bootstrap.materials)?opts.bootstrap.materials:s.catalog;s.purchases=Array.isArray(opts.bootstrap&&opts.bootstrap.purchases)?opts.bootstrap.purchases:s.purchases;mounts[s.taskId]={container,api:opts.api};container.innerHTML=taskHtml(s);bindTask(s.taskId);return s;}
  function getPayload(task){const k=taskKey(task),s=syncFromDom(k)||states[k];if(!s)throw new Error('واجهة قفلة الخامات غير جاهزة.');return serializeState(s);}

  function reportTable(report){const rows=Array.isArray(report&&report.rows)?report.rows:[];return '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th>الخامة</th><th>أول اليوم</th><th>مشتريات</th><th>خوارج أوردر</th><th>تالف</th><th>مرتجع</th><th>بواقي</th><th>صافي</th><th>متوقع</th><th>فعلي</th><th>فرق</th><th>تكلفة استهلاك</th><th>تكلفة تالف</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.name||r.materialId)+'</td><td>'+esc(r.openingQty==null?'—':r.openingQty)+'</td><td>'+esc(r.purchasedQty)+'</td><td title="'+esc((r.orderOutRefs||[]).map(x=>'O '+x.orderId+' / '+x.lineId+' / '+x.qty).join(' | '))+'">'+esc(r.orderOutQty)+'</td><td>'+esc(r.wasteQty)+'</td><td>'+esc(r.returnedQty)+'</td><td>'+esc(r.offcutQty)+'</td><td>'+esc(r.dailyNetMovement)+'</td><td>'+esc(r.expectedClosingQty==null?'—':r.expectedClosingQty)+'</td><td>'+esc(r.actualClosingQty==null?'—':r.actualClosingQty)+'</td><td>'+esc(r.varianceQty==null?'—':r.varianceQty)+'</td><td>'+esc(r.goodConsumptionCost)+'</td><td>'+esc(r.wasteCost)+'</td></tr>').join('')+'</tbody></table></div>'+(report&&report.blockers&&report.blockers.length?'<div style="margin-top:7px;color:#9b1c1c">Blockers: '+esc(report.blockers.map(x=>x.code).join(', '))+'</div>':'');}
  function pendingTable(items){items=Array.isArray(items)?items:[];if(!items.length)return '<div style="padding:8px;color:#66788a">لا توجد طلبات اعتماد تالف معلقة.</div>';return items.map(x=>'<div style="border:1px solid #ead6a5;border-radius:8px;padding:8px;margin:6px 0" data-gm-pending="'+esc(x.requestId)+'"><b>'+esc(x.materialName||x.materialId)+' — '+esc(x.qty)+'</b><div style="font-size:11px">أوردر '+esc(x.orderId)+' / بند '+esc(x.lineId)+' / '+esc(x.reasonCode)+' / منفذ '+esc(x.operator)+'</div><div style="display:flex;gap:6px;margin-top:6px"><button data-gm-decision="APPROVED">اعتماد</button><button data-gm-decision="REJECTED" class="ghost">رفض</button></div></div>').join('');}
  async function mountManager(container,opts){opts=opts||{};if(!container||typeof opts.api!=='function')return;container.innerHTML='<div style="margin-top:12px;border:1px solid #d8e2ec;border-radius:12px;padding:10px"><b>📦 رقابة خامات الليزر</b><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px"><button data-gm-manager="pending" class="ghost">طلبات اعتماد التالف</button><button data-gm-manager="report" class="ghost">تقرير خامات اليوم</button></div><div data-gm-manager-body style="margin-top:9px"></div></div>';const body=container.querySelector('[data-gm-manager-body]');
    container.onclick=async function(e){const b=e.target&&e.target.closest?e.target.closest('[data-gm-manager],[data-gm-decision]'):null;if(!b)return;try{
      if(b.hasAttribute('data-gm-manager')){const a=b.getAttribute('data-gm-manager');if(a==='pending'){const d=await opts.api('gaberMaterialPendingWaste',{});if(!d||!d.success)throw new Error(d&&d.message||'تعذر تحميل الطلبات.');body.innerHTML=pendingTable(d.items);return;}if(a==='report'){const d=await opts.api('gaberMaterialDailyReport',{workDate:dateKey(new Date())});if(!d||!d.success)throw new Error(d&&d.message||'تعذر تحميل التقرير.');body.innerHTML=reportTable(d.report);return;}}
      if(b.hasAttribute('data-gm-decision')){const card=b.closest('[data-gm-pending]'),id=card&&card.getAttribute('data-gm-pending');const decision=b.getAttribute('data-gm-decision');const d=await opts.api('gaberMaterialWasteDecision',{requestId:id,decision:decision,reason:decision==='APPROVED'?'اعتماد إدارة':'رفض إدارة'});if(!d||!d.success)throw new Error(d&&d.message||'تعذر حفظ القرار.');const q=await opts.api('gaberMaterialPendingWaste',{});body.innerHTML=pendingTable(q.items);}
    }catch(err){body.innerHTML='<div style="color:#9b1c1c">'+esc(err&&err.message||err)+'</div>';}};
  }

  return {VERSION,ABNORMAL_REASONS:Array.from(ABNORMAL),createState,validateState,serializeState,wasteRequests,mountTask,getPayload,mountManager,_state:states};
});
