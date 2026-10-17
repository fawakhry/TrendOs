(function(){
  'use strict';
  const flow=['طلب جديد','جاري التنفيذ','جاهز للتسليم','تم التسليم'];
  const box=document.getElementById('orders'),notice=document.getElementById('feedback');
  const auditLog=document.getElementById('auditLog');
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let token='';
  function show(msg,isError=false){notice.className=isError?'error':'success';notice.textContent=msg}
  async function request(path,method,body){
    const h={'x-pilot-token':token};
    if(method==='POST')h['content-type']='application/json';
    const response=await fetch(path,{method:method||'GET',headers:h,...(body?{body:JSON.stringify(body)}:{})});
    const data=await response.json();
    if(!response.ok||!data.success)throw Error(data.code||'PILOT_REQUEST_FAILED');
    return data;
  }
  // Reuse existing manager-center-v1932.js, not a recreated dashboard.
  // A local synthetic "admin" principal only drives an untrusted local view.
  window.MATBAGY_MANAGER_CENTER_V1932=true;
  window.trendosState={user:{username:'local-demo-admin',role:'admin',token:''}};
  window.trendosEmployeeApiV1=async (action)=>{
    if(action!=='getTrendMasterCenterV1931')
      return {success:false,code:'PILOT_ACTION_NOT_SUPPORTED'};
    try{return await request('/api/manager')}
    catch(e){return {success:false,message:String(e.message)}}
  };
  async function refresh(){
    const r=await request('/api/orders'),items=r.orders;
    const active=items.filter(o=>o.status!=='تم التسليم');
    document.getElementById('active').textContent=String(active.length);
    document.getElementById('delivered').textContent=String(items.length-active.length);
    document.getElementById('blocked').textContent=String(active.filter(o=>o.blocked).length);
    box.innerHTML=items.map(o=>{
      const n=flow.indexOf(o.status),next=flow[n+1]||'';
      const blocked=!!o.blocked;
      const disabled=!next||(next==='تم التسليم'&&blocked);
      const label=blocked?'<span class="flag">منع تجريبي</span>':'<span class="flag ok">لا يوجد</span>';
      const action=next?'<button class="small" data-order="'+esc(o.id)+'" data-status="'+esc(next)+'" '+(disabled?'disabled':'')+'>'+esc(next)+'</button>':'<span class="muted">مؤرشف</span>';
      const review='<button class="small secondary" type="button" data-history="'+esc(o.id)+'">السجل</button>';
      return '<tr><td><b>'+esc(o.id)+'</b></td><td>'+esc(o.customer)+'</td><td>'+esc(o.product)+'<br><span class="muted">'+esc(o.department)+'</span></td><td>'+esc(o.status)+'</td><td>'+label+'</td><td>'+action+' '+review+'</td></tr>';
    }).join('')||'<tr><td colspan="6">لا توجد أوردرات تجريبية</td></tr>';
  }
  document.getElementById('orderForm').addEventListener('submit',async(e)=>{
    e.preventDefault();
    const button=document.getElementById('add');button.disabled=true;
    try{
      const product=document.getElementById('product').value,department=document.getElementById('department').value;
      const created=await request('/api/orders','POST',{product,department});
      show('تم إنشاء الأوردر الوهمي '+created.id);await refresh();
    }catch(err){show('تعذر إنشاء الأوردر: '+err.message,true)}
    finally{button.disabled=false}
  });
  box.addEventListener('click',async e=>{
    const historyButton=e.target.closest('button[data-history]');
    if(historyButton){
      historyButton.disabled=true;
      try{
        const id=historyButton.dataset.history;
        const output=await request('/api/orders/'+encodeURIComponent(id)+'/history');
        const rows=output.history||[];
        auditLog.textContent=id+' — '+(rows.length
          ?rows.map((x,i)=>(i+1)+'. '+x.previousStatus+' ← '+x.nextStatus+' ('+x.createdAt+' UTC)').join(String.fromCharCode(10))
          :'لا توجد تغييرات مسجلة');
      }catch(err){show('تعذر عرض السجل: '+err.message,true)}
      finally{historyButton.disabled=false}
      return;
    }
    const btn=e.target.closest('button[data-order]');if(!btn)return;
    btn.disabled=true;
    try{await request('/api/orders/'+encodeURIComponent(btn.dataset.order)+'/status','POST',{status:btn.dataset.status});
      show('تم تحديث '+btn.dataset.order+' إلى '+btn.dataset.status);await refresh()}
    catch(err){show('تم رفض تغيير الحالة: '+err.message,true);await refresh()}
  });
  document.getElementById('refresh').addEventListener('click',()=>refresh().catch(e=>show(e.message,true)));
  (async()=>{
    try{
      const r=await fetch('/api/session',{cache:'no-store'}),s=await r.json();
      if(!r.ok||!s.success||s.mode!=='SYNTHETIC_LOCAL_ONLY'||s.financeRelease!=='NO_GO')throw Error('SAFETY_NOT_CONFIRMED');
      token=s.token;window.trendosState.user.token='synthetic-local-session';
      await refresh();show('التجربة المحلية جاهزة — الحسابات غير مفعلة.');
    }catch(err){show('لا يمكن تشغيل التجربة: '+err.message,true)}
  })();
})();
