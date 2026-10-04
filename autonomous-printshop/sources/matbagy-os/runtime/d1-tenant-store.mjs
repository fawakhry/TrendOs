import { normalizeCase } from './orchestrator-core.mjs';

export class D1TenantDirectory {
  constructor(db, { now = () => new Date().toISOString() } = {}) {
    this.db = assertD1Database(db);
    this.now = now;
  }

  async provisionTenant({ tenant_id, slug, display_name, owner_subject } = {}) {
    requireString(tenant_id, 'tenant_id');
    requireString(slug, 'slug');
    requireString(display_name, 'display_name');
    requireString(owner_subject, 'owner_subject');
    const at = this.now();

    const tenantStmt = this.db.prepare(
      `INSERT INTO tenants
       (tenant_id, slug, display_name, status, created_at, updated_at)
       VALUES (?1, ?2, ?3, 'ACTIVE', ?4, ?4)`
    ).bind(tenant_id, slug, display_name, at);

    const membershipStmt = this.db.prepare(
      `INSERT INTO tenant_memberships
       (tenant_id, subject, roles_json, permissions_json, status, created_at, updated_at)
       VALUES (?1, ?2, ?3, '[]', 'ACTIVE', ?4, ?4)`
    ).bind(tenant_id, owner_subject, JSON.stringify(['owner']), at);

    await this.db.batch([tenantStmt, membershipStmt]);
    return {
      tenant_id,
      slug,
      display_name,
      status: 'ACTIVE',
      owner_subject,
      created_at: at,
    };
  }

  async getTenant(tenantId) {
    requireString(tenantId, 'tenant_id');
    return this.db.prepare(
      `SELECT tenant_id, slug, display_name, status, created_at, updated_at
       FROM tenants
       WHERE tenant_id = ?1`
    ).bind(tenantId).first();
  }

  async setTenantStatus(tenantId, status) {
    requireString(tenantId, 'tenant_id');
    const normalizedStatus = String(status || '').trim().toUpperCase();
    if (!['ACTIVE', 'SUSPENDED', 'CLOSED'].includes(normalizedStatus)) {
      throw new TypeError('invalid tenant status');
    }
    const at = this.now();
    await this.db.prepare(
      `UPDATE tenants
       SET status = ?2, updated_at = ?3
       WHERE tenant_id = ?1`
    ).bind(tenantId, normalizedStatus, at).run();
    return this.getTenant(tenantId);
  }

  async setStorageRoot({ tenant_id, provider, root_id, config = {}, status = 'ACTIVE' } = {}) {
    requireString(tenant_id, 'tenant_id');
    requireString(provider, 'provider');
    requireString(root_id, 'root_id');
    const normalizedStatus = String(status || '').trim().toUpperCase();
    if (!['ACTIVE', 'DISABLED'].includes(normalizedStatus)) {
      throw new TypeError('invalid storage root status');
    }
    const at = this.now();
    await this.db.prepare(
      `INSERT INTO tenant_storage_roots
       (tenant_id, provider, root_id, config_json, status, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
       ON CONFLICT(tenant_id, provider) DO UPDATE SET
         root_id = excluded.root_id,
         config_json = excluded.config_json,
         status = excluded.status,
         updated_at = excluded.updated_at`
    ).bind(
      tenant_id,
      String(provider).trim().toUpperCase(),
      root_id,
      JSON.stringify(config || {}),
      normalizedStatus,
      at
    ).run();
    return this.getStorageRoot(tenant_id, provider);
  }

  async getStorageRoot(tenantId, provider) {
    requireString(tenantId, 'tenant_id');
    requireString(provider, 'provider');
    const row = await this.db.prepare(
      `SELECT tenant_id, provider, root_id, config_json, status, created_at, updated_at
       FROM tenant_storage_roots
       WHERE tenant_id = ?1 AND provider = ?2`
    ).bind(tenantId, String(provider).trim().toUpperCase()).first();
    if (!row) return null;
    return {
      ...row,
      config: parseJsonObject(row.config_json),
    };
  }

  async resolvePrincipal(tenantId, subject) {
    const tenant = await this.getTenant(tenantId);
    if (!tenant || tenant.status !== 'ACTIVE') {
      return { ok: false, code: 'TENANT_INACTIVE', tenant: tenant || null, membership: null };
    }
    const membership = await this.getMembership(tenantId, subject);
    if (!membership || membership.status !== 'ACTIVE') {
      return { ok: false, code: 'MEMBERSHIP_INACTIVE', tenant, membership: membership || null };
    }
    return {
      ok: true,
      principal: {
        subject,
        tenant_id: tenantId,
        roles: membership.roles,
        permissions: membership.permissions,
      },
      tenant,
      membership,
    };
  }

  async upsertMembership({
    tenant_id,
    subject,
    roles = [],
    permissions = [],
    status = 'ACTIVE',
  } = {}) {
    requireString(tenant_id, 'tenant_id');
    requireString(subject, 'subject');
    const at = this.now();

    await this.db.prepare(
      `INSERT INTO tenant_memberships
       (tenant_id, subject, roles_json, permissions_json, status, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
       ON CONFLICT(tenant_id, subject) DO UPDATE SET
         roles_json = excluded.roles_json,
         permissions_json = excluded.permissions_json,
         status = excluded.status,
         updated_at = excluded.updated_at`
    ).bind(
      tenant_id,
      subject,
      JSON.stringify(uniqueStrings(roles)),
      JSON.stringify(uniqueStrings(permissions)),
      status,
      at
    ).run();

    return this.getMembership(tenant_id, subject);
  }

  async getMembership(tenantId, subject) {
    requireString(tenantId, 'tenant_id');
    requireString(subject, 'subject');
    const row = await this.db.prepare(
      `SELECT tenant_id, subject, roles_json, permissions_json, status, created_at, updated_at
       FROM tenant_memberships
       WHERE tenant_id = ?1 AND subject = ?2`
    ).bind(tenantId, subject).first();

    if (!row) return null;
    return {
      ...row,
      roles: parseJsonArray(row.roles_json),
      permissions: parseJsonArray(row.permissions_json),
    };
  }
}

export class D1CaseStore {
  constructor(db, {
    now = () => new Date().toISOString(),
    idFactory = () => crypto.randomUUID(),
  } = {}) {
    this.db = assertD1Database(db);
    this.now = now;
    this.idFactory = idFactory;
  }

  async findCase(caseId, tenantId) {
    requireString(tenantId, 'tenant_id');
    requireString(caseId, 'case_id');

    const row = await this.db.prepare(
      `SELECT payload_json
       FROM design_cases
       WHERE tenant_id = ?1 AND case_id = ?2`
    ).bind(tenantId, caseId).first();

    return row?.payload_json ? JSON.parse(row.payload_json) : null;
  }

  async upsertCase(caseData) {
    const normalized = normalizeCase(caseData);
    requireExplicitTenant(caseData, normalized);
    const at = this.now();

    const caseStmt = this.db.prepare(
      `INSERT INTO design_cases
       (tenant_id, case_id, case_phase, approval_status, customer_approval_status,
        payload_json, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)
       ON CONFLICT(tenant_id, case_id) DO UPDATE SET
         case_phase = excluded.case_phase,
         approval_status = excluded.approval_status,
         customer_approval_status = excluded.customer_approval_status,
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at`
    ).bind(
      normalized.tenant_id,
      normalized.case_id,
      normalized.case_phase,
      normalized.approval_status,
      normalized.customer_approval_status,
      JSON.stringify(normalized),
      at
    );

    const searchStmt = this.db.prepare(
      `INSERT INTO case_search_index
       (tenant_id, case_id, request_summary, required_text, search_text, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT(tenant_id, case_id) DO UPDATE SET
         request_summary = excluded.request_summary,
         required_text = excluded.required_text,
         search_text = excluded.search_text,
         updated_at = excluded.updated_at`
    ).bind(
      normalized.tenant_id,
      normalized.case_id,
      normalized.request_summary || '',
      searchableText(normalized.required_text),
      buildCaseSearchText(normalized),
      at
    );

    await this.db.batch([caseStmt, searchStmt]);
    return normalized;
  }

  async searchCases(tenantId, query = '', { limit = 50 } = {}) {
    requireString(tenantId, 'tenant_id');
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const normalizedQuery = String(query || '').trim().toLowerCase();
    const like = `%${normalizedQuery}%`;

    const result = await this.db.prepare(
      `SELECT tenant_id, case_id, request_summary, required_text, updated_at
       FROM case_search_index
       WHERE tenant_id = ?1
         AND (?2 = '' OR search_text LIKE ?3)
       ORDER BY updated_at DESC
       LIMIT ?4`
    ).bind(tenantId, normalizedQuery, like, safeLimit).run();

    return Array.isArray(result?.results) ? result.results : [];
  }

  async updateWatch(caseData) {
    const normalized = normalizeCase(caseData);
    requireExplicitTenant(caseData, normalized);
    const at = this.now();

    await this.db.prepare(
      `INSERT INTO case_watch
       (tenant_id, case_id, case_phase, approval_status, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(tenant_id, case_id) DO UPDATE SET
         case_phase = excluded.case_phase,
         approval_status = excluded.approval_status,
         updated_at = excluded.updated_at`
    ).bind(
      normalized.tenant_id,
      normalized.case_id,
      normalized.case_phase,
      normalized.approval_status,
      at
    ).run();

    return {
      tenant_id: normalized.tenant_id,
      case_id: normalized.case_id,
      case_phase: normalized.case_phase,
      approval_status: normalized.approval_status,
      updated_at: at,
    };
  }

  async appendAudit(entry = {}) {
    requireString(entry.tenant_id, 'tenant_id');
    requireString(entry.action, 'action');
    const createdAt = entry.at || this.now();
    const eventId = entry.event_id || this.idFactory();

    await this.db.prepare(
      `INSERT INTO audit_events
       (event_id, tenant_id, actor_subject, action, entity_type, entity_id,
        request_id, payload_json, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    ).bind(
      eventId,
      entry.tenant_id,
      entry.actor?.subject || entry.subject || null,
      entry.action,
      entry.entity_type || inferEntityType(entry),
      entry.entity_id || entry.case_id || entry.asset_id || null,
      entry.request_id || null,
      JSON.stringify(entry),
      createdAt
    ).run();

    return { event_id: eventId, created_at: createdAt };
  }
}

export class D1AssetMetadataStore {
  constructor(db, { now = () => new Date().toISOString() } = {}) {
    this.db = assertD1Database(db);
    this.now = now;
  }

  async upsertAsset(asset = {}) {
    requireString(asset.tenant_id, 'tenant_id');
    requireString(asset.asset_id, 'asset_id');
    requireString(asset.case_id, 'case_id');
    const at = this.now();

    await this.db.prepare(
      `INSERT INTO asset_metadata
       (tenant_id, asset_id, case_id, source_role, asset_binding_status,
        drive_file_id, metadata_json, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)
       ON CONFLICT(tenant_id, asset_id) DO UPDATE SET
         case_id = excluded.case_id,
         source_role = excluded.source_role,
         asset_binding_status = excluded.asset_binding_status,
         drive_file_id = excluded.drive_file_id,
         metadata_json = excluded.metadata_json,
         updated_at = excluded.updated_at`
    ).bind(
      asset.tenant_id,
      asset.asset_id,
      asset.case_id,
      asset.source_role || 'unknown',
      asset.asset_binding_status || 'MISSING',
      asset.drive_file_id || null,
      JSON.stringify(asset),
      at
    ).run();

    return this.getAsset(asset.tenant_id, asset.asset_id);
  }

  async getAsset(tenantId, assetId) {
    requireString(tenantId, 'tenant_id');
    requireString(assetId, 'asset_id');
    const row = await this.db.prepare(
      `SELECT tenant_id, asset_id, case_id, source_role, asset_binding_status,
              drive_file_id, metadata_json, created_at, updated_at
       FROM asset_metadata
       WHERE tenant_id = ?1 AND asset_id = ?2`
    ).bind(tenantId, assetId).first();

    if (!row) return null;
    return {
      ...row,
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
    };
  }
}

export function assertD1Database(db) {
  if (!db || typeof db.prepare !== 'function' || typeof db.batch !== 'function') {
    throw new TypeError('D1 database binding with prepare() and batch() is required');
  }
  return db;
}

function requireExplicitTenant(source, normalized) {
  if (!String(source?.tenant_id || '').trim()) {
    throw tenantError('TENANT_REQUIRED', 'persistent writes require explicit tenant_id');
  }
  requireString(normalized.tenant_id, 'tenant_id');
}

function requireString(value, label) {
  if (!String(value || '').trim()) throw new TypeError(`${label} is required`);
}

function uniqueStrings(value) {
  return [...new Set((Array.isArray(value) ? value : []).map((x) => String(x).trim()).filter(Boolean))];
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function searchableText(value) {
  if (Array.isArray(value)) return value.map(searchableText).filter(Boolean).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(searchableText).filter(Boolean).join(' ');
  return value == null ? '' : String(value).trim();
}

function buildCaseSearchText(caseData) {
  return [
    caseData.case_id,
    caseData.request_summary,
    searchableText(caseData.required_text),
  ].map((x) => String(x || '').trim()).filter(Boolean).join(' ').toLowerCase();
}

function inferEntityType(entry) {
  if (entry.case_id) return 'CASE';
  if (entry.asset_id) return 'ASSET';
  return null;
}

function tenantError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
