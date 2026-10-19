// LOCAL pilot only; actual HTTP and the repository's existing manager-center-v1932.js.
// No remote Cloudflare/Google/D1 connectors, money, or customer records.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {inspectCoreD1ReadContractV1,syntheticCoreD1ReadFixtureV1} from './core-d1-read-compatibility-v1.mjs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const dir=dirname(fileURLToPath(import.meta.url)),project=resolve(dir,'../..');
const flow=['طلب جديد','جاري التنفيذ','جاهز للتسليم','تم التسليم'];
const products=Object.freeze({'تابلوه':'تابلوه 30×40','مج':'مج 20×9','استيكر':'استيكر 7×10'});
const depts=new Set(['التصميم','الطباعة','الليزر']);
const security={
  'cache-control':'no-store','x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer','x-frame-options':'DENY',
  'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
};
function reply(res,status,object){res.writeHead(status,{...security,'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(object))}
function deny(res,status,code){reply(res,status,{success:false,code,mode:'SYNTHETIC_LOCAL_ONLY',financeRelease:'NO_GO'})}
function prepare(db){
  db.exec("PRAGMA foreign_keys=ON;"+
    "CREATE TABLE orders (id TEXT PRIMARY KEY,customer TEXT NOT NULL CHECK(customer LIKE 'عميل تجريبي%'),product TEXT NOT NULL,department TEXT NOT NULL,status TEXT NOT NULL,blocked INTEGER NOT NULL CHECK(blocked IN (0,1)),priority TEXT NOT NULL,created_seq INTEGER NOT NULL UNIQUE);"+
    "CREATE TABLE history (id INTEGER PRIMARY KEY AUTOINCREMENT,order_id TEXT NOT NULL REFERENCES orders(id),previous_status TEXT NOT NULL,next_status TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);");
  const q=db.prepare('INSERT INTO orders(id,customer,product,department,status,blocked,priority,created_seq) VALUES(?,?,?,?,?,?,?,?)');
  q.run('DEMO-0001','عميل تجريبي 1',products['تابلوه'],'التصميم','طلب جديد',0,'عادي',1);
  q.run('DEMO-0002','عميل تجريبي 2',products['مج'],'الطباعة','جاري التنفيذ',0,'عاجل',2);
  q.run('DEMO-0003','عميل تجريبي 3',products['استيكر'],'الليزر','جاهز للتسليم',1,'عادي',3);
}
function rows(db){return db.prepare('SELECT id,customer,product,department,status,blocked,priority FROM orders ORDER BY created_seq').all().map(x=>({...x,blocked:!!x.blocked}))}
function manager(db){
  const orders=rows(db),active=orders.filter(x=>x.status!=='تم التسليم'),urgent=active.filter(x=>x.priority==='عاجل'),blocked=active.filter(x=>x.blocked);
  return {success:true,mode:'SYNTHETIC_LOCAL_ONLY',financeRelease:'NO_GO',
    system:{activeLines:active.length,archivedLines:orders.length-active.length,deliveryPolicy:'محاكاة فقط: الطلب المحظور لا يُسلَّم. لا ربط مع الحسابات الحقيقية.'},
    employeePerformance:[...depts].map(dept=>{
      const a=orders.filter(x=>x.department===dept),done=a.filter(x=>x.status==='تم التسليم').length;
      return {employee:'فريق '+dept+' (تجريبي)',department:dept,active:a.length-done,overdue:urgent.filter(x=>x.department===dept).length,completionPercent:a.length?Math.round(done*100/a.length):0,score:a.length?Math.round(done*100/a.length):0};
    }),stockAlerts:[],messageQueue:[],debtControl:{customers:[],restrictions:blocked.map(x=>({orderId:x.id,reason:'منع تسليم تجريبي'}))}};
}
function authorized(req,token){
  const s=req.headers['x-pilot-token'];if(typeof s!=='string')return false;
  const a=Buffer.from(s),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b);
}
function originOK(req){return ['http://127.0.0.1:'+req.socket.localPort,'http://localhost:'+req.socket.localPort].includes(req.headers.origin)}
// The status and its audit event are a single SQLite transaction.
// This remains a disposable local demo, not the production Core API.
export function transitionOrderAtomic(db,id,nextStatus){
  db.exec('SAVEPOINT pilot_order_transition');
  try{
    const old=db.prepare('SELECT status,blocked FROM orders WHERE id=?').get(id);
    let problem='';
    let httpStatus=0;
    if(!old){problem='NOT_FOUND';httpStatus=404;}
    else if(flow[flow.indexOf(old.status)+1]!==nextStatus){
      problem='NO_STATUS_SKIP_OR_REPLAY';httpStatus=409;
    }else if(old.blocked&&nextStatus==='تم التسليم'){
      problem='DEMO_DELIVERY_RESTRICTION';httpStatus=409;
    }
    if(problem){
      db.exec('RELEASE SAVEPOINT pilot_order_transition');
      return {success:false,httpStatus,code:problem};
    }
    const updated=db.prepare('UPDATE orders SET status=? WHERE id=? AND status=?')
      .run(nextStatus,id,old.status);
    if(updated.changes!==1){
      db.exec('ROLLBACK TO SAVEPOINT pilot_order_transition');
      db.exec('RELEASE SAVEPOINT pilot_order_transition');
      return {success:false,httpStatus:409,code:'STALE_STATUS'};
    }
    db.prepare('INSERT INTO history(order_id,previous_status,next_status) VALUES(?,?,?)')
      .run(id,old.status,nextStatus);
    db.exec('RELEASE SAVEPOINT pilot_order_transition');
    return {success:true,id,status:nextStatus};
  }catch(err){
    try{db.exec('ROLLBACK TO SAVEPOINT pilot_order_transition')}catch{}
    try{db.exec('RELEASE SAVEPOINT pilot_order_transition')}catch{}
    throw err;
  }
}
async function bodyJSON(req){
  const buffers=[];let n=0;
  for await(const b of req){n+=b.length;if(n>2048)throw Error('OVER_LIMIT');buffers.push(b)}
  return JSON.parse(Buffer.concat(buffers).toString('utf8'));
}
const staticFiles=new Map([
  ['/',['index.html','text/html; charset=utf-8']],
  ['/pilot.js',['pilot.js','text/javascript; charset=utf-8']],
  ['/manager-center-v1932.js',['manager-center-v1932.js','text/javascript; charset=utf-8']]
]);
export async function startPilot({port=4178}={}){
  if(!Number.isInteger(port)||port<0||port>65535)throw Error('INVALID_PORT');
  const db=new DatabaseSync(':memory:');prepare(db);
  const token=randomBytes(32).toString('hex');
  const server=http.createServer(async(req,res)=>{
    try{
      // Host must match the *actual* bound loopback port, not any localhost port.
      if(!['127.0.0.1:'+req.socket.localPort,'localhost:'+req.socket.localPort]
        .includes(req.headers.host))return deny(res,403,'LOCAL_HOST_ONLY');
      const u=new URL(req.url,'http://127.0.0.1'),name=u.pathname;
      if(req.method==='GET'&&staticFiles.has(name)){
        const [f,type]=staticFiles.get(name);
        const src=f==='manager-center-v1932.js'?resolve(project,f):resolve(dir,f);
        const content=await readFile(src);
        res.writeHead(200,{...security,'content-type':type});return res.end(content);
      }
      if(req.method==='GET'&&name==='/api/session')return reply(res,200,{success:true,token,mode:'SYNTHETIC_LOCAL_ONLY',financeRelease:'NO_GO'});
      if(!authorized(req,token))return deny(res,401,'PILOT_TOKEN_REQUIRED');
      if(req.method==='GET'&&name==='/api/core-read-compatibility')
        return reply(res,200,inspectCoreD1ReadContractV1(syntheticCoreD1ReadFixtureV1()));
      if(req.method==='GET'&&name==='/api/orders')return reply(res,200,{success:true,orders:rows(db),financeRelease:'NO_GO'});
      const auditMatch=/^\/api\/orders\/(DEMO-\d{4,})\/history$/.exec(name);
      if(req.method==='GET'&&auditMatch){
        if(!db.prepare('SELECT 1 FROM orders WHERE id=?').get(auditMatch[1]))
          return deny(res,404,'NOT_FOUND');
        const history=db.prepare('SELECT previous_status AS previousStatus,next_status AS nextStatus,created_at AS createdAt FROM history WHERE order_id=? ORDER BY id ASC').all(auditMatch[1]);
        return reply(res,200,{success:true,id:auditMatch[1],history,financeRelease:'NO_GO'});
      }
      if(req.method==='GET'&&name==='/api/manager')return reply(res,200,manager(db));
      if(req.method==='POST'){
        if(!originOK(req))return deny(res,403,'PILOT_LOCAL_ORIGIN_REQUIRED');
        if(req.headers['content-type']?.split(';')[0]!=='application/json')return deny(res,415,'JSON_ONLY');
        const p=await bodyJSON(req);
        if(!p||typeof p!=='object'||Array.isArray(p))return deny(res,400,'OBJECT_REQUIRED');
        if(name==='/api/orders'){
          // Only enums; reject names, phones, amounts, customer IDs, finance input.
          const ks=Object.keys(p);
          if(ks.length!==2||!ks.includes('product')||!ks.includes('department')||
            !Object.hasOwn(products,p.product)||!depts.has(p.department))return deny(res,400,'SYNTHETIC_FIELDS_ONLY');
          const n=db.prepare('SELECT COALESCE(MAX(created_seq),0)+1 AS next FROM orders').get().next;
          const id='DEMO-'+String(n).padStart(4,'0');
          db.prepare("INSERT INTO orders(id,customer,product,department,status,blocked,priority,created_seq) VALUES(?,?,?,?,'طلب جديد',0,'عادي',?)")
            .run(id,'عميل تجريبي '+n,products[p.product],p.department,n);
          return reply(res,201,{success:true,id});
        }
        const m=/^\/api\/orders\/(DEMO-\d{4,})\/status$/.exec(name);
        if(m){
          if(Object.keys(p).length!==1||typeof p.status!=='string')return deny(res,400,'STATUS_ONLY');
          const result=transitionOrderAtomic(db,m[1],p.status);
          if(!result.success)return deny(res,result.httpStatus,result.code);
          return reply(res,200,result);
        }
        return deny(res,403,'FINANCE_AND_OTHER_WRITES_OFF');
      }
      return deny(res,403,'UNLISTED_API_DENIED');
    }catch(e){
      if(e?.message==='OVER_LIMIT')return deny(res,413,'BODY_TOO_LARGE');
      if(e instanceof SyntaxError)return deny(res,400,'INVALID_JSON');
      return deny(res,500,'PILOT_ERROR_NO_INTERNAL_DETAILS');
    }
  });
  try{await new Promise((ok,bad)=>{server.once('error',bad);server.listen(port,'127.0.0.1',()=>{server.off('error',bad);ok()})})}
  catch(err){db.close();throw err}
  let stopped=false;
  return {server,port:server.address().port,close:async()=>{
    if(stopped)return;stopped=true;
    await new Promise((ok,bad)=>server.close(e=>e?bad(e):ok()));
    db.close();
  }};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const app=await startPilot({port:Number(process.env.PILOT_PORT??4178)});
    process.stdout.write('PILOT_READY=http://127.0.0.1:'+app.port+'\nSYNTHETIC_ONLY=YES; FINANCE_RELEASE=NO_GO; NO_CLOUD_CONNECTORS=YES\n');
    const stop=()=>app.close().then(()=>process.exit(0)).catch(()=>process.exit(1));
    process.on('SIGINT',stop);process.on('SIGTERM',stop);
  }catch{process.stderr.write('PILOT_START_FAILED\n');process.exitCode=1}
}
