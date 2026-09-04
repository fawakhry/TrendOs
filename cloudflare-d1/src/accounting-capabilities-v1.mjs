export const TRENDOS_ACCOUNTING_CAPABILITIES_VERSION = 'TRENDOS_ACCOUNTING_CAPABILITIES_V1_2_20260905';

export const ACCOUNTING_CAPABILITIES = Object.freeze([
  { id: 'dashboard', label: 'Dashboard', source: 'TrendOS native', phase: 1, status: 'shell-ready' },
  { id: 'sales', label: 'Sales / Invoices', source: 'EasyStore historical TrendOS baseline', phase: 4, status: 'planned-port' },
  { id: 'customer-receivables', label: 'Customer Receivables', source: 'EasyStore historical TrendOS baseline', phase: 4, status: 'planned-port' },
  { id: 'customer-collections', label: 'Customer Collections', source: 'EasyStore historical TrendOS baseline', phase: 2, status: 'planned-port' },
  { id: 'purchases', label: 'Purchases', source: 'EasyStore historical TrendOS baseline', phase: 2, status: 'planned-port' },
  { id: 'supplier-payables', label: 'Supplier Payables', source: 'EasyStore historical TrendOS baseline', phase: 2, status: 'planned-port' },
  { id: 'supplier-payments', label: 'Supplier Payments', source: 'EasyStore historical TrendOS baseline', phase: 2, status: 'planned-port' },
  { id: 'expenses', label: 'Expenses', source: 'TrendOS requirement + legacy accounting behavior', phase: 4, status: 'planned-port' },
  { id: 'treasury', label: 'Treasury / Cashboxes', source: 'EasyStore historical TrendOS baseline', phase: 2, status: 'planned-port' },
  { id: 'customers', label: 'Customers / Party Ledger', source: 'TrendOS + EasyStore historical baseline', phase: 1, status: 'foundation-ready' },
  { id: 'suppliers', label: 'Suppliers / Party Ledger', source: 'EasyStore historical TrendOS baseline', phase: 1, status: 'foundation-ready' },
  { id: 'items-materials', label: 'Items / Materials', source: 'TrendOS + EasyStore historical baseline', phase: 1, status: 'foundation-ready' },
  { id: 'inventory', label: 'Inventory / Stock Movements', source: 'EasyStore historical TrendOS baseline', phase: 3, status: 'planned-port' },
  { id: 'bom', label: 'BOM / Product Formation', source: 'EasyStore historical TrendOS baseline', phase: 3, status: 'planned-port' },
  { id: 'cogs', label: 'Cost Recognition / COGS', source: 'TrendOS requirement + EasyStore actual-cost logic', phase: 3, status: 'planned-port' },
  { id: 'department-purchases', label: 'Department Purchases', source: 'EasyStore historical TrendOS baseline', phase: 3, status: 'planned-port' },
  { id: 'custody', label: 'Custody / Advances / Settlement', source: 'EasyStore historical TrendOS baseline', phase: 5, status: 'planned-port' },
  { id: 'day-close', label: 'Department Day Close', source: 'EasyStore historical TrendOS baseline', phase: 5, status: 'planned-port' },
  { id: 'waste-adjustments', label: 'Waste / Adjustments / Reversals', source: 'EasyStore historical TrendOS baseline', phase: 5, status: 'planned-port' },
  { id: 'line-profit', label: 'Line Profit + Profit Center', source: 'TrendOS canonical requirement + EasyStore actual-cost seed', phase: 4, status: 'foundation-ready' },
  { id: 'reports', label: 'Management Reports', source: 'EasyStore historical TrendOS baseline', phase: 6, status: 'planned-port' },
  { id: 'audit', label: 'Audit Log', source: 'EasyStore historical TrendOS baseline', phase: 1, status: 'foundation-ready' },
  { id: 'health', label: 'Health / Integrity', source: 'EasyStore historical baseline + TrendOS Integrity', phase: 1, status: 'foundation-ready' },
  { id: 'permissions', label: 'Settings / Shared RBAC', source: 'TrendOS shared platform replacing EasyStore name-based authorization', phase: 1, status: 'foundation-ready' }
]);

export const ACCOUNTING_ID_CONTRACTS = Object.freeze({
  orderId: { owner: 'TrendOS Operations', requiredFor: ['sales', 'receivables', 'line-profit'], mutable: false },
  lineId: { owner: 'TrendOS Operations', requiredFor: ['sales', 'cogs', 'inventory', 'line-profit'], mutable: false },
  itemId: { owner: 'TrendOS shared catalog', requiredFor: ['inventory', 'bom', 'sales', 'purchases'], mutable: false },
  customerId: { owner: 'TrendOS customer registry', requiredFor: ['receivables', 'collections', 'sales'], mutable: false },
  supplierId: { owner: 'TrendOS Accounting / shared party registry', requiredFor: ['purchases', 'payables', 'supplier-payments'], mutable: false },
  departmentId: { owner: 'TrendOS shared organization model', requiredFor: ['department-purchases', 'custody', 'day-close'], mutable: false },
  profitCenterId: { owner: 'TrendOS shared organization model', requiredFor: ['line-profit', 'reports'], mutable: false },
  invoiceId: { owner: 'TrendOS Accounting', requiredFor: ['sales', 'receivables', 'collections'], mutable: false },
  purchaseId: { owner: 'TrendOS Accounting', requiredFor: ['purchases', 'payables', 'inventory'], mutable: false },
  paymentId: { owner: 'TrendOS Accounting', requiredFor: ['collections', 'supplier-payments', 'treasury'], mutable: false },
  stockMovementId: { owner: 'TrendOS Accounting', requiredFor: ['inventory', 'bom', 'purchases', 'sales'], mutable: false },
  eventId: { owner: 'event producer', requiredFor: ['all writes'], mutable: false }
});

export function accountingCapabilitiesPayload() {
  return {
    success: true,
    version: TRENDOS_ACCOUNTING_CAPABILITIES_VERSION,
    product: 'TrendOS Accounting',
    nativeModule: true,
    easyStoreRole: 'historical-working-trendos-accounting-baseline',
    authoritativeWrites: false,
    migrationStrategy: 'preserve-verified-behavior-capability-by-capability',
    foundation: {
      phase: 'F1',
      status: 'implemented-and-ci-verified',
      financialMutationAuthority: false,
      operationsRead: 'authenticated-read-only',
      legacyAdminBridge: 'read-audit-only'
    },
    capabilities: ACCOUNTING_CAPABILITIES,
    idContracts: ACCOUNTING_ID_CONTRACTS,
    nonNegotiables: [
      'Shared TrendOS authentication and RBAC; no employee-name authorization.',
      'Order ID and Line ID come from TrendOS Operations and are never re-created by Accounting.',
      'Customer/supplier names are display fields, not primary ledger identities.',
      'Every financial mutation requires a stable request/event idempotency key.',
      'Profit is reported at Line ID + Profit Center.',
      'Browser storage is never authoritative for financial facts.',
      'D1 financial write authority requires a separate approved cutover.'
    ]
  };
}
