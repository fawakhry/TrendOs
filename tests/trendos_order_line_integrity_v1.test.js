const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=process.argv[2]||process.cwd();
const src=fs.readFileSync(root+'/trendos-order-line-integrity-v1.gs','utf8');
const remediation=fs.readFileSync(root+'/trendos-core-p0-remediation-v1.gs','utf8');
function txt(v){return String(v==null?'':v).trim();}
function normOrder(v){ if(v instanceof Date)return ''; let s=txt(v).replace(/\s+/g,'').toUpperCase(); return /^[A-Z0-9][A-Z0-9_-]*$/.test(s)?s:''; }
function normLine(v){ if(v instanceof Date)return ''; const s=txt(v).replace(/\s+/g,'').toUpperCase(); const m=s.match(/^(.+)-(\d{1,3})$/); if(!m)return ''; const o=normOrder(m[1]),n=+m[2]; return o&&n>=1&&n<=999?o+'-'+String(n).padStart(2,'0'):''; }
const ctx={console,Date,String,Number,Math,Object,Array,JSON,isFinite,
  trendosTextV1_:txt,trendosNormalizeOrderId_:normOrder,trendosNormalizeLineId_:normLine,
  trendosIsDuplicateStatus_:(s)=>txt(s)==='مكرر', trendosBusinessDate_:(v)=>{
    if(v instanceof Date)return '2026-08-30'; const m=txt(v).match(/\d{4}-\d{2}-\d{2}/); return m?m[0]:'';
  },
  normalize_:txt, firstCol_:(h,names,f)=>{for(const n of names)if(h[n])return h[n];return f||0;},
  headersMap_:(sh)=>sh.headers, valueAt_:(row,col)=>col?row[col-1]:'',
  safeSet_:(sh,row,col,v)=>sh.setCell(row,col,v), SpreadsheetApp:{flush(){}},
  makeOrderId_:()=> '4001'
};
vm.createContext(ctx); vm.runInContext(remediation,ctx); vm.runInContext(src,ctx);

class Range{constructor(sh,r,c,nr=1,nc=1){Object.assign(this,{sh,r,c,nr,nc})}getValues(){const out=[];for(let i=0;i<this.nr;i++){const row=[];for(let j=0;j<this.nc;j++)row.push(this.sh.getCell(this.r+i,this.c+j));out.push(row)}return out}getDisplayValues(){const out=[];for(let i=0;i<this.nr;i++){const row=[];for(let j=0;j<this.nc;j++)row.push(this.sh.getDisplayCell(this.r+i,this.c+j));out.push(row)}return out}}
class Sheet{constructor(headers,rows,displayRows){this.headerNames=headers;this.headers={};headers.forEach((h,i)=>this.headers[h]=i+1);this.rows=[headers,...rows.map(r=>r.slice())];this.displayRows=[headers,...(displayRows||rows).map(r=>r.slice())]}getLastRow(){return this.rows.length}getLastColumn(){return this.headerNames.length}getRange(r,c,nr=1,nc=1){return new Range(this,r,c,nr,nc)}getDataRange(){return new Range(this,1,1,this.rows.length,this.headerNames.length)}getCell(r,c){return (this.rows[r-1]||[])[c-1]??''}getDisplayCell(r,c){const v=(this.displayRows[r-1]||[])[c-1];return v==null?'':String(v)}setCell(r,c,v){while(this.rows.length<r)this.rows.push([]);while(this.rows[r-1].length<c)this.rows[r-1].push('');this.rows[r-1][c-1]=v;while(this.displayRows.length<r)this.displayRows.push([]);while(this.displayRows[r-1].length<c)this.displayRows[r-1].push('');this.displayRows[r-1][c-1]=v}}

const lineHeaders=['رقم الأوردر','كود الأوردر','اسم العميل','x','القسم','رقم البند','a','b','c','d','الحالة','جاهز؟','آخر تحديث','ملاحظات'];
let sh=new Sheet(lineHeaders,[['3637','3637','A','','طباعة','3637-02','','','','','مكرر','','',''],['3637','3637','A','','طباعة','3637-02','','','','','تحت التنفيذ','','','n']]);
let r=ctx.trendosOrderLineResolveActiveLineV1_(sh,'3637-02',3,'3637');
assert.strictEqual(r.ok,true);assert.strictEqual(r.target.rowNumber,3);
r=ctx.trendosOrderLineResolveActiveLineV1_(sh,'3637-02',2,'3637');
assert.strictEqual(r.ok,false);assert.strictEqual(r.staleRow,true);
sh=new Sheet(lineHeaders,[['3637','3637','A','','طباعة','3637-02','','','','','طلب جديد','','',''],['3637','3637','A','','طباعة','3637-02','','','','','تحت التنفيذ','','','']]);
r=ctx.trendosOrderLineResolveActiveLineV1_(sh,'3637-02',0,'3637');
assert.strictEqual(r.ok,false);assert.strictEqual(r.activeDuplicate,true);
const legacyDate=new Date('3112-01-01T00:00:00.000Z');
const legacyRaw=[['3112','3112','Legacy','','طباعة',legacyDate,'','','','','طلب جديد','','','']];
const legacyDisplay=[['3112','3112','Legacy','','طباعة','3112-01','','','','','طلب جديد','','','']];
sh=new Sheet(lineHeaders,legacyRaw,legacyDisplay);
r=ctx.trendosOrderLineResolveActiveLineV1_(sh,'3112-01',2,'3112');
assert.strictEqual(r.ok,true);assert.strictEqual(r.target.rowNumber,2);

const draftHeaders=['نوع السجل','رقم المسودة','رقم الأوردر','رقم البند','رقم بند المسودة','كود الشات'];
sh=new Sheet(draftHeaders,[['بند','DRAFT-C1','','','DRAFT-C1-I01','C1'],['بند','DRAFT-C1','','','DRAFT-C1-I03','C1'],['ملف','DRAFT-C1','','','DRAFT-C1-I03','C1']]);
let di=ctx.trendosCustomerDraftValidateItemsV1_(sh,'DRAFT-C1','C1');
assert.strictEqual(di.ok,true);assert.strictEqual(di.count,2);assert.strictEqual(di.nextNumber,4);
sh=new Sheet(draftHeaders,[['بند','DRAFT-C1','','','DRAFT-C1-I01','C1'],['بند','DRAFT-C1','','','DRAFT-C1-I01','C1']]);
di=ctx.trendosCustomerDraftValidateItemsV1_(sh,'DRAFT-C1','C1');
assert.strictEqual(di.ok,false);assert.strictEqual(di.duplicates.length,1);

const dHeaders=['رقم المسودة','كود الشات','حالة المسودة','تاريخ البداية','رقم الأوردر الناتج'];
const dsh=new Sheet(dHeaders,[['D1','C1','مسودة','2026-08-30','']]);
const fd={sheet:dsh,rowNumber:2,row:dsh.rows[1],h:dsh.headers};
let allocs=0;ctx.makeOrderId_=()=>{allocs++;return '4001'};
let o=ctx.trendosCustomerDraftResolveOrderIdV1_(fd,{},new Date());
assert.deepStrictEqual(JSON.parse(JSON.stringify(o)),{orderId:'4001',reused:false});
assert.strictEqual(dsh.getCell(2,5),'4001');
fd.row=dsh.rows[1];
o=ctx.trendosCustomerDraftResolveOrderIdV1_(fd,{},new Date());
assert.deepStrictEqual(JSON.parse(JSON.stringify(o)),{orderId:'4001',reused:true});
assert.strictEqual(allocs,1);

assert.ok(src.includes("trendosWithLock_('script'"));
assert.ok(src.includes('makeOrderId_(lines, now, true)'));
assert.ok(src.includes('staleRow:true'));
assert.ok(src.includes('activeDuplicate:true'));
assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(src));
assert.ok(!/EAA[A-Za-z0-9]{30,}/.test(src));
console.log('TrendOS Phase 2 Order/Line integrity tests: OK');
