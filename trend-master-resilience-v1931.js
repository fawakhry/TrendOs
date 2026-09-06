(function(){
  'use strict';
  if (window.__TREND_MASTER_RESILIENCE_V1931__) return;
  window.__TREND_MASTER_RESILIENCE_V1931__ = true;
  if (window.MATBAGY_TREND_MASTER_RESILIENCE_V1 === false) return;

  var PANEL_ACTION = 'getTrendMasterPanelV1931';
  var LEGACY_ACTION = 'getTrendMasterCenterV1931';
  var PANELS = ['summary','archive','messages','stock','employee','debt','dayclose'];
  var defaultTimeouts = {summary:12000,archive:15000,messages:12000,stock:12000,employee:18000,debt:15000,dayclose:18000};
  var inflight = Object.create(null);
  var lastGood = Object.create(null);
  var latest = Object.create(null);
  var batchInflight = null;
  var lastContext = null;
  var oldApi = null;

  function txt(v){ return String(v == null ? '' : v); }
  function esc(v){ return txt(v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];}); }
  function $(id){ return document.getElementById(id); }
  function nowText(ts){ try{return new Date(ts||Date.now()).toLocaleTimeString('ar-EG');}catch(e){return '';} }
  function sleep(ms){ return new Promise(function(resolve){ setTimeout(resolve,ms); }); }
  function userKey(params){ return txt(params && (params.username || params.name) || 'anonymous').trim().toLowerCase(); }
  function cacheKey(panel,params){
    var suffix = panel === 'archive' ? ('|'+txt(params.archivePage||params.page||1)+'|'+txt(params.archiveQuery||params.query||'')) : '';
    return userKey(params)+'|'+panel+suffix;
  }
  function timeoutFor(panel){
    var cfg=window.MATBAGY_TREND_MASTER_PANEL_TIMEOUTS||{};
    var n=Number(cfg[panel]);
    return n>0?n:defaultTimeouts[panel]||15000;
  }
  function endpoint(){ return txt(window.MATBAGY_SECURE_API_PROXY_URL||window.TREND_API_URL||window.API_URL||'').trim(); }
  function isAuthError(message){ return /session|token|login|تسجيل|جلسة|صلاحية|دخول/i.test(txt(message)); }
  function cleanContext(params){
    return Object.assign({},params||{}, {
      archivePage:(params&&params.archivePage)||((window.trendosState||window.state||{}).archivePage)||1,
      archiveQuery:(params&&params.archiveQuery)||((window.trendosState||window.state||{}).archiveQuery)||''
    });
  }
  function requestPanel(panel,params){
    var url=endpoint();
    if(!url) return Promise.reject(new Error('رابط API غير مضبوط.'));
    var controller=new AbortController();
    var timer=setTimeout(function(){controller.abort();},timeoutFor(panel));
    var body=Object.assign({action:PANEL_ACTION,panel:panel,_ts:Date.now()},params||{});
    return fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),signal:controller.signal,credentials:'omit',redirect:'follow',cache:'no-store'})
      .then(function(r){return r.text();})
      .then(function(raw){
        var data; try{data=JSON.parse(raw||'{}');}catch(e){throw new Error('رد Trend Master غير صالح.');}
        if(!data||data.success===false) throw new Error((data&&data.message)||'تعذر تحميل القسم.');
        return data;
      })
      .catch(function(err){ if(err&&err.name==='AbortError') throw new Error('انتهت مهلة تحميل القسم.'); throw err; })
      .finally(function(){clearTimeout(timer);});
  }
  function readPanel(panel,params,options){
    params=cleanContext(params); options=options||{};
    var key=cacheKey(panel,params);
    if(inflight[key]) return inflight[key];
    var maxAttempts=Math.max(1,Math.min(2,Number(options.maxAttempts||2)||2));
    var promise=(async function(){
      var error=null;
      for(var attempt=1;attempt<=maxAttempts;attempt++){
        try{
          var data=await requestPanel(panel,params);
          var stamp=Date.now();
          lastGood[key]={data:data,updatedAt:stamp};
          latest[panel]={ok:true,data:data,updatedAt:stamp,stale:false,key:key};
          return latest[panel];
        }catch(err){
          error=err;
          if(attempt>=maxAttempts||isAuthError(err&&err.message)) break;
          await sleep(250*attempt);
        }
      }
      var cached=lastGood[key];
      if(cached){
        latest[panel]={ok:false,data:cached.data,updatedAt:cached.updatedAt,stale:true,error:error,key:key};
        return latest[panel];
      }
      latest[panel]={ok:false,data:null,updatedAt:0,stale:false,error:error,key:key};
      return latest[panel];
    })();
    inflight[key]=promise.finally(function(){delete inflight[key];});
    return inflight[key];
  }

  function loadingHtml(label){return '<div class="dash-empty tmr-loading">'+esc(label||'جاري التحميل...')+'</div>';}
  function errorHtml(panel,message){return '<div class="dash-empty tmr-error">'+esc(message||'تعذر تحميل هذا القسم.')+' <button type="button" class="ghost tmr-retry" data-tmr-retry="'+esc(panel)+'">إعادة المحاولة</button></div>';}
  function staleBadge(outcome){return outcome&&outcome.stale?'<div class="tmr-stale">⚠ بيانات محفوظة — آخر نجاح '+esc(nowText(outcome.updatedAt))+'</div>':'';}
  function listItem(title,meta,actions,badge){return '<div class="trend-list-item"><div class="trend-item-head"><b>'+esc(title||'-')+'</b>'+(badge||'')+'</div>'+(meta?'<small>'+esc(meta)+'</small>':'')+(actions?'<div class="trend-item-actions">'+actions+'</div>':'')+'</div>';}
  function dashItem(label,value,cls){return '<div class="dash-item '+esc(cls||'')+'"><span>'+esc(label)+'</span><b>'+esc(value)+'</b></div>';}

  function applyPermissions(data){
    var p=(data&&data.permissions)||{};
    ['runTrendAutomationBtn','installTrendAutomationBtn'].forEach(function(id){var el=$(id);if(el&&typeof p.canRunAutomation==='boolean')el.classList.toggle('hidden',!p.canRunAutomation);});
    var close=$('runAccountingCloseBtn');if(close&&typeof p.canCloseDay==='boolean')close.classList.toggle('hidden',!p.canCloseDay);
    var debt=$('debtRestrictionPanel');if(debt&&typeof p.canManageDebtRestrictions==='boolean')debt.classList.toggle('hidden',!p.canManageDebtRestrictions);
    var day=$('dayClosePreviewPanel');if(day&&typeof p.canCloseDay==='boolean')day.classList.toggle('hidden',!p.canCloseDay);
  }
  function renderPanel(panel,outcome){
    var d=outcome&&outcome.data||{}; applyPermissions(d);
    if(panel==='summary'){
      var el=$('trendMasterSummary'),s=d.system||{};
      if(!el)return;
      if(!d.system){el.innerHTML=errorHtml(panel,outcome&&outcome.error&&outcome.error.message);return;}
      el.innerHTML=staleBadge(outcome)+dashItem('بنود التشغيل',s.activeLines||0,'')+dashItem('بنود الأرشيف',s.archivedLines||0,'done')+dashItem('تقسيم الصفحات',s.pagingEnabled?'مفعل':'-','ready')+dashItem('سياسة التسليم',s.deliveryPolicy||'-','ready')+dashItem('خصم المخزون',s.stockAutoDeduct||'-','ready');
      return;
    }
    if(panel==='archive'){
      var list=$('archiveOrdersList'),pageEl=$('archivePagerText'),a=d.archive||{},rows=a.rows||[],pg=a.pagination||{},allowed=!(d.permissions&&d.permissions.canManageArchive===false);
      if(!list)return;
      if(!d.archive){list.innerHTML=errorHtml(panel,outcome&&outcome.error&&outcome.error.message);return;}
      list.innerHTML=staleBadge(outcome)+(!allowed?'<div class="dash-empty">الأرشيف متاح للإدارة وخدمة العملاء.</div>':(!rows.length?'<div class="dash-empty">لا توجد أوردرات مؤرشفة مطابقة.</div>':rows.map(function(row){var meta=[row.customer,row.department,row.itemName,(row.lineCount||0)+' بند',row.archivedAt?'أُرشف '+row.archivedAt:''].filter(Boolean).join(' — ');return listItem('أوردر '+row.orderId,meta,'<button class="ghost restore-archive-order" data-order-id="'+esc(row.orderId)+'" type="button">استرجاع للتشغيل</button>','<span class="trend-score">مؤرشف</span>');}).join('')));
      if(pageEl)pageEl.textContent=allowed?('صفحة '+(pg.page||1)+' من '+(pg.totalPages||1)+' — '+(pg.totalRows||0)+' أوردر'):'';
      var prev=$('archivePrevBtn'),next=$('archiveNextBtn');if(prev)prev.disabled=!allowed||(pg.page||1)<=1;if(next)next.disabled=!allowed||(pg.page||1)>=(pg.totalPages||1);
      return;
    }
    if(panel==='messages'){
      var ml=$('automationMessagesList'),msgs=d.messageQueue||[];if(!ml)return;
      if(!d.messageQueue){ml.innerHTML=errorHtml(panel,outcome&&outcome.error&&outcome.error.message);return;}
      ml.innerHTML=staleBadge(outcome)+(!msgs.length?'<div class="dash-empty">لا توجد رسائل أو تنبيهات معلقة.</div>':msgs.map(function(msg){var acts=(msg.whatsappUrl?'<button class="primary open-automation-wa" data-message-id="'+esc(msg.id)+'" data-wa-url="'+esc(msg.whatsappUrl)+'" type="button">فتح واتساب</button>':'')+'<button class="ghost copy-automation-message" data-message="'+esc(msg.message)+'" type="button">نسخ الرسالة</button>';return listItem((msg.type||'تنبيه')+(msg.orderId?' — '+msg.orderId:''),[msg.customer,msg.department,msg.assignedTo,msg.status].filter(Boolean).join(' — '),acts,'');}).join(''));
      return;
    }
    if(panel==='stock'){
      var sl=$('stockAlertsList'),stocks=d.stockAlerts||[];if(!sl)return;
      if(!d.stockAlerts){sl.innerHTML=errorHtml(panel,outcome&&outcome.error&&outcome.error.message);return;}
      sl.innerHTML=staleBadge(outcome)+(!stocks.length?'<div class="dash-empty">المخزون أعلى من حدود التنبيه.</div>':stocks.map(function(item){return listItem(item.material,item.department+' — الرصيد: '+item.stock+' — الحد الأدنى: '+item.minimum,'','<span class="trend-score warn">منخفض</span>');}).join(''));
      return;
    }
    if(panel==='employee'){
      var kl=$('employeeKpiList'),ks=d.employeePerformance||[];if(!kl)return;
      if(!d.employeePerformance){kl.innerHTML=errorHtml(panel,outcome&&outcome.error&&outcome.error.message);return;}
      kl.innerHTML=staleBadge(outcome)+(!ks.length?'<div class="dash-empty">لا توجد بيانات تقييم اليوم.</div>':ks.map(function(k){return listItem(k.employee+' — '+(k.department||''),(k.orderCount||0)+' أوردر / '+(k.total||0)+' بند — منجز '+(k.completed||0)+' — متأخر '+(k.overdue||0)+' — إنجاز '+(k.completionPercent||0)+'%','','<span class="trend-score '+(Number(k.score)<60?'warn':'')+'">'+esc(k.score||0)+'%</span>');}).join(''));
      return;
    }
    if(panel==='debt'){
      var dl=$('debtRestrictionList'),opts=$('debtRestrictionCustomers'),dc=d.debtControl||{},cs=dc.customers||[],rs=dc.restrictions||[];
      if(d.permissions&&d.permissions.canManageDebtRestrictions===false)return;
      if(!dl)return;
      if(!d.debtControl){dl.innerHTML=errorHtml(panel,outcome&&outcome.error&&outcome.error.message);return;}
      if(opts)opts.innerHTML=cs.map(function(c){return '<option value="'+esc(c.name)+'">مديونية: '+esc(c.debtAmount||0)+' ج</option>';}).join('');
      dl.innerHTML=staleBadge(outcome)+(!rs.length?'<div class="dash-empty">لا يوجد عملاء في قائمة المنع.</div>':rs.map(function(item){var active=item.active&&!item.expired,badge='<span class="trend-score '+(active?'warn':'')+'">'+(active?'منع فعال':'غير فعال')+'</span>',meta=[item.reason,item.validUntil?'حتى '+item.validUntil:'بدون تاريخ انتهاء',item.createdBy?'أضافه '+item.createdBy:''].filter(Boolean).join(' — '),acts=active?'<button class="ghost disable-debt-restriction" data-customer="'+esc(item.customer)+'" data-reason="'+esc(item.reason||'')+'" type="button">رفع المنع</button>':'';return listItem(item.customer,meta,acts,badge);}).join(''));
      return;
    }
    if(panel==='dayclose'){
      var jl=$('dayClosePreviewList'),badgeEl=$('dayCloseReadyBadge'),day=d.dayClose;if(d.permissions&&d.permissions.canCloseDay===false)return;if(!jl)return;
      if(!day){jl.innerHTML=errorHtml(panel,outcome&&outcome.error&&outcome.error.message);return;}
      var blockers=day.blockers||[];jl.innerHTML=staleBadge(outcome)+(blockers.length?blockers.map(function(v){return '<div class="trend-list-item danger-text">'+esc(v)+'</div>';}).join(''):'<div class="trend-list-item"><b>كل المراجعات سليمة، يمكن تنفيذ قفلة اليوم.</b></div>');if(badgeEl)badgeEl.textContent=blockers.length?(blockers.length+' مانع'):'جاهز';var b=$('runAccountingCloseBtn');if(b)b.disabled=blockers.length>0;
    }
  }
  function setPanelLoading(panel){
    var map={summary:'trendMasterSummary',archive:'archiveOrdersList',messages:'automationMessagesList',stock:'stockAlertsList',employee:'employeeKpiList',debt:'debtRestrictionList',dayclose:'dayClosePreviewList'};
    var el=$(map[panel]); if(el)el.innerHTML=loadingHtml(panel==='employee'?'جاري الحساب...':'جاري التحميل...');
  }
  function updateOverallStatus(){
    var status=$('trendMasterStatus');if(!status)return;
    var failed=PANELS.filter(function(p){return latest[p]&&latest[p].ok===false&&!latest[p].stale;});
    var stale=PANELS.filter(function(p){return latest[p]&&latest[p].stale;});
    var successful=PANELS.filter(function(p){return latest[p]&&latest[p].data;});
    if(failed.length)status.textContent='تحديث جزئي — تعذر '+failed.length+' قسم — '+nowText();
    else if(stale.length)status.textContent='تم التحديث مع '+stale.length+' قسم ببيانات محفوظة — '+nowText();
    else if(successful.length)status.textContent='آخر تحديث: '+nowText();
  }
  function launchBatch(params,forceLoading){
    params=cleanContext(params); lastContext=params;
    if(batchInflight)return batchInflight;
    if(forceLoading!==false)PANELS.forEach(setPanelLoading);
    var jobs=PANELS.map(function(panel){return readPanel(panel,params,{maxAttempts:2}).then(function(out){renderPanel(panel,out);updateOverallStatus();return out;});});
    batchInflight=Promise.all(jobs).finally(function(){batchInflight=null;updateOverallStatus();});
    return batchInflight;
  }
  function compatibleSnapshot(){
    var out={success:true,system:{},employeePerformance:[],stockAlerts:[],messageQueue:[],archive:{success:true,rows:[],pagination:{page:1,pageSize:10,totalRows:0,totalPages:1}},debtControl:{customers:[],restrictions:[]},dayClose:null,permissions:{},version:'V1931_TREND_MASTER_RESILIENCE_V1'};
    PANELS.forEach(function(p){var d=latest[p]&&latest[p].data;if(!d)return;if(d.system)out.system=d.system;if(d.employeePerformance)out.employeePerformance=d.employeePerformance;if(d.stockAlerts)out.stockAlerts=d.stockAlerts;if(d.messageQueue)out.messageQueue=d.messageQueue;if(d.archive)out.archive=d.archive;if(d.debtControl)out.debtControl=d.debtControl;if(d.dayClose)out.dayClose=d.dayClose;if(d.permissions)out.permissions=Object.assign(out.permissions,d.permissions);});
    return out;
  }
  async function interceptedApi(action,params){
    if(action!==LEGACY_ACTION)return oldApi(action,params);
    var context=cleanContext(params); launchBatch(context,true);
    var summary=await readPanel('summary',context,{maxAttempts:2});
    renderPanel('summary',summary);
    var snapshot=compatibleSnapshot();
    setTimeout(function(){PANELS.forEach(function(p){if(latest[p])renderPanel(p,latest[p]);});updateOverallStatus();},0);
    return snapshot;
  }
  function retry(panel){
    if(PANELS.indexOf(panel)===-1)return Promise.resolve(null);
    var params=lastContext||cleanContext({});setPanelLoading(panel);
    return readPanel(panel,params,{maxAttempts:2}).then(function(out){renderPanel(panel,out);updateOverallStatus();return out;});
  }
  function inject(){
    if(document.getElementById('trendMasterResilienceV1Style'))return;
    var s=document.createElement('style');s.id='trendMasterResilienceV1Style';s.textContent='.tmr-error{color:#b42318}.tmr-stale{margin:0 0 8px;padding:7px 9px;border-radius:9px;background:#fff7ed;color:#9a3412;font-size:12px}.tmr-retry{margin-inline-start:8px}.tmr-loading{opacity:.75}';(document.head||document.documentElement).appendChild(s);
    var root=$('trendMasterCenter');if(root&&!root.__tmrBound){root.__tmrBound=true;root.addEventListener('click',function(ev){var b=ev.target&&ev.target.closest&&ev.target.closest('[data-tmr-retry]');if(b){ev.preventDefault();retry(b.getAttribute('data-tmr-retry'));}});}
  }
  function install(){
    if(oldApi)return true;
    if(typeof window.trendosSecureApiV1922!=='function')return false;
    oldApi=window.trendosSecureApiV1922;
    window.trendosSecureApiV1922=interceptedApi;
    inject();
    window.trendMasterPanelResilienceV1={readPanel:readPanel,retry:retry,refresh:function(params){return launchBatch(params||lastContext||{},true);},snapshot:compatibleSnapshot,_debug:{inflight:inflight,lastGood:lastGood,latest:latest,timeoutFor:timeoutFor}};
    return true;
  }
  if(!install()){
    var tries=0,t=setInterval(function(){tries++;if(install()||tries>=100)clearInterval(t);},50);
  }
})();
