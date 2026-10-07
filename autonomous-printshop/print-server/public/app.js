const $ = (id) => document.getElementById(id);
let orders = [], currentOrder = null, currentFiles = [];

async function api(path, options){
  const r = await fetch(path, options); const body = await r.json();
  if(!r.ok || body.ok === false) throw new Error(body.error || `HTTP ${r.status}`);
  return body;
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function treeHtml(order){
  const routes = order?.routes || {}; const root = {};
  for(const route of Object.values(routes)){
    const full = route.path || ''; const orderFolder = order.folder || '';
    const rel = full.startsWith(orderFolder) ? full.slice(orderFolder.length).replace(/^[/\\]+/,'') : full;
    let node = root; for(const part of rel.split(/[/\\]/).filter(Boolean)){ node[part] ||= {}; node = node[part]; }
  }
  const walk = n => `<ul>${Object.entries(n).map(([k,v])=>`<li><span class="folder">${esc(k)}</span>${walk(v)}</li>`).join('')}</ul>`;
  return Object.keys(root).length ? `<div class="folder">${esc((order.folder||'').split(/[/\\]/).pop())}</div>${walk(root)}` : '<div class="empty">لا توجد مسارات مصنفة</div>';
}
function renderOrders(filter=''){
  const q=filter.trim().toLowerCase(); const shown=orders.filter(o=>!q || String(o.orderId).toLowerCase().includes(q) || String(o.customerName||'').toLowerCase().includes(q));
  $('ordersList').innerHTML = shown.length ? shown.map(o=>`<div class="order-row ${currentOrder?.orderId===o.orderId?'active':''}" data-id="${esc(o.orderId)}"><b>#${esc(o.orderId)} — ${esc(o.customerName||'')}</b><span class="badge">${Object.keys(o.routes||{}).length} قسم</span><small>${esc(o.folder||'')}</small><small>${(o.unclassified||[]).length ? '⚠ يحتاج تصنيف: '+o.unclassified.length : '✓ مصنف'}</small></div>`).join('') : '<div class="empty">لا توجد أوردرات</div>';
  document.querySelectorAll('.order-row').forEach(el=>el.onclick=()=>selectOrder(el.dataset.id));
}
async function selectOrder(id){
  currentOrder=orders.find(o=>String(o.orderId)===String(id)); renderOrders($('searchBox').value);
  $('orderTitle').textContent=`أوردر #${currentOrder.orderId}`; $('orderCustomer').textContent=currentOrder.customerName||'';
  $('folderTree').innerHTML=treeHtml(currentOrder);
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
async function refresh(){
  try{
    const [status,data]=await Promise.all([api('/api/status'),api('/api/orders')]); orders=data.orders||[];
    $('connectionStatus').textContent='● متصل بالسيرفر المحلي'; $('modeLabel').textContent=status.mode;
    const p=status.preview||{}; $('previewCapabilities').textContent=`TIF ${p.tiff?'✓':'✕'} • DXF ${p.dxf?'✓':'✕'} • الصور ✓`;
    $('countOrders').textContent=orders.length; $('countNeedsClass').textContent=orders.reduce((n,o)=>n+(o.unclassified||[]).length,0);
    renderOrders($('searchBox').value);
    if(currentOrder && orders.some(o=>o.orderId===currentOrder.orderId)) await selectOrder(currentOrder.orderId);
  }catch(e){$('connectionStatus').textContent='● السيرفر المحلي غير متاح';$('connectionStatus').style.color='#b42318';}
}
$('refreshBtn').onclick=refresh; $('searchBox').oninput=e=>renderOrders(e.target.value); refresh(); setInterval(refresh,10000);
