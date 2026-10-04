export const PERMISSIONS = Object.freeze({
  RUNTIME_TURN: 'runtime:turn',
  CASE_READ: 'case:read',
  CASE_WRITE: 'case:write',
  ASSET_READ: 'asset:read',
  ASSET_WRITE: 'asset:write',
  TENANT_READ: 'tenant:read',
  TENANT_MANAGE: 'tenant:manage',
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  BILLING_READ: 'billing:read',
  BILLING_MANAGE: 'billing:manage',
  AUDIT_READ: 'audit:read',
});

export const ROLE_PERMISSIONS = Object.freeze({
  owner: Object.freeze(Object.values(PERMISSIONS)),
  admin: Object.freeze([
    PERMISSIONS.RUNTIME_TURN,
    PERMISSIONS.CASE_READ,
    PERMISSIONS.CASE_WRITE,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ASSET_WRITE,
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.AUDIT_READ,
  ]),
  manager: Object.freeze([
    PERMISSIONS.RUNTIME_TURN,
    PERMISSIONS.CASE_READ,
    PERMISSIONS.CASE_WRITE,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ASSET_WRITE,
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.AUDIT_READ,
  ]),
  operator: Object.freeze([
    PERMISSIONS.RUNTIME_TURN,
    PERMISSIONS.CASE_READ,
    PERMISSIONS.CASE_WRITE,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ASSET_WRITE,
  ]),
  designer: Object.freeze([
    PERMISSIONS.RUNTIME_TURN,
    PERMISSIONS.CASE_READ,
    PERMISSIONS.CASE_WRITE,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ASSET_WRITE,
  ]),
  viewer: Object.freeze([
    PERMISSIONS.CASE_READ,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.TENANT_READ,
  ]),
});

export function permissionsForRoles(roles = []) {
  const out = new Set();
  for (const role of Array.isArray(roles) ? roles : []) {
    for (const permission of ROLE_PERMISSIONS[String(role)] || []) out.add(permission);
  }
  return [...out].sort();
}

export function hasPermission(principal, permission) {
  if (!permission) return false;
  const explicit = new Set(Array.isArray(principal?.permissions) ? principal.permissions : []);
  if (explicit.has(permission)) return true;
  return permissionsForRoles(principal?.roles || []).includes(permission);
}

export function assertKnownRoles(roles = []) {
  const unknown = (Array.isArray(roles) ? roles : []).filter((role) => !ROLE_PERMISSIONS[String(role)]);
  return { valid: unknown.length === 0, unknown };
}
