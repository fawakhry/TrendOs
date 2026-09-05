export const TRENDOS_ACCOUNTING_PERSISTENCE_READINESS_VERSION = 'TRENDOS_ACCOUNTING_PERSISTENCE_READINESS_V1_20260905';
export const ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY = 'ACCOUNTING_D1_WRITE_PREVIEW';

const ALLOWED_WRITE_STAGES = Object.freeze(['preview', 'test']);

function normalizeStage(value) {
  return String(value == null ? 'disabled' : value).trim().toLowerCase();
}

function isTrue(value) {
  return value === true || String(value == null ? '' : value).trim().toLowerCase() === 'true';
}

function parseCapabilities(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string') return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function hasD1Shape(db) {
  return !!(db && typeof db.prepare === 'function' && typeof db.batch === 'function');
}

export function evaluateAccountingPersistenceReadiness(input = {}) {
  const stage = normalizeStage(input.stage);
  const capabilities = parseCapabilities(input.capabilities);
  const allowedStage = ALLOWED_WRITE_STAGES.includes(stage);
  const capabilityGranted = capabilities.includes(ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY);
  const explicitWriteOptIn = input.allowWrite === true;
  const dbInjected = hasD1Shape(input.db);
  const productionBlocked = stage === 'production' || stage === 'prod';
  const ready = !productionBlocked && allowedStage && capabilityGranted && explicitWriteOptIn && dbInjected;

  return Object.freeze({
    version: TRENDOS_ACCOUNTING_PERSISTENCE_READINESS_VERSION,
    mode: ready ? 'D1_PREVIEW_WRITE_READY' : 'ZERO_WRITE',
    ready,
    stage,
    productionBlocked,
    allowedStage,
    capabilityGranted,
    explicitWriteOptIn,
    dbInjected,
    capability: ACCOUNTING_D1_WRITE_PREVIEW_CAPABILITY,
    authoritativeWrites: false,
    mutationPerformed: false
  });
}

export function accountingPersistenceReadinessFromEnv(env = {}) {
  return evaluateAccountingPersistenceReadiness({
    stage: env.TRENDOS_ACCOUNTING_PERSISTENCE_STAGE,
    capabilities: env.TRENDOS_ACCOUNTING_CAPABILITIES,
    allowWrite: isTrue(env.TRENDOS_ACCOUNTING_D1_WRITE_PREVIEW_ENABLED),
    db: env.TRENDOS_ACCOUNTING_PREVIEW_DB
  });
}

export const ACCOUNTING_PERSISTENCE_ALLOWED_WRITE_STAGES = ALLOWED_WRITE_STAGES;
