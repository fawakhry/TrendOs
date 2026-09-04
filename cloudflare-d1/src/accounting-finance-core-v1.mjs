import {
  normalizeStableId,
  validateIdempotencyEnvelope,
  validateOrderLineIdentity,
  validateStableId
} from './accounting-foundation-v1.mjs';

export const TRENDOS_ACCOUNTING_FINANCE_CORE_VERSION = 'TRENDOS_ACCOUNTING_F2_FINANCE_CORE_V1_20260905';

export const ACCOUNT_TYPES = Object.freeze(['asset','liability','equity','revenue','expense']);

export const CHART_OF_ACCOUNTS_V1 = Object.freeze({
  '1010': { code: '1010', name: 'الخزنة الرئيسية', type: 'asset', normalSide: 'debit', role: 'cash-main' },
  '1020': { code: '1020', name: 'البنك / المحافظ الإلكترونية', type: 'asset', normalSide: 'debit', role: 'bank' },
  '1100': { code: '1100', name: 'العملاء - حسابات مدينة', type: 'asset', normalSide: 'debit', role: 'accounts-receivable' },
  '1200': { code: '1200', name: 'المخزون', type: 'asset', normalSide: 'debit', role: 'inventory' },
  '1300': { code: '1300', name: 'العهد والسلف', type: 'asset', normalSide: 'debit', role: 'custody' },
  '2100': { code: '2100', name: 'الموردون - حسابات دائنة', type: 'liability', normalSide: 'credit', role: 'accounts-payable' },
  '2200': { code: '2200', name: 'دفعات مقدمة من العملاء', type: 'liability', normalSide: 'credit', role: 'customer-advances' },
  '3100': { code: '3100', name: 'رصيد افتتاحي / حقوق الملكية', type: 'equity', normalSide: 'credit', role: 'opening-equity' },
  '4100': { code: '4100', name: 'إيراد المبيعات', type: 'revenue', normalSide: 'credit', role: 'sales-revenue' },
  '5100': { code: '5100', name: 'تكلفة البضاعة / الشغل المباع', type: 'expense', normalSide: 'debit', role: 'cogs' },
  '5200': { code: '5200', name: 'مصروفات تشغيل', type: 'expense', normalSide: 'debit', role: 'operating-expense' },
  '5300': { code: '5300', name: 'هالك وتسويات مخزون', type: 'expense', normalSide: 'debit', role: 'waste-adjustment' }
});

export const FINANCE_PLAN_TYPES = Object.freeze([
  'sales-invoice.create',
  'customer.collect',
  'purchase.create',
  'purchase.pay',
  'expense.create',
  'treasury.transfer',
  'journal.reverse'
]);

function text(value) { return String(value == null ? '' : value).trim(); }

export function moneyToMinor(value) {
  if (typeof value === 'string' && !value.trim()) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round((n + Number.EPSILON) * 100);
}

export function minorToMoney(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n / 100 : null;
}

function requirePositiveMoney(value, field, errors) {
  const minor = moneyToMinor(value);
  if (minor === null || minor <= 0) {
    errors.push(`${field} must be greater than zero`);
    return null;
  }
  return minor;
}

function optionalId(value, field, errors) {
  if (!text(value)) return '';
  const result = validateStableId(value, field);
  errors.push(...result.errors);
  return result.value;
}

function requiredId(value, field, errors) {
  const result = validateStableId(value, field);
  errors.push(...result.errors);
  return result.value;
}

function account(code, errors, field = 'accountCode') {
  const key = text(code);
  const found = CHART_OF_ACCOUNTS_V1[key];
  if (!found) errors.push(`${field} is not in Chart of Accounts V1`);
  return found || null;
}

function dimensions(input = {}) {
  return {
    partyId: normalizeStableId(input.partyId),
    orderId: normalizeStableId(input.orderId),
    lineId: normalizeStableId(input.lineId),
    itemId: normalizeStableId(input.itemId),
    departmentId: normalizeStableId(input.departmentId),
    profitCenterId: normalizeStableId(input.profitCenterId),
    sourceDocumentId: normalizeStableId(input.sourceDocumentId || input.documentId)
  };
}

function journalLine({ index, accountCode, debitMinor = 0, creditMinor = 0, memo = '', dims = {} }) {
  return {
    lineNo: index,
    accountCode,
    accountName: CHART_OF_ACCOUNTS_V1[accountCode] ? CHART_OF_ACCOUNTS_V1[accountCode].name : '',
    debitMinor,
    creditMinor,
    debit: minorToMoney(debitMinor),
    credit: minorToMoney(creditMinor),
    memo: text(memo),
    ...dimensions(dims)
  };
}

function buildPlanEnvelope(command, lines, metadata = {}) {
  const idem = validateIdempotencyEnvelope({
    idempotencyKey: command.idempotencyKey || command.eventId || command.requestId,
    commandType: command.type,
    actorId: command.actorId,
    source: command.source || 'trendos-accounting',
    occurredAt: command.occurredAt
  });
  const errors = [...idem.errors];
  const documentId = requiredId(command.documentId || command.sourceDocumentId, 'documentId', errors);
  const journalId = normalizeStableId(command.journalId || `JRN-${idem.normalized.idempotencyKey || documentId}`);
  const plan = {
    version: TRENDOS_ACCOUNTING_FINANCE_CORE_VERSION,
    success: false,
    valid: false,
    persisted: false,
    authoritativeWrites: false,
    type: text(command.type),
    journalId,
    documentId,
    idempotencyKey: idem.normalized.idempotencyKey,
    actorId: idem.normalized.actorId,
    source: idem.normalized.source,
    occurredAt: idem.normalized.occurredAt,
    currency: 'EGP',
    lines,
    metadata,
    errors
  };
  const balance = validateJournalPlan(plan);
  plan.balance = balance;
  plan.errors = [...new Set([...errors, ...balance.errors])];
  plan.valid = plan.errors.length === 0;
  plan.success = plan.valid;
  return plan;
}

function validateSharedCommand(command = {}) {
  const errors = [];
  if (!FINANCE_PLAN_TYPES.includes(text(command.type))) errors.push('unsupported finance plan type');
  if (text(command.currency || 'EGP').toUpperCase() !== 'EGP') errors.push('F2 currency must be EGP');
  return errors;
}

function salesInvoicePlan(command) {
  const errors = validateSharedCommand(command);
  const amountMinor = requirePositiveMoney(command.amount, 'amount', errors);
  const partyId = requiredId(command.partyId || command.customerId, 'partyId', errors);
  const orderLine = validateOrderLineIdentity({ orderId: command.orderId, lineId: command.lineId });
  errors.push(...orderLine.errors);
  const profitCenterId = requiredId(command.profitCenterId, 'profitCenterId', errors);
  const documentId = requiredId(command.documentId || command.invoiceId, 'documentId', errors);
  const dims = { ...command, partyId, orderId: orderLine.orderId, lineId: orderLine.lineId, profitCenterId, sourceDocumentId: documentId };
  const lines = amountMinor ? [
    journalLine({ index: 1, accountCode: '1100', debitMinor: amountMinor, memo: 'فاتورة مبيعات - تحميل العميل', dims }),
    journalLine({ index: 2, accountCode: '4100', creditMinor: amountMinor, memo: 'إثبات إيراد المبيعات', dims })
  ] : [];
  const plan = buildPlanEnvelope({ ...command, documentId }, lines, { partyType: 'customer', subledgerEffect: 'receivable-increase' });
  plan.errors = [...new Set([...errors, ...plan.errors])];
  plan.valid = plan.errors.length === 0 && plan.balance.balanced;
  plan.success = plan.valid;
  return plan;
}

function customerCollectionPlan(command) {
  const errors = validateSharedCommand(command);
  const amountMinor = requirePositiveMoney(command.amount, 'amount', errors);
  const partyId = requiredId(command.partyId || command.customerId, 'partyId', errors);
  const documentId = requiredId(command.documentId || command.paymentId, 'documentId', errors);
  const treasuryCode = text(command.treasuryAccountCode || '1010');
  account(treasuryCode, errors, 'treasuryAccountCode');
  if (treasuryCode === '1100' || CHART_OF_ACCOUNTS_V1[treasuryCode]?.type !== 'asset') errors.push('treasuryAccountCode must be an asset treasury account');
  const dims = { ...command, partyId, sourceDocumentId: documentId };
  const lines = amountMinor && CHART_OF_ACCOUNTS_V1[treasuryCode] ? [
    journalLine({ index: 1, accountCode: treasuryCode, debitMinor: amountMinor, memo: 'تحصيل من عميل', dims }),
    journalLine({ index: 2, accountCode: '1100', creditMinor: amountMinor, memo: 'تخفيض مديونية العميل', dims })
  ] : [];
  const plan = buildPlanEnvelope({ ...command, documentId }, lines, { partyType: 'customer', subledgerEffect: 'receivable-decrease', treasuryEffect: 'increase' });
  plan.errors = [...new Set([...errors, ...plan.errors])];
  plan.valid = plan.errors.length === 0 && plan.balance.balanced;
  plan.success = plan.valid;
  return plan;
}

function purchasePlan(command) {
  const errors = validateSharedCommand(command);
  const amountMinor = requirePositiveMoney(command.amount, 'amount', errors);
  const partyId = requiredId(command.partyId || command.supplierId, 'partyId', errors);
  const documentId = requiredId(command.documentId || command.purchaseId, 'documentId', errors);
  const purchaseKind = text(command.purchaseKind || 'inventory').toLowerCase();
  const debitAccount = purchaseKind === 'inventory' ? '1200' : purchaseKind === 'expense' ? text(command.expenseAccountCode || '5200') : '';
  if (!['inventory','expense'].includes(purchaseKind)) errors.push('purchaseKind must be inventory or expense');
  account(debitAccount, errors, 'purchaseDebitAccount');
  if (purchaseKind === 'expense' && CHART_OF_ACCOUNTS_V1[debitAccount]?.type !== 'expense') errors.push('expense purchase must debit an expense account');
  const dims = { ...command, partyId, sourceDocumentId: documentId };
  const lines = amountMinor && CHART_OF_ACCOUNTS_V1[debitAccount] ? [
    journalLine({ index: 1, accountCode: debitAccount, debitMinor: amountMinor, memo: purchaseKind === 'inventory' ? 'إثبات شراء مخزون' : 'إثبات شراء مصروف', dims }),
    journalLine({ index: 2, accountCode: '2100', creditMinor: amountMinor, memo: 'إثبات مديونية المورد', dims })
  ] : [];
  const plan = buildPlanEnvelope({ ...command, documentId }, lines, { partyType: 'supplier', purchaseKind, subledgerEffect: 'payable-increase' });
  plan.errors = [...new Set([...errors, ...plan.errors])];
  plan.valid = plan.errors.length === 0 && plan.balance.balanced;
  plan.success = plan.valid;
  return plan;
}

function supplierPaymentPlan(command) {
  const errors = validateSharedCommand(command);
  const amountMinor = requirePositiveMoney(command.amount, 'amount', errors);
  const partyId = requiredId(command.partyId || command.supplierId, 'partyId', errors);
  const documentId = requiredId(command.documentId || command.paymentId, 'documentId', errors);
  const treasuryCode = text(command.treasuryAccountCode || '1010');
  account(treasuryCode, errors, 'treasuryAccountCode');
  if (treasuryCode === '1100' || CHART_OF_ACCOUNTS_V1[treasuryCode]?.type !== 'asset') errors.push('treasuryAccountCode must be an asset treasury account');
  const dims = { ...command, partyId, sourceDocumentId: documentId };
  const lines = amountMinor && CHART_OF_ACCOUNTS_V1[treasuryCode] ? [
    journalLine({ index: 1, accountCode: '2100', debitMinor: amountMinor, memo: 'تخفيض مديونية المورد', dims }),
    journalLine({ index: 2, accountCode: treasuryCode, creditMinor: amountMinor, memo: 'سداد للمورد', dims })
  ] : [];
  const plan = buildPlanEnvelope({ ...command, documentId }, lines, { partyType: 'supplier', subledgerEffect: 'payable-decrease', treasuryEffect: 'decrease' });
  plan.errors = [...new Set([...errors, ...plan.errors])];
  plan.valid = plan.errors.length === 0 && plan.balance.balanced;
  plan.success = plan.valid;
  return plan;
}

function expensePlan(command) {
  const errors = validateSharedCommand(command);
  const amountMinor = requirePositiveMoney(command.amount, 'amount', errors);
  const documentId = requiredId(command.documentId || command.expenseId, 'documentId', errors);
  const expenseCode = text(command.expenseAccountCode || '5200');
  account(expenseCode, errors, 'expenseAccountCode');
  if (CHART_OF_ACCOUNTS_V1[expenseCode]?.type !== 'expense') errors.push('expenseAccountCode must be an expense account');
  const paymentMode = text(command.paymentMode || 'cash').toLowerCase();
  if (!['cash','payable'].includes(paymentMode)) errors.push('paymentMode must be cash or payable');
  let creditCode = '';
  let partyId = optionalId(command.partyId || command.supplierId, 'partyId', errors);
  if (paymentMode === 'cash') {
    creditCode = text(command.treasuryAccountCode || '1010');
    account(creditCode, errors, 'treasuryAccountCode');
    if (CHART_OF_ACCOUNTS_V1[creditCode]?.type !== 'asset') errors.push('treasuryAccountCode must be an asset account');
  } else {
    creditCode = '2100';
    if (!partyId) errors.push('partyId/supplierId is required for payable expense');
  }
  const dims = { ...command, partyId, sourceDocumentId: documentId };
  const lines = amountMinor && CHART_OF_ACCOUNTS_V1[expenseCode] && CHART_OF_ACCOUNTS_V1[creditCode] ? [
    journalLine({ index: 1, accountCode: expenseCode, debitMinor: amountMinor, memo: 'إثبات مصروف', dims }),
    journalLine({ index: 2, accountCode: creditCode, creditMinor: amountMinor, memo: paymentMode === 'cash' ? 'سداد المصروف من الخزنة' : 'إثبات مستحق للمورد', dims })
  ] : [];
  const plan = buildPlanEnvelope({ ...command, documentId }, lines, { paymentMode, partyType: partyId ? 'supplier' : '', treasuryEffect: paymentMode === 'cash' ? 'decrease' : 'none', subledgerEffect: paymentMode === 'payable' ? 'payable-increase' : 'none' });
  plan.errors = [...new Set([...errors, ...plan.errors])];
  plan.valid = plan.errors.length === 0 && plan.balance.balanced;
  plan.success = plan.valid;
  return plan;
}

function treasuryTransferPlan(command) {
  const errors = validateSharedCommand(command);
  const amountMinor = requirePositiveMoney(command.amount, 'amount', errors);
  const documentId = requiredId(command.documentId || command.transferId, 'documentId', errors);
  const fromCode = text(command.fromAccountCode);
  const toCode = text(command.toAccountCode);
  account(fromCode, errors, 'fromAccountCode');
  account(toCode, errors, 'toAccountCode');
  if (fromCode === toCode && fromCode) errors.push('treasury transfer accounts must differ');
  if (CHART_OF_ACCOUNTS_V1[fromCode]?.type !== 'asset' || CHART_OF_ACCOUNTS_V1[toCode]?.type !== 'asset') errors.push('treasury transfer accounts must both be asset accounts');
  const dims = { ...command, sourceDocumentId: documentId };
  const lines = amountMinor && CHART_OF_ACCOUNTS_V1[fromCode] && CHART_OF_ACCOUNTS_V1[toCode] ? [
    journalLine({ index: 1, accountCode: toCode, debitMinor: amountMinor, memo: 'تحويل خزنة - وارد', dims }),
    journalLine({ index: 2, accountCode: fromCode, creditMinor: amountMinor, memo: 'تحويل خزنة - صادر', dims })
  ] : [];
  const plan = buildPlanEnvelope({ ...command, documentId }, lines, { transfer: true, fromAccountCode: fromCode, toAccountCode: toCode });
  plan.errors = [...new Set([...errors, ...plan.errors])];
  plan.valid = plan.errors.length === 0 && plan.balance.balanced;
  plan.success = plan.valid;
  return plan;
}

export function validateJournalPlan(plan = {}) {
  const errors = [];
  const lines = Array.isArray(plan.lines) ? plan.lines : [];
  if (lines.length < 2) errors.push('journal must contain at least two lines');
  let debitMinor = 0;
  let creditMinor = 0;
  lines.forEach((line, index) => {
    const debit = Number(line.debitMinor || 0);
    const credit = Number(line.creditMinor || 0);
    if (!Number.isInteger(debit) || debit < 0) errors.push(`line ${index + 1} debitMinor is invalid`);
    if (!Number.isInteger(credit) || credit < 0) errors.push(`line ${index + 1} creditMinor is invalid`);
    if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) errors.push(`line ${index + 1} must contain exactly one debit or credit amount`);
    if (!CHART_OF_ACCOUNTS_V1[text(line.accountCode)]) errors.push(`line ${index + 1} uses unknown account`);
    debitMinor += Number.isInteger(debit) ? debit : 0;
    creditMinor += Number.isInteger(credit) ? credit : 0;
  });
  if (debitMinor !== creditMinor) errors.push('journal is not balanced');
  if (debitMinor <= 0) errors.push('journal total must be greater than zero');
  return {
    valid: errors.length === 0,
    balanced: errors.length === 0 && debitMinor === creditMinor,
    debitMinor,
    creditMinor,
    debit: minorToMoney(debitMinor),
    credit: minorToMoney(creditMinor),
    errors
  };
}

export function reverseJournalPlan(original = {}, command = {}) {
  const errors = [];
  if (!original || !Array.isArray(original.lines) || !original.lines.length) errors.push('original journal plan is required');
  const originalValidation = validateJournalPlan(original);
  if (!originalValidation.valid) errors.push('original journal plan must be valid and balanced');
  const originalJournalId = requiredId(original.journalId, 'originalJournalId', errors);
  const documentId = requiredId(command.documentId || command.reversalId, 'documentId', errors);
  const lines = errors.length ? [] : original.lines.map((line, i) => journalLine({
    index: i + 1,
    accountCode: line.accountCode,
    debitMinor: Number(line.creditMinor || 0),
    creditMinor: Number(line.debitMinor || 0),
    memo: `عكس: ${text(line.memo)}`,
    dims: line
  }));
  const plan = buildPlanEnvelope({ ...command, type: 'journal.reverse', documentId }, lines, {
    reversal: true,
    originalJournalId,
    originalDocumentId: text(original.documentId)
  });
  plan.errors = [...new Set([...errors, ...plan.errors])];
  plan.valid = plan.errors.length === 0 && plan.balance.balanced;
  plan.success = plan.valid;
  return plan;
}

export function buildFinancePostingPlan(command = {}) {
  const type = text(command.type);
  switch (type) {
    case 'sales-invoice.create': return salesInvoicePlan(command);
    case 'customer.collect': return customerCollectionPlan(command);
    case 'purchase.create': return purchasePlan(command);
    case 'purchase.pay': return supplierPaymentPlan(command);
    case 'expense.create': return expensePlan(command);
    case 'treasury.transfer': return treasuryTransferPlan(command);
    case 'journal.reverse': return reverseJournalPlan(command.originalPlan, command);
    default: return {
      version: TRENDOS_ACCOUNTING_FINANCE_CORE_VERSION,
      success: false,
      valid: false,
      persisted: false,
      authoritativeWrites: false,
      type,
      errors: ['unsupported finance plan type'],
      lines: []
    };
  }
}

export function financeCoreMetadata() {
  return {
    success: true,
    version: TRENDOS_ACCOUNTING_FINANCE_CORE_VERSION,
    phase: 'F2',
    mode: 'posting-plan-only',
    persisted: false,
    authoritativeWrites: false,
    currency: 'EGP',
    moneyPrecision: 'integer-piastres',
    planTypes: FINANCE_PLAN_TYPES,
    chartOfAccounts: Object.values(CHART_OF_ACCOUNTS_V1),
    invariants: [
      'Every journal must balance debit == credit in integer minor units.',
      'Every posting plan carries an idempotency key and actor identity.',
      'Party/customer/supplier references use stable IDs, not names.',
      'Order ID + Line ID + Profit Center dimensions are retained on sales economics.',
      'COGS/stock consumption is not invented in F2 and remains F3/F4.',
      'Reversal is append-only debit/credit swap; original journal is never deleted.',
      'F2 produces plans only and grants no financial persistence authority.'
    ]
  };
}
