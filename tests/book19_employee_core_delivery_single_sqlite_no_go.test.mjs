import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import { webcrypto } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const source=fs.readFileSync('cloudflare-d1/src/employee-core-native-v1.mjs','utf8');
assert.match(source,/verifyEmployeeSessionCloudFirst/);
const worker=source.replace(/^import \{ verifyEmployeeSessionCloudFirst \} from '\.\/cloud-session-bridge-v3\.mjs';\s*/,'').replace(/^export /gm,'');
const db=new DatabaseSync(':memory:');
try {
  db.exec(fs.readFileSync('cloudflare-d1/migrations/0016_employee_core_zero_google_v1.sql','utf8'));
  db.exec(fs.readFileSync('cloudflare-d1/migrations/0017_employee_core_current_orders_v1.sql','utf8'));
  // Synthetic minimal T12 schema for actual source SQL queries; NO production data.
  db.exec(`
    CREATE TABLE t12_prod_orders(order_id TEXT PRIMARY KEY,customer_mode TEXT DEFAULT '',
      customer_name TEXT DEFAULT '',customer_phone TEXT DEFAULT '',external_customer_id TEXT DEFAULT '',
      source TEXT DEFAULT '',notes TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,department TEXT DEFAULT '',priority TEXT DEFAULT '',
      status TEXT DEFAULT '',raw_json TEXT DEFAULT '{}');
    CREATE TABLE t12_prod_lines(line_id TEXT PRIMARY KEY,order_id TEXT,ordinal INTEGER DEFAULT 1,
      department TEXT DEFAULT '',assigned_to TEXT DEFAULT '',item_name TEXT DEFAULT '',
      qty REAL DEFAULT 1,priority TEXT DEFAULT '',status TEXT DEFAULT 'طلب جديد',
      heat_press INTEGER DEFAULT 0,fly_print INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE t12_customers(customer_id TEXT PRIMARY KEY,customer_name TEXT,phone TEXT DEFAULT '',
      extra_phone TEXT DEFAULT '',active TEXT DEFAULT 'نعم',debt_amount REAL DEFAULT 0,notes TEXT DEFAULT '');
    CREATE TABLE t12_prod_line_runtime(line_id TEXT PRIMARY KEY,order_id TEXT,status TEXT DEFAULT '',
      notes TEXT DEFAULT '',customer_notified TEXT DEFAULT '',notified_at TEXT DEFAULT '',
      notified_by TEXT DEFAULT '',last_whatsapp_message TEXT DEFAULT '',last_whatsapp_at TEXT DEFAULT '',
      last_whatsapp_by TEXT DEFAULT '',updated_by TEXT DEFAULT '',version INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE t12_prod_runtime_events(event_id INTEGER PRIMARY KEY AUTOINCREMENT,order_id TEXT,
      line_id TEXT,event_type TEXT,old_status TEXT,new_status TEXT,actor TEXT,payload_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    UPDATE employee_core_control_v1 SET mode='GENERAL' WHERE singleton=1;
  `);
  const insImport=(line,order,customer,department,debt)=>{
    db.prepare("INSERT INTO employee_core_orders_v1(order_id,customer_name,active) VALUES(?,?,1)")
      .run(order,customer);
    db.prepare("INSERT INTO employee_core_lines_v1(line_id,order_id,customer_name,department,item_name,status,debt_amount,active) VALUES(?,?,?,?,?,'طلب جديد',?,1)")
      .run(line,order,customer,department,'FAKE_PRINT_JOB',debt);
  };
  insImport('FAKE_L_BLOCKED','FAKE_O_BLOCKED','Debt Blocked','طباعة',35);
  insImport('FAKE_L_NO_RESTRICT','FAKE_O_NO_RESTRICT','Debt Not Restricted','طباعة',35);
  insImport('FAKE_L_EXPIRED','FAKE_O_EXPIRED','Debt Expired','طباعة',35);
  insImport('FAKE_L_NO_DEBT','FAKE_O_NO_DEBT','Debt Clear','طباعة',0);
  insImport('FAKE_L_LASER','FAKE_O_LASER','Other Department','ليزر',25);
  insImport('FAKE_L_RACE_BAN','FAKE_O_RACE_BAN','Imported Race Ban','طباعة',32);
  insImport('FAKE_L_RACE_DEBT','FAKE_O_RACE_DEBT','Imported Race Debt','طباعة',0);
  insImport('FAKE_L_RACE_BULK','FAKE_O_RACE_BULK','Imported Race Bulk','طباعة',28);
  db.prepare("UPDATE employee_core_lines_v1 SET status='تحت التنفيذ' WHERE line_id='FAKE_L_RACE_BULK'").run();
  const insCloud=(line,order,name,phone,debt)=>{
    db.prepare("INSERT INTO t12_prod_orders(order_id,customer_name,customer_phone,department) VALUES(?,?,?,'طباعة')")
      .run(order,name,phone);
    db.prepare("INSERT INTO t12_prod_lines(line_id,order_id,department,item_name,status) VALUES(?,?,'طباعة','FAKE_PAPER','طلب جديد')")
      .run(line,order);
    db.prepare("INSERT INTO t12_customers(customer_id,customer_name,phone,debt_amount) VALUES(?,?,?,?)")
      .run('FAKE_CUSTOMER_'+line,name,phone,debt);
  };
  insCloud('FAKE_T12_BLOCKED','FAKE_T12_O_BLOCKED','Native Blocked','FAKE_PHONE_001',40);
  insCloud('FAKE_T12_CLEAR','FAKE_T12_O_CLEAR','Native Clear','FAKE_PHONE_002',0);
  insCloud('FAKE_T12_RACE_BAN','FAKE_T12_O_RACE_BAN','Native Race Ban','FAKE_PHONE_003',40);
  insCloud('FAKE_T12_RACE_DEBT','FAKE_T12_O_RACE_DEBT','Native Race Debt','FAKE_PHONE_004',0);
  for(const [key,name,until] of [
    ['debt blocked','Debt Blocked',''],['debt expired','Debt Expired','2001-01-01'],
    ['other department','Other Department',''],['native blocked','Native Blocked',''],
    ['native clear','Native Clear',''],['imported race debt','Imported Race Debt',''],
    ['native race debt','Native Race Debt','']
  ])db.prepare("INSERT INTO employee_core_delivery_restrictions_v1(customer_key,customer_name,valid_until) VALUES(?,?,?)")
    .run(key,name,until);

  let beforeStatusWrite=null,beforeBulkBatch=null;
  const DB={
    prepare(sql){
      const s={sql:String(sql),args:[]};
      const w={
        bind(...args){s.args=args;return w;},
        async first(){return db.prepare(s.sql).get(...s.args)||null;},
        async all(){return {results:db.prepare(s.sql).all(...s.args)};},
        async run(){
          if(beforeStatusWrite && /UPDATE employee_core_lines_v1 SET status=CASE|INSERT INTO t12_prod_line_runtime\(line_id,order_id,status,notes,updated_by/.test(s.sql)){
            const mutation=beforeStatusWrite;beforeStatusWrite=null;mutation();
          }
          return db.prepare(s.sql).run(...s.args);
        }
      };w.__statement=s;return w;
    },
    async batch(stmts){
      if(beforeBulkBatch){const mutation=beforeBulkBatch;beforeBulkBatch=null;mutation();}
      db.exec('BEGIN IMMEDIATE');
      try{
        const result=stmts.map(x=>db.prepare(x.__statement.sql).run(...x.__statement.args));
        db.exec('COMMIT');return result;
      }catch(e){db.exec('ROLLBACK');throw e;}
    }
  };
  const env={DB,CORS_ORIGINS:'https://fawakhry.github.io'};
  let role='service',department='خدمة العملاء',network=0;
  const context=vm.createContext({
    crypto:webcrypto,TextEncoder,Date,Math,Intl,JSON,URL,Response,Request,Headers,console,
    verifyEmployeeSessionCloudFirst:async(username,token)=>{
      if(username!=='FAKE_ONLY_CORE_EMPLOYEE'||token!=='FAKE_CORE_TOKEN')
        return {ok:false,message:'fake token rejected'};
      return {ok:true,authSource:'FAKE_NOT_REAL_SSO',body:{user:{
        username:'FAKE_ONLY_CORE_EMPLOYEE',role,department
      }}};
    }
  });
  vm.runInContext(worker+'\n;globalThis.handleFakeCore=handleEmployeeCoreNativeRequest;',context,{timeout:18000});
  async function send(action,b={},override={}){
    const previous=globalThis.fetch;
    globalThis.fetch=()=>{network++;throw Error('NETWORK_FORBIDDEN')};
    try{
      const resp=await context.handleFakeCore(new Request('https://offline.invalid/v1/employee/core',{
        method:'POST',headers:{Origin:'https://fawakhry.github.io','Content-Type':'application/json',
          Authorization:'Bearer '+(override.token||'FAKE_CORE_TOKEN')},
        body:JSON.stringify({action,username:'FAKE_ONLY_CORE_EMPLOYEE',...b})
      }),env);
      return {httpStatus:resp.status,...await resp.json()};
    }finally{globalThis.fetch=previous;}
  }
  const one=(sql,...args)=>db.prepare(sql).get(...args);
  const effects=()=>Object.fromEntries([
    'employee_core_lines_v1','t12_prod_line_runtime','employee_core_events_v1',
    't12_prod_runtime_events','employee_core_archive_lines_v1'
  ].map(name=>[name,db.prepare('SELECT * FROM '+name+' ORDER BY rowid').all()]));

  await test('01 local core default OFF denies writes even with an installed schema',async()=>{
    db.exec("UPDATE employee_core_control_v1 SET mode='OFF' WHERE singleton=1");
    const before=effects();
    const r=await send('updateLine',{lineId:'FAKE_L_BLOCKED',status:'تم التسليم'});
    assert.equal(r.success,false);
    assert.equal(r.code,'employee-core-off');
    assert.deepEqual(effects(),before);
    db.exec("UPDATE employee_core_control_v1 SET mode='GENERAL' WHERE singleton=1");
  });
  await test('02 imported customer debt + active delivery restriction blocks single-line delivery',async()=>{
    const before=effects();
    const r=await send('updateLine',{lineId:'FAKE_L_BLOCKED',status:'تم التسليم'});
    assert.equal(r.success,false,JSON.stringify(r));
    assert.equal(r.deliveryBlocked,true,JSON.stringify(r));
    assert.deepEqual(effects(),before,'no write or audit on restricted delivery');
  });
  await test('03 T12 native debt + restriction blocks runtime single-line delivery',async()=>{
    const before=effects();
    const r=await send('updateLine',{lineId:'FAKE_T12_BLOCKED',status:'تم التسليم'});
    assert.equal(r.success,false,JSON.stringify(r));
    assert.equal(r.deliveryBlocked,true);
    assert.deepEqual(effects(),before,'no inserted T12 runtime state');
  });
  await test('04 verified print role cannot alter a laser line even when body forges service/admin',async()=>{
    const before=effects();
    role='print';department='طباعة';
    try{
      const r=await send('updateLine',{lineId:'FAKE_L_LASER',status:'بدأ التنفيذ',
        role:'admin',screen:'laser',department:'ليزر'});
      assert.equal(r.success,false,JSON.stringify(r));
      assert.equal(r.code,'employee-core-line-department-denied',JSON.stringify(r));
      assert.deepEqual(effects(),before);
    }finally{role='service';department='خدمة العملاء';}
  });
  await test('05 delivery policy does not prohibit debt if no active restricted-customer record',async()=>{
    const r=await send('updateLine',{lineId:'FAKE_L_NO_RESTRICT',status:'تم التسليم'});
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(one("SELECT status FROM employee_core_lines_v1 WHERE line_id='FAKE_L_NO_RESTRICT'").status,'تم التسليم');
  });
  await test('06 expired restriction and debt=0 do not block legitimate delivery',async()=>{
    for(const id of ['FAKE_L_EXPIRED','FAKE_L_NO_DEBT','FAKE_T12_CLEAR']){
      const r=await send('updateLine',{lineId:id,status:'تم التسليم'});
      assert.equal(r.success,true,id+' '+JSON.stringify(r));
    }
    assert.equal(one("SELECT status FROM t12_prod_line_runtime WHERE line_id='FAKE_T12_CLEAR'").status,'تم التسليم');
  });
  await test('07 changing blocked customer to non-delivery status or notes remains allowed to authorized service',async()=>{
    const r=await send('updateLine',{lineId:'FAKE_L_BLOCKED',status:'تحت التنفيذ',notes:'FAKE_NOT_FINANCIAL'});
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(one("SELECT status FROM employee_core_lines_v1 WHERE line_id='FAKE_L_BLOCKED'").status,'تحت التنفيذ');
  });
  await test('08 restricted customer bulk delivery retains earlier skip policy and allows only eligible items',async()=>{
    const before=one("SELECT status FROM employee_core_lines_v1 WHERE line_id='FAKE_L_BLOCKED'").status;
    role='print';department='طباعة';
    let r;
    try{
      r=await send('bulkUpdateDepartmentStatusV1926',{screen:'print',
        fromStatus:'تحت التنفيذ',toStatus:'تم التسليم',requestId:'FAKE_BULK_GATE_20261016_001'});
    }finally{role='service';department='خدمة العملاء';}
    assert.equal(r.success,true,JSON.stringify(r));
    assert.equal(r.skippedDebt>=1,true,JSON.stringify(r));
    assert.equal(one("SELECT status FROM employee_core_lines_v1 WHERE line_id='FAKE_L_BLOCKED'").status,before);
  });
  await test('09 invalid synthetic token is denied before any business write',async()=>{
    const before=effects();
    const r=await send('updateLine',{lineId:'FAKE_L_BLOCKED',status:'تم التسليم'},{token:'WRONG'});
    assert.equal(r.success,false);
    assert.equal(r.httpStatus,401);
    assert.deepEqual(effects(),before);
    assert.equal(network,0);
  });

  await test('10 BOOK19 injected restriction after imported-line projection must block at SQL write time',async()=>{
    const id='FAKE_L_RACE_BAN',prior=one('SELECT status,version FROM employee_core_lines_v1 WHERE line_id=?',id);
    const ev=one("SELECT COUNT(*) AS n FROM employee_core_events_v1").n;
    let injected=false;
    beforeStatusWrite=()=>{
      injected=true;
      db.prepare("INSERT INTO employee_core_delivery_restrictions_v1(customer_key,customer_name,active) VALUES(?,?,1)")
        .run('imported race ban','Imported Race Ban');
    };
    let result;
    try{result=await send('updateLine',{lineId:id,status:'تم التسليم'});}
    finally{beforeStatusWrite=null;}
    assert.equal(injected,true,'the fake restriction must arrive after initial eligibility projection');
    assert.equal(result.success,false,JSON.stringify(result));
    assert.equal(result.deliveryBlocked,true,JSON.stringify(result));
    assert.deepEqual(one('SELECT status,version FROM employee_core_lines_v1 WHERE line_id=?',id),prior);
    assert.equal(one("SELECT COUNT(*) AS n FROM employee_core_events_v1").n,ev);
  });
  await test('11 BOOK19 imported line turns indebted during write gap; live debt row must be checked',async()=>{
    const id='FAKE_L_RACE_DEBT',prior=one('SELECT status,version FROM employee_core_lines_v1 WHERE line_id=?',id);
    const ev=one("SELECT COUNT(*) AS n FROM employee_core_events_v1").n;
    let injected=false;
    beforeStatusWrite=()=>{
      injected=true;
      db.prepare('UPDATE employee_core_lines_v1 SET debt_amount=19 WHERE line_id=?').run(id);
    };
    let result;
    try{result=await send('updateLine',{lineId:id,status:'تم التسليم'});}
    finally{beforeStatusWrite=null;}
    assert.equal(injected,true);
    assert.equal(result.success,false,JSON.stringify(result));
    assert.equal(result.deliveryBlocked,true,JSON.stringify(result));
    assert.deepEqual(one('SELECT status,version FROM employee_core_lines_v1 WHERE line_id=?',id),prior);
    assert.equal(one("SELECT debt_amount FROM employee_core_lines_v1 WHERE line_id=?",id).debt_amount,19);
    assert.equal(one("SELECT COUNT(*) AS n FROM employee_core_events_v1").n,ev);
  });
  await test('12 BOOK19 T12 restriction becomes active after projection; runtime delivery denied',async()=>{
    const id='FAKE_T12_RACE_BAN',before=effects(),mutated=[];
    beforeStatusWrite=()=>{
      db.prepare("INSERT INTO employee_core_delivery_restrictions_v1(customer_key,customer_name,active) VALUES(?,?,1)")
        .run('native race ban','Native Race Ban');
      mutated.push('yes');
    };
    let result;
    try{result=await send('updateLine',{lineId:id,status:'تم التسليم'});}
    finally{beforeStatusWrite=null;}
    assert.deepEqual(mutated,['yes']);
    assert.equal(result.success,false,JSON.stringify(result));
    assert.equal(result.deliveryBlocked,true,JSON.stringify(result));
    assert.deepEqual(effects(),before,'no runtime row or event created');
  });
  await test('13 BOOK19 T12 customer debt becomes positive immediately before write; must deny delivery',async()=>{
    const id='FAKE_T12_RACE_DEBT',before=effects();
    let injected=false;
    beforeStatusWrite=()=>{
      injected=true;
      db.prepare("UPDATE t12_customers SET debt_amount=29 WHERE customer_id=?").run('FAKE_CUSTOMER_'+id);
    };
    let result;
    try{result=await send('updateLine',{lineId:id,status:'تم التسليم'});}
    finally{beforeStatusWrite=null;}
    assert.equal(injected,true);
    assert.equal(result.success,false,JSON.stringify(result));
    assert.equal(result.deliveryBlocked,true,JSON.stringify(result));
    assert.deepEqual(effects(),before);
  });
  await test('14 BOOK19 bulk candidate restriction changes after projection; batch cannot deliver disallowed row',async()=>{
    // Earlier bulk-control test may have delivered this fixture; reset only fake
    // local state to ensure this scenario really reaches the batch writer.
    db.prepare("UPDATE employee_core_lines_v1 SET status='تحت التنفيذ' WHERE line_id=?").run('FAKE_L_RACE_BULK');
    role='print';department='طباعة';
    const before=one("SELECT status,version FROM employee_core_lines_v1 WHERE line_id='FAKE_L_RACE_BULK'");
    let injected=false;
    beforeBulkBatch=()=>{
      injected=true;
      db.prepare("INSERT INTO employee_core_delivery_restrictions_v1(customer_key,customer_name,active) VALUES(?,?,1)")
        .run('imported race bulk','Imported Race Bulk');
    };
    let result;
    try{result=await send('bulkUpdateDepartmentStatusV1926',{
      screen:'print',fromStatus:'تحت التنفيذ',toStatus:'تم التسليم',
      requestId:'FAKE_BULK_RACE_GUARD_20261016_01'
    });}finally{role='service';department='خدمة العملاء';beforeBulkBatch=null;}
    assert.equal(injected,true,'the fake restriction must arrive before transactional batch');
    assert.equal(result.success,false,JSON.stringify(result));
    assert.deepEqual(one("SELECT status,version FROM employee_core_lines_v1 WHERE line_id='FAKE_L_RACE_BULK'"),before);
  });
  console.log('BOOK19_NATIVE_SINGLE_DELIVERY=FAKE_SQLITE_SOURCE_ONLY');
  console.log('BOOK19_CORE_FINANCE_RELEASE=NO_GO');
  console.log('BOOK19_PRODUCTION_MUTATION=NO');
} finally { db.close(); }
