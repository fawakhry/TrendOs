const $ = (id) => document.getElementById(id);
let orders = [], currentOrder = null, currentFiles = [], lastStatus = null, storageDirty = false, manualFolderOptions = [];

async function api(path, options, timeoutMs=20000){
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(()=>controller.abort(), timeoutMs) : null;
  const requestOptions = Object.assign({}, options||{});
  if(controller) requestOptions.signal = controller.signal;
  try{
    const r = await fetch(path, requestOptions); const body = await r.json();
    if(!r.ok || body.ok === false) throw new Error(body.error || `HTTP ${r.status}`);
    return body;
  }catch(e){
    if(e && e.name === 'AbortError') throw new Error('انتهت مهلة الاتصال. حاول مرة أخرى.');
    throw e;
  }finally{
    if(timer) clearTimeout(timer);
  }
}
function post(path, body){return api(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})},20000);}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function treeHtml(order){
  const routes = order?.routes || {}; const root = {};
  for(const route of Object.values(routes)){
    const full = route.path || ''; const orderFolder = order.folder || '';
    const rel = full.startsWith(orderFolder) ? full.slice(orderFolder.length).replace(/^[/\\]+/,'') : full;
    let node = root; for(const part of rel.split(/[/\\]/).filter(Boolean)){ node[part] ||= {}; node = node[part]; }
  }
  const walk = n => `<ul>${Object.entries(n).map(([k,v])=>`<li><span class="folder">${esc(k)}</span>${walk(v)}</li>`).join('')}</ul>`;
  return Object.keys(root).length ? `<div class="folder">${esc((order.folder||'').split(/[/\\]/).pop())}</div>${walk(root)}` : '<div class="empty">لم يتم اختيار فولدر شغل بعد</div>';
}
function renderOrders(filter=''){
  const q=filter.trim().toLowerCase(); const shown=orders.filter(o=>!q || String(o.orderId).toLowerCase().includes(q) || String(o.customerName||'').toLowerCase().includes(q));
  $('ordersList').innerHTML = shown.length ? shown.map(o=>`<div class="order-row ${currentOrder?.orderId===o.orderId?'active':''}" data-id="${esc(o.orderId)}"><b>#${esc(o.orderId)} — ${esc(o.customerName||'')}</b><span class="badge">${Object.keys(o.routes||{}).length} فولدر</span><small>${esc(o.folder||'')}</small><small>${Object.keys(o.routes||{}).length ? '✓ تم اختيار فولدرات الشغل' : 'اختر فولدر الشغل'}</small></div>`).join('') : '<div class="empty">لا توجد أوردرات</div>';
  document.querySelectorAll('.order-row').forEach(el=>el.onclick=()=>selectOrder(el.dataset.id));
}
function renderManualFolderPicker(){
  const box=$('manualFolderPicker');
  if(!currentOrder){
    box.innerHTML='<span class="empty-inline">اختر أوردر أولًا</span>';
    return;
  }
  const existing=currentOrder.routes||{};
  box.innerHTML=manualFolderOptions.map(opt=>{
    const active=Boolean(existing[opt.key]);
    return `<button class="manual-folder-btn ${active?'active':''}" data-folder-key="${esc(opt.key)}">${active?'✓ ':''}${esc(opt.name)}</button>`;
  }).join('');
  document.querySelectorAll('.manual-folder-btn').forEach(btn=>btn.onclick=()=>createManualFolder(btn.dataset.folderKey,btn));
}
async function createManualFolder(folderKey,btn){
  if(!currentOrder) return;
  const original=btn.textContent;
  btn.disabled=true; btn.textContent='جاري الإنشاء...';
  $('manualFolderMsg').textContent='';
  try{
    const res=await post('/api/orders/manual-folder',{orderId:currentOrder.orderId,folderKey});
    $('manualFolderMsg').textContent=res.result?.alreadyExisted ? 'الفولدر موجود بالفعل.' : 'تم إنشاء الفولدر داخل الأوردر.';
    const data=await api('/api/orders',{},5000);
    orders=data.orders||[];
    currentOrder=orders.find(o=>String(o.orderId)===String(currentOrder.orderId));
    renderOrders($('searchBox').value);
    $('folderTree').innerHTML=treeHtml(currentOrder);
    renderManualFolderPicker();
  }catch(e){
    $('manualFolderMsg').textContent='تعذر إنشاء الفولدر: '+e.message;
    btn.disabled=false; btn.textContent=original;
  }
}
async function selectOrder(id){
  currentOrder=orders.find(o=>String(o.orderId)===String(id)); renderOrders($('searchBox').value);
  $('orderTitle').textContent=`أوردر #${currentOrder.orderId}`; $('orderCustomer').textContent=currentOrder.customerName||'';
  $('folderTree').innerHTML=treeHtml(currentOrder);
  $('manualFolderMsg').textContent='';
  renderManualFolderPicker();
  const body=await api(`/api/order-files?orderId=${encodeURIComponent(id)}`); currentFiles=body.files||[];
  $('fileCountLabel').textContent=`${currentFiles.length} ملف`; $('countFiles').textContent=currentFiles.length; $('countFinished').textContent=currentFiles.filter(f=>f.inX).length;
  renderFiles();
}
function renderFiles(){
  $('filesList').innerHTML=currentFiles.length?currentFiles.map((f,i)=>`<div class="file-row" data-i="${i}"><b>${esc(f.name)}</b><span class="${f.inX?'x':''}">${f.inX?'داخل x':''}</span><small>${esc(f.relativePath)}</small><small>${Math.ceil(f.sizeBytes/1024)} KB</small></div>`).join(''):'<div class="empty">لا توجد ملفات بعد</div>';
  document.querySelectorAll('.file-row').forEach(el=>el.onclick=()=>previewFile(Number(el.dataset.i),el));
}
function previewFile(i,el){
  document.querySelectorAll('.file-row').forEach(x=>x.classList.remove('active')); el.classList.add('active');
  const f=currentFiles[i]; $('previewMeta').textContent=`${f.name} • ${Math.ceil(f.sizeBytes/1024)} KB`;
  const area=$('previewArea'); if(!f.previewable){area.innerHTML='<div class="empty">لا توجد معاينة — افتح الملف بالبرنامج الأصلي</div>';return;}
  const src=`/api/preview?path=${encodeURIComponent(f.fullPath)}&t=${Date.now()}`;
  area.innerHTML=`<img src="${src}" alt="معاينة" onerror="this.parentElement.innerHTML='<div class=error>تعذر إنشاء المعاينة</div>'">`;
}
function renderStorage(status){
  const root=status?.storage?.ordersRoot || status?.ordersRoot || '';
  if(!storageDirty && document.activeElement !== $('ordersRootInput')){
    $('ordersRootInput').value=root;
  }
}
function renderPlatform(status){
  lastStatus=status;
  const t=status?.trendos||{}, b=status?.bridge||{};
  const el=$('platformStatus');
  if(t.connected){
    el.textContent=`● متصل بـ TrendOS — ${t.username||''}`;
    el.className='platform-on';
    $('trendUsername').value=t.username||$('trendUsername').value;
  }else if(t.loginState==='PENDING'){
    el.textContent='● جاري التحقق من حساب TrendOS...';
    el.className='platform-off';
  }else if(t.loginState==='FAILED'){
    el.textContent='● فشل ربط TrendOS';
    el.className='platform-off';
  }else{
    el.textContent='● غير مسجل على TrendOS';
    el.className='platform-off';
  }
  const bits=[];
  if(t.lastError) bits.push('سبب الربط: '+t.lastError);
  if(b.syncing) bits.push('جاري مزامنة بيانات المنصة...');
  if(b.lastSyncAt) bits.push('آخر مزامنة: '+new Date(b.lastSyncAt).toLocaleTimeString('ar-EG'));
  if(b.lastTriggerCount) bits.push('تم التقاط '+b.lastTriggerCount+' بند');
  if(b.lastError) bits.push('خطأ المزامنة: '+b.lastError);
  $('trendMsg').textContent=bits.join(' • ');
}
async function trendLogin(){
  const username=$('trendUsername').value.trim(), password=$('trendPassword').value;
  if(!username||!password){$('trendMsg').textContent='اكتب اسم المستخدم وكلمة المرور.';return;}
  const btn=$('trendLoginBtn'); btn.disabled=true; btn.textContent='جاري الربط...';
  try{
    const res=await post('/api/trendos/login',{username,password});
    $('trendPassword').value='';
    $('trendMsg').textContent=res.login?.accepted===false ? 'محاولة ربط شغالة بالفعل.' : 'تم إرسال طلب الربط. التحقق يجري في الخلفية والسيرفر المحلي سيظل شغالًا.';
    await refresh();
  }catch(e){$('trendMsg').textContent='فشل بدء الربط: '+e.message;}
  finally{btn.disabled=false;btn.textContent='ربط بالمنصة';}
}
async function trendProbe(){
  const btn=$('trendProbeBtn'); btn.disabled=true; btn.textContent='جاري الاختبار...';
  try{
    const res=await api('/api/trendos/probe',{},12000);
    $('trendMsg').textContent=`اتصال TrendOS سليم — Auth ${res.probe?.mode||''} — ${res.probe?.nativeReadyCount||0}/${res.probe?.userCount||0} حساب جاهز.`;
  }catch(e){
    $('trendMsg').textContent='اختبار الاتصال فشل: '+e.message;
  }finally{
    btn.disabled=false; btn.textContent='اختبار الاتصال';
  }
}
async function chooseOrdersRoot(){
  const btn=$('chooseOrdersRootBtn');
  btn.disabled=true; btn.textContent='اختر الفولدر...';
  $('storageMsg').textContent='هيظهر اختيار الفولدر على ويندوز.';
  try{
    const res=await api('/api/settings/orders-root/select',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:'{}'
    },300000);
    if(res.cancelled){
      $('storageMsg').textContent='تم إلغاء اختيار الفولدر.';
      return;
    }
    storageDirty=false;
    $('ordersRootInput').value=res.ordersRoot||'';
    $('storageMsg').textContent='تم تغيير مكان حفظ الأوردرات الجديدة. الأوردرات القديمة لم يتم نقلها.';
    await refresh();
  }catch(e){
    $('storageMsg').textContent='تعذر اختيار الفولدر: '+e.message;
  }finally{
    btn.disabled=false; btn.textContent='اختيار فولدر';
  }
}
async function saveOrdersRoot(){
  const path=$('ordersRootInput').value.trim();
  if(!path){$('storageMsg').textContent='اكتب أو اختر مسار الحفظ أولًا.';return;}
  const btn=$('saveOrdersRootBtn');
  btn.disabled=true; btn.textContent='جاري الحفظ...';
  try{
    const res=await post('/api/settings/orders-root',{path});
    storageDirty=false;
    $('ordersRootInput').value=res.ordersRoot||path;
    $('storageMsg').textContent=res.changed===false
      ? 'المسار محفوظ بالفعل.'
      : 'تم حفظ المكان الجديد. أي أوردر جديد هيتعمل هنا.';
    await refresh();
  }catch(e){
    $('storageMsg').textContent='تعذر حفظ المسار: '+e.message;
  }finally{
    btn.disabled=false; btn.textContent='حفظ المسار';
  }
}
async function trendSync(){
  try{
    const res=await post('/api/trendos/sync',{});
    $('trendMsg').textContent=res.scheduled===false ? 'المزامنة شغالة بالفعل.' : 'بدأت المزامنة في الخلفية.';
    await refresh();
  }catch(e){$('trendMsg').textContent='المزامنة لم تتم: '+e.message;}
}
async function trendLogout(){
  try{await post('/api/trendos/logout',{});$('trendMsg').textContent='تم فصل جلسة TrendOS من البرنامج.';await refresh();}
  catch(e){$('trendMsg').textContent='تعذر الفصل: '+e.message;}
}
async function refresh(){
  let status;
  try{
    status=await api('/api/status',{},5000);
    $('connectionStatus').textContent='● متصل بالسيرفر المحلي';
    $('connectionStatus').style.color='';
    $('modeLabel').textContent=status.mode;
    manualFolderOptions=status.manualFolderOptions||manualFolderOptions;
    const p=status.preview||{}; $('previewCapabilities').textContent=`TIF ${p.tiff?'✓':'✕'} • DXF ${p.dxf?'✓':'✕'} • الصور ✓`;
    renderPlatform(status);
    renderStorage(status);
  }catch(e){
    $('connectionStatus').textContent='● السيرفر المحلي غير متاح';
    $('connectionStatus').style.color='#b42318';
    return;
  }
  try{
    const data=await api('/api/orders',{},5000); orders=data.orders||[];
    $('countOrders').textContent=orders.length; $('countSelectedFolders').textContent=orders.reduce((n,o)=>n+Object.keys(o.routes||{}).length,0);
    renderOrders($('searchBox').value);
    if(currentOrder && orders.some(o=>o.orderId===currentOrder.orderId)) await selectOrder(currentOrder.orderId);
  }catch(e){
    $('trendMsg').textContent='السيرفر المحلي شغال لكن قراءة الأوردرات المحلية فشلت: '+e.message;
  }
}
$('refreshBtn').onclick=refresh;
$('trendLoginBtn').onclick=trendLogin;
$('trendProbeBtn').onclick=trendProbe;
$('trendSyncBtn').onclick=trendSync;
$('trendLogoutBtn').onclick=trendLogout;
$('chooseOrdersRootBtn').onclick=chooseOrdersRoot;
$('saveOrdersRootBtn').onclick=saveOrdersRoot;
$('ordersRootInput').addEventListener('input',()=>{storageDirty=true;});
$('settingsNavBtn').onclick=()=>{
  $('storageSettings').scrollIntoView({behavior:'smooth',block:'start'});
  $('ordersRootInput').focus();
};
$('trendPassword').addEventListener('keydown',e=>{if(e.key==='Enter')trendLogin();});
$('searchBox').oninput=e=>renderOrders(e.target.value);
refresh(); setInterval(refresh,10000);
