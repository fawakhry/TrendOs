/**
 * TrendOS D1 Fast Auth V2.5 SAFE — prepared source only, NOT deployed.
 * Orders-read optimization. Requires explicit lifecycle invalidation wiring before production use.
 */
const TRENDOS_FAST_AUTH_V25_VERSION='D1_FAST_AUTH_V25_SAFE_20260830';
const TRENDOS_FAST_AUTH_V25_ENABLED_PROP='TRENDOS_FAST_AUTH_V25_ENABLED';
const TRENDOS_FAST_AUTH_V25_TTL_SEC=120;
const TRENDOS_FAST_AUTH_V25_REV_PREFIX='TRENDOS_AUTH_REV_V25_';
const TRENDOS_FAST_AUTH_V25_CACHE_PREFIX='TRENDOS_AUTH_V25_';

function trendosFastAuthTextV25_(v){return String(v==null?'':v).trim();}
function trendosFastAuthNormUserV25_(v){return typeof normalize_==='function'?normalize_(v):trendosFastAuthTextV25_(v).toLowerCase();}
function trendosFastAuthBoolV25_(v){const s=trendosFastAuthTextV25_(v).toLowerCase();return['1','true','yes','نعم','on'].indexOf(s)!==-1;}
function trendosFastAuthEnabledV25_(){try{return trendosFastAuthBoolV25_(PropertiesService.getScriptProperties().getProperty(TRENDOS_FAST_AUTH_V25_ENABLED_PROP));}catch(e){return false;}}
function trendosFastAuthDigestV25_(v){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,trendosFastAuthTextV25_(v),Utilities.Charset.UTF_8);return bytes.map(b=>(b<0?b+256:b).toString(16).padStart(2,'0')).join('');}
function trendosFastAuthRevPropV25_(username){return TRENDOS_FAST_AUTH_V25_REV_PREFIX+trendosFastAuthDigestV25_(trendosFastAuthNormUserV25_(username)).slice(0,32);}
function trendosFastAuthRevisionV25_(username){const v=PropertiesService.getScriptProperties().getProperty(trendosFastAuthRevPropV25_(username));return trendosFastAuthTextV25_(v)||'0';}
function trendosFastAuthCacheKeyV25_(username,token,revision){const u=trendosFastAuthNormUserV25_(username),t=trendosFastAuthTextV25_(token),r=trendosFastAuthTextV25_(revision||'0');if(!u||!t)return'';return TRENDOS_FAST_AUTH_V25_CACHE_PREFIX+trendosFastAuthDigestV25_([u,t,r].join('|')).slice(0,48);}

function trendosFastAuthSafeUserV25_(user){
  user=user||{};
  return{
    username:trendosFastAuthTextV25_(user.username||user.name),
    name:trendosFastAuthTextV25_(user.name||user.username),
    department:trendosFastAuthTextV25_(user.department),
    role:trendosFastAuthTextV25_(user.role),
    active:trendosFastAuthTextV25_(user.active),
    mustChange:trendosFastAuthTextV25_(user.mustChange),
    lastLogin:user.lastLogin||''
  };
}
function trendosFastAuthActiveAllowedV25_(active){const s=trendosFastAuthTextV25_(active);return !s||s==='نعم';}
function trendosFastAuthSessionExpiredV25_(lastLogin){return typeof sessionExpiredV1922_==='function'?sessionExpiredV1922_(lastLogin):false;}
function trendosFastAuthReadCachedV25_(username,token,revision){
  const key=trendosFastAuthCacheKeyV25_(username,token,revision);if(!key)return null;let raw='';try{raw=CacheService.getScriptCache().get(key)||'';}catch(e){return null;}if(!raw)return null;
  let x=null;try{x=JSON.parse(raw);}catch(e){try{CacheService.getScriptCache().remove(key);}catch(_e){}return null;}
  if(!x||x.version!==TRENDOS_FAST_AUTH_V25_VERSION||trendosFastAuthTextV25_(x.revision)!==trendosFastAuthTextV25_(revision)){try{CacheService.getScriptCache().remove(key);}catch(e){}return null;}
  const user=trendosFastAuthSafeUserV25_(x.user||{});if(trendosFastAuthNormUserV25_(user.username)!==trendosFastAuthNormUserV25_(username)||!trendosFastAuthActiveAllowedV25_(user.active)||trendosFastAuthSessionExpiredV25_(user.lastLogin)){try{CacheService.getScriptCache().remove(key);}catch(e){}return null;}
  return{ok:true,user:user,authSource:'FAST_AUTH_CACHE_V25',cacheHit:true,revision:trendosFastAuthTextV25_(revision)};
}
function trendosFastAuthRememberV25_(username,token,revision,user){
  const key=trendosFastAuthCacheKeyV25_(username,token,revision);if(!key)return false;const safe=trendosFastAuthSafeUserV25_(user);
  const payload={version:TRENDOS_FAST_AUTH_V25_VERSION,revision:trendosFastAuthTextV25_(revision),cachedAt:new Date().toISOString(),user:safe};
  const raw=JSON.stringify(payload);
  if(/"password"\s*:|"token"\s*:/.test(raw))throw new Error('Fast Auth V2.5 secret-field guard failed.');
  CacheService.getScriptCache().put(key,raw,TRENDOS_FAST_AUTH_V25_TTL_SEC);return true;
}
function authorizeD1FastV25_(username,token){
  if(typeof authorize_!=='function')return{ok:false,message:'محرك التحقق الأساسي غير متاح.'};
  // Rollback-safe bypass: with the flag OFF, behavior remains the authoritative legacy auth path and no V2.5 cache is read/written.
  if(!trendosFastAuthEnabledV25_())return authorize_(username,token);
  username=trendosFastAuthNormUserV25_(username);token=trendosFastAuthTextV25_(token);if(!username||!token)return{ok:false,message:'الجلسة غير صالحة.'};
  const revision=trendosFastAuthRevisionV25_(username),cached=trendosFastAuthReadCachedV25_(username,token,revision);if(cached)return cached;
  const auth=authorize_(username,token);if(!auth||!auth.ok)return auth||{ok:false,message:'تعذر التحقق.'};
  const safe=trendosFastAuthSafeUserV25_(auth.user);if(!trendosFastAuthActiveAllowedV25_(safe.active)||trendosFastAuthSessionExpiredV25_(safe.lastLogin))return{ok:false,message:'الجلسة غير صالحة.'};
  trendosFastAuthRememberV25_(username,token,revision,safe);
  return{ok:true,user:safe,authSource:'AUTHORITATIVE_THEN_FAST_AUTH_V25',cacheHit:false,revision:revision};
}

function trendosFastAuthBumpRevisionUnlockedV25_(username){
  username=trendosFastAuthNormUserV25_(username);if(!username)return'';const props=PropertiesService.getScriptProperties(),key=trendosFastAuthRevPropV25_(username),old=Number(props.getProperty(key)||0),next=String(isFinite(old)?old+1:1);props.setProperty(key,next);return next;
}
function trendosFastAuthInvalidateUserV25_(username){
  if(typeof trendosWithLock_==='function')return trendosWithLock_('script',()=>trendosFastAuthBumpRevisionUnlockedV25_(username),30000);
  const lock=LockService.getScriptLock();lock.waitLock(30000);try{return trendosFastAuthBumpRevisionUnlockedV25_(username);}finally{lock.releaseLock();}
}

// Wire these AFTER the authoritative mutation succeeds. They intentionally only invalidate; they never mutate Users.
function trendosFastAuthAfterLoginV25_(username){return trendosFastAuthInvalidateUserV25_(username);}
function trendosFastAuthAfterLogoutV25_(username){return trendosFastAuthInvalidateUserV25_(username);}
function trendosFastAuthAfterPasswordChangeV25_(username){return trendosFastAuthInvalidateUserV25_(username);}
function trendosFastAuthAfterActiveChangeV25_(username){return trendosFastAuthInvalidateUserV25_(username);}
function trendosFastAuthAfterTokenResetV25_(username){return trendosFastAuthInvalidateUserV25_(username);}

function trendosFastAuthStatusV25_(){return{version:TRENDOS_FAST_AUTH_V25_VERSION,enabled:trendosFastAuthEnabledV25_(),ttlSeconds:TRENDOS_FAST_AUTH_V25_TTL_SEC};}

/**
 * Required production wiring before use:
 * 1) Install with TRENDOS_FAST_AUTH_V25_ENABLED absent/false.
 * 2) Orders Fast read: replace ONLY the legacy authorize_ call with authorizeD1FastV25_; with flag OFF it still calls authoritative authorize_ directly.
 * 3) After successful login/logout/password change/Active change/token reset, call the matching invalidation hook.
 * 4) Direct manual edits to Users Active/password/token fields must also bump revision (via controlled admin path or edit hook); otherwise TTL is the maximum stale window after the flag is enabled.
 * 5) Run first-hit/cache-hit/logout/password/deactivation/session-expiry regressions before enabling the flag.
 */
