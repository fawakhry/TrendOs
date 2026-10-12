/**
 * Trend Mall Autonomous Printshop — Ubuntu diagnostic envelope V0.
 * PURE / OFFLINE / SYNTHETIC ONLY. No terminal, shell, SSH, network, Docker,
 * CUPS, print server, printer control, filesystem access, token or OS adapter.
 * Existing Printshop autonomy/owner gates retain precedence.
 *
 * This is NOT a bridge between ChatGPT and the owner's Ubuntu machine.
 * Callers can only provide wholly fabricated telemetry shaped as below.
 * No input is ever trusted as operational evidence or an authorization.
 */
const MODULES = Object.freeze([
  'TRENDOS_UI', 'TRENDOS_API', 'PRINT_SERVER',
  'CUPS', 'PRINTER_DEVICE', 'LOCAL_DIAGNOSTIC_AGENT',
]);
const STATES = new Set(['MOCK_RUNNING','MOCK_STOPPED','MOCK_UNKNOWN']);
const NO_GO = 'NO_GO';
const allowed = new Set([
  'schema','source','mode','reportId','observedAt','services','deviceReady',
]);
const serviceKeys = new Set(['module','state','sourceEvidenceRef']);
const fakeRef = x => typeof x==='string' && /^FAKE-[A-Z0-9][A-Z0-9_.-]{3,50}$/.test(x);
const iso = x => typeof x==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x) &&
    !Number.isNaN(Date.parse(x)) && new Date(x).toISOString()===x;
const object = x => !!x && typeof x==='object' && !Array.isArray(x) &&
    (Object.getPrototypeOf(x)===Object.prototype || Object.getPrototypeOf(x)===null);

export const UBUNTU_DIAGNOSTIC_CONTRACT_V0 = Object.freeze({
  schema:'PRINTSHOP_UBUNTU_OFFLINE_DIAGNOSTIC_V0',
  permittedInput:'FAKE_LOCAL_FIXTURE_ONLY',
  currentExecutionBridge:'NOT_CONNECTED',
  printServerTestEquatesToProduction:false,
  supportsRealHost:false,
  readsRealLogs:false,
  readsRealProductionData:false,
  canExecuteOSCommands:false,
  canStartOrStopServices:false,
  canSendPrintJobs:false,
  canChangeAccountingOrInventory:false,
  canChangeGitHubOrCloudflare:false,
  canApproveOwnerExceptions:false,
  ownerGates:'G1_G2_G3_G4_G5_OPEN',
  releaseDecision:NO_GO,
});

function outcome(status, extra={}) {
  return Object.freeze({
    status,
    syntheticOnly:true,
    realUbuntuConnected:false,
    realPrinterConnected:false,
    printServerProvedProductionReady:false,
    executeUbuntuAllowed:false,
    sendPrintJobAllowed:false,
    grantStaffPrivilegeAllowed:false,
    writeAccountingOrStockAllowed:false,
    remotelyDeployAllowed:false,
    ownerApprovalSupplied:false,
    releaseDecision:NO_GO,
    ownerGates:'G1_G2_G3_G4_G5_OPEN',
    ...extra,
  });
}
function exactKeys(obj,keys) {
  return Object.keys(obj).every(x=>keys.has(x));
}

/**
 * Validates a simulated local status snapshot and returns a *non-operative*
 * qualification checklist. Incoming and outgoing records are fixed-shape:
 * arbitrary commands, logs, paths, secrets, hostnames, IPs, jobs and URLs are
 * all rejected by an exact-key allowlist. No file is opened or job submitted.
 */
export function reviewUbuntuOfflineDiagnosticFixture(input) {
  if(!object(input) || !exactKeys(input,allowed))
    return outcome('STOP_UNEXPECTED_OR_SENSITIVE_INPUT_FIELD');
  if(input.schema!=='PRINTSHOP_UBUNTU_OFFLINE_DIAGNOSTIC_V0' ||
     input.source!=='SYNTHETIC_TEST_FIXTURE' ||
     input.mode!=='OFFLINE_NO_HOST' ||
     !fakeRef(input.reportId) || !iso(input.observedAt) ||
     typeof input.deviceReady!=='boolean')
    return outcome('STOP_NO_VERIFIED_SYNTHETIC_ENVELOPE');
  if(!Array.isArray(input.services) ||
     input.services.length!==MODULES.length)
    return outcome('STOP_INCOMPLETE_MOCK_MODULE_COVERAGE');
  const found=new Map();
  for(const s of input.services) {
    if(!object(s)||!exactKeys(s,serviceKeys)||
       !MODULES.includes(s.module)||!STATES.has(s.state)||
       !fakeRef(s.sourceEvidenceRef)||found.has(s.module))
      return outcome('STOP_BAD_DUPLICATE_OR_UNPROVEN_MOCK_MODULE');
    found.set(s.module,s);
  }
  if(found.size!==MODULES.length) {
    return outcome('STOP_MISSING_REQUIRED_MOCK_MODULE');
  }
  if(new Set([...found.values()].map(s=>s.sourceEvidenceRef)).size!==MODULES.length)
    return outcome('STOP_REUSED_MOCK_EVIDENCE_REFERENCE');

  const failing=MODULES.filter(k=>found.get(k).state!=='MOCK_RUNNING');
  if(!input.deviceReady) failing.push('PRINTER_DEVICE_READY_FALSE');
  // No attached runtime: even six positive simulated statuses remain BLOCKED.
  const simulatedGreen=failing.length===0;
  return outcome(simulatedGreen?'SYNTHETIC_DIAGNOSTICS_GREEN_REVIEW_ONLY':
                           'SYNTHETIC_DIAGNOSTICS_NEED_REVIEW', {
    reviewedModules:Object.freeze([...MODULES]),
    hypotheticalIssues:Object.freeze(failing),
    hypotheticalAllComponentsReportedRunning:simulatedGreen,
    nextStep:'COLLECT_INDEPENDENT_REAL_HOST_EVIDENCE_ONLY_AFTER_SEPARATE_SETUP_APPROVAL',
    realMachineAndPrintServerAcceptance:'NOT_TESTED',
  });
}
