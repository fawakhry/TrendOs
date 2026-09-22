/*
 * T12 pure, fail-closed logical-client-key retry disposition (offline).
 * This DOES NOT mint a key, authenticate, trust browser state, read a ledger,
 * or authorize a live create. The calling server must verify a durable ledger
 * and persist the logical intent before any network send or browser reload.
 */
import {classifyT12ClientRequestKey} from './t12-cloud-client-key-admission.mjs';
export const T12_CLIENT_KEY_CONTINUITY_GUARD_VERSION='T12_CLIENT_KEY_CONTINUITY_20260922';
const DIGEST=/^[a-f0-9]{64}$/;
const EPOCH=/^[A-Za-z0-9_-]{8,100}$/;
const STATES=new Set(['PREPARED_NEVER_SENT','MAY_HAVE_SENT','COMMITTED','CONFLICT']);
function plain(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);}
function result(disposition,reason){return Object.freeze({success:disposition!=='REFUSE',
  productionAuthorized:false,createAuthorized:false,mutationFree:true,
  version:T12_CLIENT_KEY_CONTINUITY_GUARD_VERSION,disposition,reason});}
/**
 * record must be an already READ+VERIFIED server-ledger record, never
 * arbitrary browser/caller flags. This pure function cannot verify provenance.
 */
export function planT12ClientKeyContinuity({rawKey,actorSubject,intentDigest,cutoverEpoch,record}={}){
  if(typeof rawKey!=='string')return result('REFUSE','raw-client-key-required');
  const key=classifyT12ClientRequestKey(rawKey);
  if(key.kind==='LEGACY_REPLAY_ONLY')
    return result('HISTORIC_LOOKUP_ONLY','legacy-key-never-a-new-cloud-create');
  if(key.kind!=='CLOUD_SYNTHETIC_ELIGIBLE')
    return result('REFUSE','invalid-or-noncloud-client-key');
  if(typeof actorSubject!=='string'||actorSubject.length<3||actorSubject.length>140||
    actorSubject!==actorSubject.trim()||/\s/.test(actorSubject)||
    typeof intentDigest!=='string'||!DIGEST.test(intentDigest)||
    typeof cutoverEpoch!=='string'||!EPOCH.test(cutoverEpoch))
    return result('REFUSE','server-actor-digest-and-cutover-epoch-required');
  if(!plain(record))return result('REFUSE','missing-trusted-durable-ledger-record');
  if(record.clientRequestId!==rawKey||record.actorSubject!==actorSubject||
    record.intentDigest!==intentDigest||record.cutoverEpoch!==cutoverEpoch)
    return result('REFUSE','key-actor-payload-or-epoch-conflict');
  if(!STATES.has(record.deliveryState))return result('REFUSE','unknown-ledger-delivery-state');
  if(record.deliveryState==='CONFLICT')return result('REFUSE','prior-ledger-conflict');
  if(record.deliveryState==='MAY_HAVE_SENT')return result('LEDGER_RECONCILIATION_ONLY',
    'ambiguous-timeout-must-not-mint-or-send-new-create');
  if(record.deliveryState==='COMMITTED')return result('VERIFIED_RECEIPT_LOOKUP_ONLY',
    'committed-order-must-be-confirmed-in-canonical-ledger-and-lines');
  return result('RESUME_SAME_KEY_AFTER_INDEPENDENT_SERVER_ADMISSION',
    'prepared-key-must-persist-across-reload-and-auth-must-be-revalidated');
}
