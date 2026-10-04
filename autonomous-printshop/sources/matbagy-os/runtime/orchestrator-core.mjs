/**
 * Matbagy Orchestrator Core v0.1
 * Pure deterministic logic only. No network calls, secrets, file I/O, or production integrations.
 */

export const CASE_PHASES = Object.freeze([
  'OPEN',
  'UNDER_REVIEW',
  'REVISION_REQUIRED',
  'WAITING_CUSTOMER_APPROVAL',
  'FINAL_APPROVED',
  'CLOSED',
  'REOPENED',
]);

export const TRUTH_LABELS = Object.freeze([
  'CUSTOMER_FACT',
  'OWNER_DECISION',
  'CHATGPT_OPINION',
  'GEMINI_OPINION',
  'SYSTEM_STATE',
  'INFERRED',
  'UNKNOWN',
]);

export const AI_AUTHORITY = 'ADVISORY_ONLY';
export const DEFAULT_TENANT_ID = 'TENANT_001';

const SUCCESS_STATES = new Set(['SUCCESS', 'GENERATED', 'COMPLETED', 'AVAILABLE']);
const REJECTED_FEEDBACK = new Set(['REJECTED']);
const ACCEPTED_FEEDBACK = new Set(['LIKED', 'PARTIAL', 'EXPLICITLY_LIKED', 'PARTIAL_ACCEPTANCE']);

export function normalizeCase(input = {}) {
  const source = structuredCloneSafe(input);
  const tenantId = cleanString(source.tenant_id) || DEFAULT_TENANT_ID;
  const versions = normalizeVersions(source.versions || source.attempts || []);
  const assets = Array.isArray(source.assets) ? source.assets.map((asset) => normalizeAsset(asset, tenantId)) : [];
  const phase = CASE_PHASES.includes(source.case_phase) ? source.case_phase : 'OPEN';

  return {
    tenant_id: tenantId,
    branch_id: cleanString(source.branch_id) || null,
    case_id: cleanString(source.case_id) || 'UNKNOWN',
    order_id: cleanString(source.order_id) || 'UNKNOWN',
    case_phase: phase,
    approval_status: cleanString(source.approval_status || source?.approval?.status) || 'NOT_CONFIRMED',
    customer_approval_status: cleanString(source.customer_approval_status) || 'NOT_DOCUMENTED',
    request_summary: cleanString(source.request_summary),
    required_text: source.required_text ?? '',
    must_keep: normalizeStringList(source.must_keep || source.mustKeep),
    must_avoid: normalizeStringList(source.must_avoid || source.mustAvoid),
    assets,
    versions,
    metadata: source.metadata && typeof source.metadata === 'object' ? source.metadata : {},
  };
}

export function selectArchivalFinal(caseInput) {
  const normalized = normalizeCase(caseInput);
  const versions = normalized.versions;

  const explicit = [...versions].reverse().find((v) =>
    v.result_asset_id && (v.explicit_final === true || v.final_evidence === true || v.approval_status === 'FINAL_APPROVED')
  );
  if (explicit) return finalSelection(explicit, 'EXPLICIT_FINAL');

  for (let i = versions.length - 1; i >= 0; i -= 1) {
    const version = versions[i];
    if (!isSuccessful(version) || isRejected(version) || !version.result_asset_id) continue;
    const later = versions.slice(i + 1);
    const supersededByRevision = later.some((candidate) => candidate.revision_requested === true);
    if (!supersededByRevision) return finalSelection(version, 'LATEST_SUCCESSFUL_NON_REJECTED');
  }

  const accepted = [...versions].reverse().find((v) =>
    v.result_asset_id && ACCEPTED_FEEDBACK.has(v.feedback_class)
  );
  if (accepted) return finalSelection(accepted, 'LATEST_ACCEPTED');

  return {
    archival_final_status: 'NO_VALID_FINAL_ASSET',
    archival_final_version_id: null,
    archival_final_asset_id: null,
    archival_final_basis: null,
  };
}

export function buildPersistPlan(caseInput) {
  const normalized = normalizeCase(caseInput);
  const final = selectArchivalFinal(normalized);
  const counts = normalized.assets.reduce(
    (acc, asset) => {
      const key = asset.asset_binding_status;
      if (key === 'LINKED') acc.linked += 1;
      else if (key === 'PENDING_UPLOAD') acc.pending += 1;
      else if (key === 'MISSING') acc.missing += 1;
      return acc;
    },
    { linked: 0, pending: 0, missing: 0 }
  );

  return {
    policy: 'AUTO_PERSIST_FIRST',
    authority: AI_AUTHORITY,
    tenant_id: normalized.tenant_id,
    branch_id: normalized.branch_id,
    case_id: normalized.case_id,
    case_phase: normalized.case_phase,
    customer_approval_status: normalized.customer_approval_status,
    ...final,
    asset_counts: counts,
    safe_to_delete_chat: counts.pending === 0 && counts.missing === 0 && normalized.case_id !== 'UNKNOWN',
    actions: [
      'DEDUP_CASE',
      'UPSERT_CASE_METADATA',
      'LINK_AVAILABLE_ASSETS',
      'WRITE_STORAGE_IDS',
      'UPDATE_ROOM_STATE',
      'UPDATE_WATCH_INDEX',
    ],
  };
}

export function routeMessage(text = '') {
  const value = cleanString(text);
  if (!value) return { mode: 'GPT', recipients: ['CHATGPT'], max_ai_rounds: 0 };

  if (/(@الكل|@all|boom\s*mode|boom)/iu.test(value)) {
    return { mode: 'BOOM', recipients: ['CHATGPT', 'GEMINI'], max_ai_rounds: 3 };
  }
  if (/(@gemini|@جيميني)/iu.test(value)) {
    return { mode: 'GEMINI', recipients: ['GEMINI'], max_ai_rounds: 0 };
  }
  return { mode: 'GPT', recipients: ['CHATGPT'], max_ai_rounds: 0 };
}

export function buildSharedContextPacket({ caseData = {}, userRequest = '', target = 'GEMINI', task = '' } = {}) {
  const normalized = normalizeCase(caseData);
  const final = selectArchivalFinal(normalized);
  const relevantAssets = normalized.assets
    .filter((asset) => asset.asset_binding_status !== 'REMOVED')
    .map((asset) => ({
      asset_id: asset.asset_id,
      source_role: asset.source_role,
      drive_file_id: asset.drive_file_id || null,
      binding: asset.asset_binding_status,
    }));

  return {
    packet_version: 'MATBAGY_CONTEXT_V1',
    tenant_id: normalized.tenant_id,
    branch_id: normalized.branch_id,
    target: String(target).toUpperCase(),
    authority: AI_AUTHORITY,
    truth_boundary: 'DO_NOT_INVENT_FACTS_OR_APPROVALS',
    user_request: cleanString(userRequest),
    task: cleanString(task) || cleanString(userRequest),
    case: {
      tenant_id: normalized.tenant_id,
      branch_id: normalized.branch_id,
      case_id: normalized.case_id,
      order_id: normalized.order_id,
      case_phase: normalized.case_phase,
      approval_status: normalized.approval_status,
      customer_approval_status: normalized.customer_approval_status,
      request_summary: normalized.request_summary,
      required_text: normalized.required_text,
      must_keep: normalized.must_keep,
      must_avoid: normalized.must_avoid,
    },
    archival_final: final,
    assets: relevantAssets,
    current_version_id: normalized.versions.at(-1)?.version_id || null,
  };
}

export function validateCase(caseInput) {
  const normalized = normalizeCase(caseInput);
  const errors = [];
  const warnings = [];

  if (!cleanString(caseInput?.tenant_id)) {
    warnings.push('tenant_id defaulted to TENANT_001 for legacy compatibility');
  }
  if (!normalized.tenant_id) {
    errors.push('tenant_id is required');
  }
  if (!/^DESIGN-\d{4}-\d{6}$/.test(normalized.case_id)) {
    errors.push('case_id must match DESIGN-YYYY-NNNNNN');
  }
  if (!CASE_PHASES.includes(normalized.case_phase)) {
    errors.push('invalid case_phase');
  }
  if (normalized.case_phase === 'CLOSED' && normalized.approval_status === 'NOT_CONFIRMED') {
    warnings.push('closed case has no documented approval status');
  }
  if (normalized.customer_approval_status === 'CONFIRMED' && !hasApprovalEvidence(caseInput)) {
    warnings.push('customer approval is marked CONFIRMED without explicit evidence field');
  }

  const assetIds = normalized.assets.map((a) => a.asset_id).filter(Boolean);
  const duplicateAssets = duplicates(assetIds);
  if (duplicateAssets.length) errors.push(`duplicate asset ids: ${duplicateAssets.join(', ')}`);

  for (const asset of normalized.assets) {
    if (asset.tenant_id !== normalized.tenant_id) {
      errors.push(`${asset.asset_id || 'asset'} belongs to a different tenant`);
    }
    if (asset.asset_binding_status === 'LINKED' && !asset.drive_file_id) {
      errors.push(`${asset.asset_id || 'asset'} is LINKED without drive_file_id`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function canAiTransitionPhase(fromPhase, toPhase) {
  if (!CASE_PHASES.includes(fromPhase) || !CASE_PHASES.includes(toPhase)) return false;
  if (toPhase === 'FINAL_APPROVED' || toPhase === 'CLOSED') return false;
  return true;
}

export function normalizeTruthEntry(entry = {}) {
  const label = TRUTH_LABELS.includes(entry.source_type) ? entry.source_type : 'UNKNOWN';
  return {
    source_type: label,
    statement: cleanString(entry.statement),
    evidence_ref: cleanString(entry.evidence_ref) || null,
    confidence: cleanString(entry.confidence) || 'UNKNOWN',
  };
}

function normalizeVersions(list) {
  if (!Array.isArray(list)) return [];
  return list.map((version, index) => ({
    version_id: cleanString(version.version_id || version.attempt_id) || `V${index + 1}`,
    result_status: cleanString(version.result_status || version.status || 'UNKNOWN').toUpperCase(),
    result_asset_id: cleanString(version.result_asset_id || version.final_asset_id) || null,
    feedback_class: cleanString(version.feedback_class || 'UNKNOWN').toUpperCase(),
    approval_status: cleanString(version.approval_status || '').toUpperCase(),
    explicit_final: version.explicit_final === true,
    final_evidence: version.final_evidence === true,
    revision_requested: version.revision_requested === true || Boolean(cleanString(version.requested_changes)),
    requested_changes: cleanString(version.requested_changes),
  }));
}

function normalizeAsset(asset = {}, fallbackTenantId = DEFAULT_TENANT_ID) {
  return {
    tenant_id: cleanString(asset.tenant_id) || fallbackTenantId,
    asset_id: cleanString(asset.asset_id),
    source_role: cleanString(asset.source_role) || 'unknown',
    asset_binding_status: cleanString(asset.asset_binding_status || 'MISSING').toUpperCase(),
    drive_file_id: cleanString(asset.drive_file_id) && cleanString(asset.drive_file_id) !== 'PENDING' ? cleanString(asset.drive_file_id) : null,
  };
}

function finalSelection(version, basis) {
  return {
    archival_final_status: 'AUTO_SELECTED',
    archival_final_version_id: version.version_id,
    archival_final_asset_id: version.result_asset_id,
    archival_final_basis: basis,
  };
}

function isSuccessful(version) {
  return SUCCESS_STATES.has(version.result_status) || (version.result_asset_id && version.result_status !== 'FAILED_NO_RESULT');
}

function isRejected(version) {
  return REJECTED_FEEDBACK.has(version.feedback_class) || version.approval_status === 'REJECTED';
}

function hasApprovalEvidence(input) {
  return Boolean(
    cleanString(input?.approval_evidence) ||
    cleanString(input?.approval?.evidence) ||
    cleanString(input?.customer_approval_evidence)
  );
}

function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map(cleanString).filter(Boolean);
  if (typeof value === 'string') return value.split(/\r?\n|,/).map(cleanString).filter(Boolean);
  return [];
}

function cleanString(value) {
  return value == null ? '' : String(value).trim();
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value || {}));
}

function duplicates(list) {
  const seen = new Set();
  const repeated = new Set();
  for (const item of list) {
    if (seen.has(item)) repeated.add(item);
    seen.add(item);
  }
  return [...repeated];
}
