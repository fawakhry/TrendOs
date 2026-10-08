"""SELECT-only live follow-up. Emit aggregates; never customer rows or tokens."""
import json,os,re,subprocess,sys,urllib.request
from urllib.error import HTTPError
from datetime import datetime,timezone
from pathlib import Path
from t12_live_bundle_inventory_readonly import extract_modules,fingerprint
API='https://api.cloudflare.com/client/v4/accounts/'+os.environ['CLOUDFLARE_ACCOUNT_ID']
TOKEN=os.environ['CLOUDFLARE_API_TOKEN'];DB='5c4b92bf-e043-4f6e-bd6d-d514a92cd825'
REPORT={'checkedAtUTC':datetime.now(timezone.utc).isoformat(),'readOnly':True,'businessWrite':False,'productionFaultInjected':False,'firstPostdeployOrderNumber':4818}
def cf(path,payload=None):
 if payload is not None:
  sql=payload.get('sql','');assert path.endswith('/query') and re.match(r'^\s*SELECT\b',sql,re.I) and ';' not in sql and not re.search(r'\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|REPLACE|PRAGMA)\b',sql,re.I)
 request=urllib.request.Request(API+path,data=None if payload is None else json.dumps(payload).encode(),headers={'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'})
 with urllib.request.urlopen(request,timeout=45) as response:raw=response.read();headers=response.headers
 result=json.loads(raw);assert result.get('success') is True;return result['result']
def rows(sql):
 result=cf('/d1/database/'+DB+'/query',{'sql':sql});assert all(x.get('success') for x in result);return result[0]['results']
def health(path):
 out=subprocess.run(['curl','--fail','--silent','--show-error','https://trendos-d1-api.trendmall-contact.workers.dev'+path+'?monitor='+str(datetime.now(timezone.utc).timestamp())],capture_output=True,check=True)
 x=json.loads(out.stdout);return {k:x[k] for k in ['success','mode','version','schemaReady','customerLaneClaimReady','policyEpoch','nativeOnly','userCount','nativeReadyCount','mustChangeCount','authoritativeWrites','writeAuthorityMode','r2Ready'] if k in x}
def main():
 REPORT['health']={k:health(p) for k,p in [('create','/v1/t12/orders/create/health'),('auth','/v1/employee/auth/health'),('accounting','/v1/employee/accounting/health'),('core','/v1/employee/core/health'),('content','/v1/employee/content/health'),('comms','/v1/employee/comms/health')]}
 c=REPORT['health']['create'];assert c['mode']=='GENERAL' and c['customerLaneClaimReady'] is True and 'ATOMIC_CANDIDATE_V2' in c['version']
 # Only aggregate command state, without actors, request keys or payloads.
 REPORT['accountingCustodyEvidence']=rows("SELECT (SELECT COUNT(*) FROM employee_accounting_request_ledger_v1) AS requestLedger,(SELECT COUNT(*) FROM employee_accounting_request_ledger_v1 WHERE operation='custody-close' AND status='PREPARED') AS preparedCustodyCloses,(SELECT COUNT(*) FROM employee_accounting_request_ledger_v1 WHERE operation='custody-close' AND status='COMMITTED') AS committedCustodyCloses,(SELECT COUNT(*) FROM employee_accounting_events_v1) AS auditEvents,(SELECT COUNT(*) FROM employee_accounting_custody_closes_v1) AS custodyCloses,(SELECT COUNT(*) FROM employee_accounting_custody_events_v1) AS custodyEvents,(SELECT COUNT(*) FROM employee_accounting_cashbox_v1) AS cashboxMovements")[0]
 # R2 read permission is probed without bucket creation or binding changes.
 try:
  bucket=cf('/r2/buckets/trendos-employee-content-files')
  REPORT['contentR2Prerequisite']={'bucketRead':'PASS','dedicatedBucketExists':bucket.get('name')=='trendos-employee-content-files'}
 except HTTPError as e:
  REPORT['contentR2Prerequisite']={'bucketRead':'BLOCKED','httpStatus':e.code,'bucketExistence':'UNKNOWN','bucketCreated':False,'bindingChanged':False}
 REPORT['counts']=rows("SELECT (SELECT COUNT(*) FROM t12_prod_orders WHERE CAST(order_id AS INTEGER)>=4818) AS postdeployOrders,(SELECT COUNT(*) FROM t12_prod_lines WHERE CAST(order_id AS INTEGER)>=4818) AS postdeployLines,(SELECT COUNT(*) FROM t12_prod_customer_lane_claim) AS claims,(SELECT COUNT(*) FROM t12_prod_request_ledger WHERE CAST(order_id AS INTEGER)>=4818 AND status!='COMMITTED') AS uncommittedPostdeployLedgers,(SELECT COUNT(*) FROM t12_prod_request_ledger WHERE CAST(order_id AS INTEGER)>=4818 AND json_extract(response_json,'$.partialMultiDepartment')=1) AS partialMultiResponses,(SELECT COUNT(*) FROM t12_prod_request_ledger WHERE CAST(order_id AS INTEGER)>=4818 AND json_array_length(json_extract(response_json,'$.createdDepartments'))=2) AS fullMultiResponses,(SELECT COUNT(*) FROM t12_prod_customer_lane_claim c LEFT JOIN t12_prod_orders o ON o.order_id=c.order_id WHERE o.order_id IS NULL) AS orphanClaims")[0]
 REPORT['routing']=rows("SELECT (SELECT COUNT(*) FROM t12_prod_lines l JOIN t12_prod_request_ledger r ON r.request_key=l.request_key WHERE CAST(l.order_id AS INTEGER)>=4818 AND l.department NOT IN (SELECT value FROM json_each(r.response_json,'$.createdDepartments'))) AS unexpectedCreatedLanes,(SELECT COUNT(*) FROM t12_prod_outbox q JOIN t12_prod_lines l ON l.line_id=q.line_id JOIN t12_prod_request_ledger r ON r.request_key=q.request_key WHERE CAST(q.order_id AS INTEGER)>=4818 AND l.department IN (SELECT json_extract(value,'$.department') FROM json_each(r.response_json,'$.skippedDepartments'))) AS skippedLaneQueueEvents,(SELECT COUNT(*) FROM t12_prod_lines l WHERE CAST(l.order_id AS INTEGER)>=4818 AND l.department='ليزر' AND (l.heat_press!=0 OR l.fly_print!=0)) AS laserWithPrintFlags,(SELECT COUNT(*) FROM t12_prod_lines l WHERE CAST(l.order_id AS INTEGER)>=4818 AND NOT EXISTS (SELECT 1 FROM t12_prod_outbox q WHERE q.line_id=l.line_id AND q.event_key LIKE 'queue:%')) AS linesWithoutCreateQueue")[0]
 # Customer rows remain only in process memory and stdin to the mapper; never
 # written to disk or emitted to Actions logs/artifacts.
 native=rows('SELECT o.order_id AS orderId,o.customer_mode AS mode,o.customer_name AS customerName,o.customer_phone AS customerPhone,o.external_customer_id AS externalCustomerId,l.line_id AS lineId,l.department,COALESCE(rt.status,l.status) AS status FROM t12_prod_orders o JOIN t12_prod_lines l ON l.order_id=o.order_id LEFT JOIN t12_prod_line_runtime rt ON rt.line_id=l.line_id ORDER BY CAST(o.order_id AS INTEGER),l.ordinal')
 catalog=rows("SELECT headers_json AS headersJson,status FROM sheet_catalog WHERE sheet_name='بنود الأوردرات'")[0]
 legacy=rows("SELECT row_number AS rowNumber,values_json AS valuesJson,display_json AS displayJson FROM sheet_rows WHERE sheet_name='بنود الأوردرات' ORDER BY row_number")
 runtime=rows('SELECT line_id AS lineId,order_id AS orderId,status,notes,source_row_number AS sourceRowNumber,source_mirror_synced_at AS sourceMirrorSyncedAt,version,updated_at AS updatedAt FROM t12_legacy_line_runtime')
 p=subprocess.run(['node','scripts/t12_postdeploy_lane_monitor_aggregate.mjs'],input=json.dumps({'native':native,'catalog':catalog,'rows':legacy,'runtime':runtime}),capture_output=True,text=True)
 assert p.returncode==0,'PRIVATE_AGGREGATION_FAILED';REPORT['identityAudit']=json.loads(p.stdout)
 REPORT['limitations']={'rejectedAttemptsPersisted':False,'replayCountsPersisted':False,'employeeScreenObserved':False,'snapshotIsHistoricalAdmissionProof':False}
 # Rejected CREATE/replays do not append a ledger event. Neither absent new
 # duplicates nor stored partial responses prove an employee saw the UI.
 anomalies=sum(REPORT['routing'].values())+REPORT['counts']['orphanClaims']+REPORT['counts']['uncommittedPostdeployLedgers']+REPORT['identityAudit']['postdeployOpenLinesWithAnotherOpenOrder']
 REPORT['state']='REVIEW_REQUIRED' if anomalies else ('LIVE_ORDERS_OBSERVED_NO_STORED_ANOMALY' if REPORT['counts']['postdeployOrders'] else 'HEALTH_PASS_WAITING_REAL_TRAFFIC')
 REPORT['anomalyCount']=anomalies
try:main()
except Exception:
 REPORT['state']='MONITOR_FAILED';raise
finally:
 Path('/tmp/t12-postdeploy-monitor-sanitized.json').write_text(json.dumps(REPORT,indent=2))
 print('::notice title=T12_POSTDEPLOY_MONITOR::'+json.dumps(REPORT,separators=(',',':')))
