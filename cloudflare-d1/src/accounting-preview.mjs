const ACCOUNTING_PREVIEW_VERSION = 'TRENDOS_ACCOUNTING_PREVIEW_V0_1_20260905';

const MODULES = [
  'dashboard','sales','purchases','expenses','cashbox','inventory',
  'bom','suppliers','receivables','payables','reports'
];

export function isAccountingPreviewPath(path) {
  const normalized = String(path || '').replace(/\/+$/, '') || '/';
  return normalized === '/accounting' ||
    normalized === '/v1/accounting/health';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function htmlResponse() {
  return new Response(ACCOUNTING_HTML, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-trendos-accounting-mode': 'preview-sandbox'
    }
  });
}

export async function handleAccountingPreviewRequest(request, env = {}) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method !== 'GET') {
    return json({
      success: false,
      code: 'accounting-preview-read-only',
      message: 'Accounting Preview accepts GET only. Authoritative financial writes remain disabled.',
      authoritativeWrites: false,
      sheetsAuthoritative: true
    }, 405);
  }

  if (path === '/v1/accounting/health') {
    return json({
      success: true,
      version: ACCOUNTING_PREVIEW_VERSION,
      mode: 'preview-sandbox',
      cutover: false,
      authoritativeWrites: false,
      previewBrowserWrites: 'localStorage-only',
      writeAuthority: 'google-sheets-apps-script',
      sheetsAuthoritative: true,
      d1SchemaMutation: false,
      d1FinancialWrites: false,
      cloudWriteEnabled: String(env.TRENDOS_CLOUD_WRITE_V1_ENABLED || '').toLowerCase() === 'true',
      integrationKeys: ['Order ID', 'Line ID', 'Item ID', 'Invoice ID', 'Purchase ID', 'Payment ID', 'Stock Movement ID'],
      modules: MODULES
    });
  }

  if (path === '/accounting') return htmlResponse();

  return json({ success: false, code: 'not-found' }, 404);
}

const ACCOUNTING_HTML = String.raw`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TrendOS Accounting — Preview</title>
<style>
:root{font-family:Inter,Tahoma,Arial,sans-serif;color:#172033;background:#f4f6fa}
*{box-sizing:border-box}body{margin:0;background:#f4f6fa}
header{background:#111827;color:white;padding:16px 20px;position:sticky;top:0;z-index:5}
.head{max-width:1450px;margin:auto;display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap}
h1{font-size:20px;margin:0}.badge{font-size:12px;padding:7px 10px;border-radius:999px;background:#f59e0b;color:#111827;font-weight:700}
main{max-width:1450px;margin:18px auto;padding:0 16px 40px}
.notice{background:#fff7ed;border:1px solid #fdba74;padding:12px 14px;border-radius:12px;margin-bottom:14px;font-size:13px}
nav{display:flex;gap:8px;overflow:auto;padding-bottom:8px}
nav button{white-space:nowrap;border:1px solid #d7dce5;background:white;padding:9px 12px;border-radius:10px;cursor:pointer}
nav button.active{background:#111827;color:white}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0}
.card{background:white;border:1px solid #e4e7ec;border-radius:14px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.metric b{display:block;font-size:22px;margin-top:5px}.muted{color:#667085;font-size:12px}
section{display:none}.section-active{display:block}
.row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
label{font-size:12px;color:#475467;display:block;margin-bottom:4px}
input,select,textarea{width:100%;border:1px solid #d0d5dd;border-radius:9px;padding:9px;background:white}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.btn{border:0;border-radius:9px;padding:9px 13px;cursor:pointer;background:#111827;color:white}.btn.secondary{background:#e5e7eb;color:#111827}
table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}th,td{border-bottom:1px solid #eaecf0;padding:8px;text-align:right;vertical-align:top}th{background:#f9fafb}
.pill{display:inline-block;padding:3px 7px;border-radius:999px;background:#eef2ff;font-size:11px}
.ok{color:#027a48}.warn{color:#b54708}.danger{color:#b42318}
pre{white-space:pre-wrap;background:#101828;color:#d1fadf;border-radius:10px;padding:12px;min-height:100px}
.small{font-size:11px}
@media(max-width:1000px){.grid,.row{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.grid,.row{grid-template-columns:1fr}}
</style>
</head>
<body>
<header><div class="head"><div><h1>TrendOS Accounting</h1><div class="muted" style="color:#cbd5e1">برنامج الحسابات — Cloudflare Preview V0.1</div></div><span class="badge">PREVIEW — بدون كتابة على الإنتاج</span></div></header>
<main>
<div class="notice"><b>وضع آمن:</b> البيانات التي تضيفها هنا محفوظة محليًا في هذا المتصفح فقط بغرض تجربة البرنامج. لا يتم إرسال أي قيد مالي إلى D1 أو Google Sheets أو Apps Script في هذه النسخة.</div>
<nav id="nav"></nav>

<div class="grid" id="metrics"></div>

<section id="dashboard" class="section-active">
  <div class="row">
    <div class="card"><b>مديونيات العملاء</b><div id="dashReceivables"></div></div>
    <div class="card"><b>مستحقات الموردين</b><div id="dashPayables"></div></div>
    <div class="card"><b>تنبيهات المخزون</b><div id="dashStock"></div></div>
    <div class="card"><b>نبض المطبعة</b><div id="pulse"></div></div>
  </div>
</section>

<section id="sales">
<div class="card">
<h3>إضافة فاتورة / بند مبيعات تجريبي</h3>
<div class="row">
<div><label>Order ID</label><input id="sOrder" placeholder="TM260630015"></div>
<div><label>Line ID</label><input id="sLine" placeholder="TM260630015-001"></div>
<div><label>الصنف</label><input id="sItem" placeholder="تابلوه 20×30"></div>
<div><label>الكمية</label><input id="sQty" type="number" min="0" step="0.01" value="1"></div>
<div><label>سعر الوحدة</label><input id="sPrice" type="number" min="0" step="0.01"></div>
<div><label>التكلفة المعترف بها / وحدة</label><input id="sCost" type="number" min="0" step="0.01"></div>
<div><label>المدفوع</label><input id="sPaid" type="number" min="0" step="0.01"></div>
<div><label>العميل</label><input id="sCustomer"></div>
</div>
<div class="actions"><button class="btn" id="addSale">إضافة محليًا</button></div>
<div id="salesTable"></div>
</div>
</section>

<section id="purchases">
<div class="card"><h3>المشتريات</h3><div class="row">
<div><label>المورد</label><input id="pSupplier"></div>
<div><label>الصنف / الخامة</label><input id="pItem"></div>
<div><label>الكمية</label><input id="pQty" type="number" step="0.01" value="1"></div>
<div><label>سعر الوحدة</label><input id="pCost" type="number" step="0.01"></div>
<div><label>المدفوع</label><input id="pPaid" type="number" step="0.01"></div>
</div><div class="actions"><button class="btn" id="addPurchase">إضافة محليًا</button></div><div id="purchasesTable"></div></div>
</section>

<section id="expenses">
<div class="card"><h3>المصروفات</h3><div class="row">
<div><label>النوع</label><input id="eType" placeholder="كهرباء"></div>
<div><label>البيان</label><input id="eDesc"></div>
<div><label>المبلغ</label><input id="eAmount" type="number" step="0.01"></div>
<div><label>Order ID اختياري</label><input id="eOrder"></div>
</div><div class="actions"><button class="btn" id="addExpense">إضافة محليًا</button></div><div id="expensesTable"></div></div>
</section>

<section id="cashbox"><div class="card"><h3>الخزنة</h3><p class="muted">مشتقة من المقبوضات والمدفوعات والمصروفات التجريبية، وليست سجلًا ماليًا رسميًا.</p><div id="cashTable"></div></div></section>

<section id="inventory">
<div class="card"><h3>دليل الأصناف والمخزون</h3><div class="row">
<div><label>Item ID</label><input id="iId" placeholder="ITEM-001"></div>
<div><label>اسم الصنف</label><input id="iName"></div>
<div><label>النوع</label><select id="iType"><option>خامة</option><option>نصف مصنع</option><option>منتج نهائي</option><option>خدمة</option></select></div>
<div><label>الوحدة</label><input id="iUnit" placeholder="قطعة / متر / م²"></div>
<div><label>الرصيد التجريبي</label><input id="iStock" type="number" step="0.01" value="0"></div>
<div><label>تكلفة الوحدة</label><input id="iCost" type="number" step="0.01" value="0"></div>
<div><label>حد إعادة الطلب</label><input id="iMin" type="number" step="0.01" value="0"></div>
</div><div class="actions"><button class="btn" id="addItem">إضافة صنف محليًا</button></div><div id="inventoryTable"></div></div>
</section>

<section id="bom">
<div class="card"><h3>BOM / تكوين الأصناف</h3><div class="row">
<div><label>Item ID المنتج</label><input id="bParent"></div>
<div><label>Item ID المكوّن</label><input id="bComponent"></div>
<div><label>الكمية المطلوبة لكل وحدة</label><input id="bQty" type="number" step="0.0001" value="1"></div>
</div><div class="actions"><button class="btn" id="addBom">إضافة BOM محليًا</button></div><div id="bomTable"></div>
<hr style="border:0;border-top:1px solid #eee;margin:18px 0">
<h4>محاكاة التكوين التلقائي — بدون خصم فعلي</h4>
<div class="row"><div><label>Item ID النهائي</label><input id="simItem"></div><div><label>الكمية</label><input id="simQty" type="number" step="0.01" value="1"></div></div>
<div class="actions"><button class="btn secondary" id="simulateBom">محاكاة</button></div><pre id="bomPlan">لم يتم تشغيل محاكاة بعد.</pre>
</div>
</section>

<section id="suppliers"><div class="card"><h3>الموردون</h3><div id="suppliersTable"></div></div></section>
<section id="receivables"><div class="card"><h3>مديونيات العملاء</h3><div id="receivablesTable"></div></div></section>
<section id="payables"><div class="card"><h3>مستحقات الموردين</h3><div id="payablesTable"></div></div></section>
<section id="reports"><div class="card"><h3>قائمة دخل تجريبية</h3><div id="incomeStatement"></div></div></section>

<div class="actions" style="margin-top:20px"><button class="btn secondary" id="resetPreview">مسح البيانات التجريبية من هذا المتصفح</button></div>
</main>
<script>
(function(){
'use strict';
var KEY='trendos.accounting.preview.v0.1';
var modules=[
['dashboard','لوحة التحكم'],['sales','المبيعات'],['purchases','المشتريات'],['expenses','المصروفات'],
['cashbox','الخزنة'],['inventory','المخزون'],['bom','BOM والتكوين'],['suppliers','الموردون'],
['receivables','مديونيات العملاء'],['payables','مستحقات الموردين'],['reports','التقارير']
];
var empty={sales:[],purchases:[],expenses:[],items:[],bom:[]};
function clone(x){return JSON.parse(JSON.stringify(x));}
function load(){try{var x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&typeof x==='object'?Object.assign(clone(empty),x):clone(empty);}catch(e){return clone(empty);}}
var state=load();
function save(){localStorage.setItem(KEY,JSON.stringify(state));render();}
function num(v){var n=Number(v);return Number.isFinite(n)?n:0;}
function money(v){return num(v).toLocaleString('ar-EG',{maximumFractionDigits:2})+' ج.م';}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function id(prefix){return prefix+'-'+Date.now()+'-'+Math.random().toString(16).slice(2,8);}
function sum(arr,fn){return arr.reduce(function(a,x){return a+num(fn(x));},0);}
function table(headers,rows){
 if(!rows.length)return '<p class="muted">لا توجد بيانات تجريبية.</p>';
 return '<div style="overflow:auto"><table><thead><tr>'+headers.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';
}
function nav(){var n=document.getElementById('nav');n.innerHTML='';modules.forEach(function(m,i){var b=document.createElement('button');b.textContent=m[1];b.dataset.target=m[0];if(i===0)b.className='active';b.onclick=function(){document.querySelectorAll('section').forEach(function(s){s.classList.remove('section-active');});document.getElementById(m[0]).classList.add('section-active');document.querySelectorAll('nav button').forEach(function(x){x.classList.remove('active');});b.classList.add('active');};n.appendChild(b);});}
function metrics(){var sales=sum(state.sales,function(x){return x.total;});var paid=sum(state.sales,function(x){return x.paid;});var purchasePaid=sum(state.purchases,function(x){return x.paid;});var exp=sum(state.expenses,function(x){return x.amount;});var cogs=sum(state.sales,function(x){return x.costTotal;});var profit=sales-cogs-exp;var cash=paid-purchasePaid-exp;var data=[['المبيعات',money(sales)],['المقبوض',money(paid)],['صافي الربح',money(profit)],['رصيد الخزنة',money(cash)]];document.getElementById('metrics').innerHTML=data.map(function(x){return '<div class="card metric"><span class="muted">'+x[0]+'</span><b>'+x[1]+'</b></div>';}).join('');}
function renderSales(){document.getElementById('salesTable').innerHTML=table(['Invoice ID','Order ID','Line ID','العميل','الصنف','الإيراد','التكلفة','ربح البند','المدفوع','المتبقي'],state.sales.map(function(x){return [esc(x.invoiceId),esc(x.orderId),esc(x.lineId),esc(x.customer),esc(x.item),money(x.total),money(x.costTotal),money(x.profit),money(x.paid),money(x.total-x.paid)];}));}
function renderPurchases(){document.getElementById('purchasesTable').innerHTML=table(['Purchase ID','المورد','الصنف','الكمية','الإجمالي','المدفوع','المتبقي'],state.purchases.map(function(x){return [esc(x.purchaseId),esc(x.supplier),esc(x.item),esc(x.qty),money(x.total),money(x.paid),money(x.total-x.paid)];}));}
function renderExpenses(){document.getElementById('expensesTable').innerHTML=table(['Expense ID','النوع','البيان','Order ID','المبلغ'],state.expenses.map(function(x){return [esc(x.expenseId),esc(x.type),esc(x.desc),esc(x.orderId),money(x.amount)];}));}
function renderInventory(){document.getElementById('inventoryTable').innerHTML=table(['Item ID','الصنف','النوع','الوحدة','الرصيد','تكلفة الوحدة','حد الطلب'],state.items.map(function(x){return [esc(x.itemId),esc(x.name),esc(x.type),esc(x.unit),esc(x.stock),money(x.cost),esc(x.minStock)];}));}
function renderBom(){document.getElementById('bomTable').innerHTML=table(['المنتج','المكوّن','الكمية/وحدة'],state.bom.map(function(x){return [esc(x.parent),esc(x.component),esc(x.qty)];}));}
function renderDerived(){var cashRows=[];state.sales.forEach(function(x){if(num(x.paid)>0)cashRows.push([esc(x.invoiceId),'قبض مبيعات',money(x.paid),'—']);});state.purchases.forEach(function(x){if(num(x.paid)>0)cashRows.push([esc(x.purchaseId),'سداد مشتريات','—',money(x.paid)]);});state.expenses.forEach(function(x){cashRows.push([esc(x.expenseId),'مصروف','—',money(x.amount)]);});document.getElementById('cashTable').innerHTML=table(['المرجع','الحركة','داخل','خارج'],cashRows);var suppliers={};state.purchases.forEach(function(x){var k=x.supplier||'غير محدد';if(!suppliers[k])suppliers[k]={total:0,paid:0};suppliers[k].total+=x.total;suppliers[k].paid+=x.paid;});document.getElementById('suppliersTable').innerHTML=table(['المورد','إجمالي التعامل','المستحق'],Object.keys(suppliers).map(function(k){return [esc(k),money(suppliers[k].total),money(suppliers[k].total-suppliers[k].paid)];}));var customers={};state.sales.forEach(function(x){var k=x.customer||'غير محدد';if(!customers[k])customers[k]={total:0,paid:0};customers[k].total+=x.total;customers[k].paid+=x.paid;});var recRows=Object.keys(customers).map(function(k){return [esc(k),money(customers[k].total),money(customers[k].paid),money(customers[k].total-customers[k].paid)];});document.getElementById('receivablesTable').innerHTML=table(['العميل','المبيعات','المدفوع','المتبقي'],recRows);document.getElementById('payablesTable').innerHTML=table(['المورد','المشتريات','المدفوع','المتبقي'],Object.keys(suppliers).map(function(k){return [esc(k),money(suppliers[k].total),money(suppliers[k].paid),money(suppliers[k].total-suppliers[k].paid)];}));var sales=sum(state.sales,function(x){return x.total;});var cogs=sum(state.sales,function(x){return x.costTotal;});var exp=sum(state.expenses,function(x){return x.amount;});document.getElementById('incomeStatement').innerHTML=table(['البند','القيمة'],[['إيراد المبيعات',money(sales)],['تكلفة المبيعات المعترف بها',money(cogs)],['مجمل الربح',money(sales-cogs)],['المصروفات',money(exp)],['صافي الربح',money(sales-cogs-exp)]]);var totalRec=sum(state.sales,function(x){return x.total-x.paid;});var totalPay=sum(state.purchases,function(x){return x.total-x.paid;});document.getElementById('dashReceivables').innerHTML='<p><b>'+money(totalRec)+'</b></p><span class="muted">رصيد تجريبي غير رسمي</span>';document.getElementById('dashPayables').innerHTML='<p><b>'+money(totalPay)+'</b></p><span class="muted">رصيد تجريبي غير رسمي</span>';var low=state.items.filter(function(x){return num(x.stock)<=num(x.minStock);});document.getElementById('dashStock').innerHTML=low.length?low.map(function(x){return '<div class="warn small">'+esc(x.name)+' — '+esc(x.stock)+' '+esc(x.unit)+'</div>';}).join(''):'<p class="ok small">لا توجد تنبيهات محلية.</p>';document.getElementById('pulse').innerHTML='<div class="small">فواتير: '+state.sales.length+'</div><div class="small">مشتريات: '+state.purchases.length+'</div><div class="small">أصناف: '+state.items.length+'</div>';}
function render(){metrics();renderSales();renderPurchases();renderExpenses();renderInventory();renderBom();renderDerived();}
function required(v,msg){if(!String(v||'').trim()){alert(msg);return false;}return true;}
document.getElementById('addSale').onclick=function(){var order=document.getElementById('sOrder').value.trim(),line=document.getElementById('sLine').value.trim();if(!required(order,'Order ID مطلوب')||!required(line,'Line ID مطلوب'))return;if(line.indexOf(order)!==0&&!confirm('Line ID لا يبدأ بـ Order ID. استمرار كتجربة فقط؟'))return;var qty=num(document.getElementById('sQty').value),price=num(document.getElementById('sPrice').value),cost=num(document.getElementById('sCost').value),paid=num(document.getElementById('sPaid').value);var total=qty*price,costTotal=qty*cost;state.sales.unshift({invoiceId:id('INV'),orderId:order,lineId:line,item:document.getElementById('sItem').value,customer:document.getElementById('sCustomer').value,qty:qty,unitPrice:price,total:total,costTotal:costTotal,profit:total-costTotal,paid:Math.min(paid,total),clientRequestId:id('REQ'),createdAt:new Date().toISOString()});save();};
document.getElementById('addPurchase').onclick=function(){var supplier=document.getElementById('pSupplier').value.trim(),item=document.getElementById('pItem').value.trim();if(!required(supplier,'المورد مطلوب')||!required(item,'الصنف مطلوب'))return;var qty=num(document.getElementById('pQty').value),cost=num(document.getElementById('pCost').value),total=qty*cost,paid=num(document.getElementById('pPaid').value);state.purchases.unshift({purchaseId:id('PUR'),supplier:supplier,item:item,qty:qty,unitCost:cost,total:total,paid:Math.min(paid,total),clientRequestId:id('REQ'),createdAt:new Date().toISOString()});save();};
document.getElementById('addExpense').onclick=function(){var amount=num(document.getElementById('eAmount').value);if(amount<=0){alert('المبلغ يجب أن يكون أكبر من صفر');return;}state.expenses.unshift({expenseId:id('EXP'),type:document.getElementById('eType').value,desc:document.getElementById('eDesc').value,amount:amount,orderId:document.getElementById('eOrder').value.trim(),createdAt:new Date().toISOString()});save();};
document.getElementById('addItem').onclick=function(){var itemId=document.getElementById('iId').value.trim(),name=document.getElementById('iName').value.trim();if(!required(itemId,'Item ID مطلوب')||!required(name,'اسم الصنف مطلوب'))return;if(state.items.some(function(x){return x.itemId===itemId;})){alert('Item ID موجود بالفعل');return;}state.items.push({itemId:itemId,name:name,type:document.getElementById('iType').value,unit:document.getElementById('iUnit').value,stock:num(document.getElementById('iStock').value),cost:num(document.getElementById('iCost').value),minStock:num(document.getElementById('iMin').value)});save();};
document.getElementById('addBom').onclick=function(){var parent=document.getElementById('bParent').value.trim(),component=document.getElementById('bComponent').value.trim(),qty=num(document.getElementById('bQty').value);if(!required(parent,'Item ID المنتج مطلوب')||!required(component,'Item ID المكون مطلوب')||qty<=0)return;state.bom.push({parent:parent,component:component,qty:qty});save();};
function simulate(itemId,qty){var stock={};state.items.forEach(function(x){stock[x.itemId]=num(x.stock);});var plan=[],shortages=[],visiting={};function need(idn,q){if(q<=0)return;var available=num(stock[idn]);var use=Math.min(available,q);if(use>0){stock[idn]=available-use;plan.push({action:'use-stock',itemId:idn,qty:use});q-=use;}if(q<=0)return;var lines=state.bom.filter(function(b){return b.parent===idn;});if(!lines.length){shortages.push({itemId:idn,qty:q});return;}if(visiting[idn]){throw new Error('BOM cycle detected at '+idn);}visiting[idn]=true;plan.push({action:'form',itemId:idn,qty:q});lines.forEach(function(b){need(b.component,q*num(b.qty));});delete visiting[idn];}need(itemId,qty);return {success:shortages.length===0,requested:{itemId:itemId,qty:qty},plan:plan,shortages:shortages,mutation:false};}
document.getElementById('simulateBom').onclick=function(){try{var x=simulate(document.getElementById('simItem').value.trim(),num(document.getElementById('simQty').value));document.getElementById('bomPlan').textContent=JSON.stringify(x,null,2);}catch(e){document.getElementById('bomPlan').textContent=JSON.stringify({success:false,error:String(e.message||e),mutation:false},null,2);}};
document.getElementById('resetPreview').onclick=function(){if(confirm('مسح البيانات التجريبية المحلية فقط؟')){localStorage.removeItem(KEY);state=clone(empty);render();}};
nav();render();
})();
</script>
</body></html>`;
