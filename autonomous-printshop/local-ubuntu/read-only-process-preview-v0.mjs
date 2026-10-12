/**
 * Autonomous Printshop / Ubuntu LOCAL READ-ONLY PREVIEW V0.
 * NOT an agent, not a ChatGPT link, not a print server checker.
 * Pure redaction of only uptime and memory values. Other system states UNKNOWN.
 * CLI (separate file) requires explicit --preview-local; source alone is inert.
 */
const FIELDS=['platform','uptimeSeconds','totalMemoryBytes','freeMemoryBytes'];
const MAX_UPTIME_SECONDS=3650*86400; // safety input bound; not hardware validation
const MAX_MEM_BYTES=Number.MAX_SAFE_INTEGER;
const MODULES=Object.freeze([
 'TRENDOS_UI','TRENDOS_API','PRINT_SERVER',
 'CUPS','PRINTER_DEVICE','LOCAL_DIAGNOSTIC_AGENT',
]);
function plainData(obj,keys){
 if(!obj||typeof obj!=='object'||Array.isArray(obj))return false;
 if(![Object.prototype,null].includes(Object.getPrototypeOf(obj)))return false;
 if(Reflect.ownKeys(obj).length!==keys.length)return false;
 return keys.every(k=>{
  const d=Object.getOwnPropertyDescriptor(obj,k);
  return !!d && Object.hasOwn(d,'value');
 });
}
function out(status,extra={}){
 return Object.freeze({
  schema:'PRINTSHOP_LOCAL_PROCESS_PREVIEW_V0',
  status,
  unsigned:true,
  untrustedLocalObservationOnly:true,
  source:'UNSIGNED_EXPLICIT_LOCAL_PROCESS_METRICS',
  memoryPressure:'UNKNOWN',
  uptimeBand:'UNKNOWN',
  hostIdentityVerified:false,
  ubuntuDistributionVerified:false,
  servicesVerified:false,
  printerReadyVerified:false,
  printServerProductionReady:false,
  cloudOrGitHubAccess:false,
  hardwareDriverInspected:false,
  connectedToChatGPT:false,
  canExecuteCommands:false,
  canRunServiceActions:false,
  canPrint:false,
  canChangeAccountingOrStock:false,
  canChangePermissions:false,
  realProductionApproval:false,
  serviceStates:Object.freeze(MODULES.map(module=>Object.freeze({
   module,state:'NOT_PROBED',
  }))),
  ownerGates:'G1_G2_G3_G4_G5_OPEN',
  financeRelease:'NO_GO',
  printshopRelease:'NO_GO',
  ...extra,
 });
}
export const LOCAL_PROCESS_PREVIEW_POLICY_V0=Object.freeze({
 readonlySampler:'MANUAL_OPT_IN_ONLY',
 automaticCollection:false,
 permittedInputs:Object.freeze([...FIELDS]),
 metricSources:'NODE_OS_UPTIME_TOTALMEM_FREEMEM_ONLY',
 collectsHostname:false,collectsUserName:false,collectsIP:false,
 collectsMacAddress:false,collectsLogs:false,
 collectsPaths:false,collectsCustomerData:false,
 collectsPrinterQueues:false,collectsOpenPorts:false,
 canRunShell:false,canUseSSH:false,canUseNetwork:false,
 canReadFilesystem:false,canWriteFilesystem:false,
 canStartOrStopServices:false,canQueryCUPS:false,
 canSubmitPrintJobs:false,canDeployOrMerge:false,
 ownerGates:'G1_G2_G3_G4_G5_OPEN',release:'NO_GO',
});
/**
 * Deterministic, side-effect free projection. Source can only be a process-
 * local metric provider AFTER deliberate local opt-in. No identity/signature,
 * no freshness assertion, and nothing that authorizes a next action.
 */
export function reviewReadOnlyLocalProcessMetricsV0(metrics){
 if(!plainData(metrics,FIELDS))
  return out('STOP_UNEXPECTED_OR_ACCESSOR_METRICS');
 const {platform,uptimeSeconds,totalMemoryBytes,freeMemoryBytes}=metrics;
 if(platform!=='linux')return out('STOP_NOT_LINUX_PROCESS');
 if(typeof uptimeSeconds!=='number'||!Number.isFinite(uptimeSeconds)||
    uptimeSeconds<0||uptimeSeconds>MAX_UPTIME_SECONDS)
  return out('STOP_INVALID_UPTIME_METRIC');
 if(!Number.isSafeInteger(totalMemoryBytes)||totalMemoryBytes<1||
    totalMemoryBytes>MAX_MEM_BYTES||
    !Number.isSafeInteger(freeMemoryBytes)||freeMemoryBytes<0||
    freeMemoryBytes>totalMemoryBytes)
  return out('STOP_INVALID_MEMORY_METRIC');
 const usedPct=Math.round((1-freeMemoryBytes/totalMemoryBytes)*100);
 const memoryPressure=usedPct>=90?'HIGH':usedPct>=70?'ELEVATED':'NORMAL';
 const uptimeBand=uptimeSeconds<3600?'UNDER_1_HOUR':
                  uptimeSeconds<86400?'ONE_TO_24_HOURS':'OVER_24_HOURS';
 return out('LOCAL_LINUX_UNSIGNED_PREVIEW_NOT_PRODUCTION_PROOF',{
  memoryPressure,uptimeBand,
  // never expose precise uptime, memory, paths, identities, service names
  // beyond a fixed generic *non-probed* service enum, or any OS release.
 });
}
