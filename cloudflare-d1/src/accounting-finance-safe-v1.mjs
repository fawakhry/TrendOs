import {
  CHART_OF_ACCOUNTS_V1,
  FINANCE_PLAN_TYPES,
  TRENDOS_ACCOUNTING_FINANCE_CORE_VERSION,
  buildFinancePostingPlan,
  minorToMoney,
  moneyToMinor,
  validateJournalPlan
} from './accounting-finance-core-v1.mjs';
import {
  normalizeStableId,
  validateIdempotencyEnvelope,
  validateStableId
} from './accounting-foundation-v1.mjs';

export const TRENDOS_ACCOUNTING_FINANCE_SAFE_VERSION = 'TRENDOS_ACCOUNTING_F2_FINANCE_SAFE_V1_20260905';

function text(value) { return String(value == null ? '' : value).trim(); }
function requiredId(value, field, errors) {
  const result = validateStableId(value, field);
  errors.push(...result.errors);
  return result.value;
}
function treasuryId(value) { return normalizeStableId(value); }
function isTreasuryAccount(code) {
  const role = CHART_OF_ACCOUNTS_V1[text(code)] && CHART_OF_ACCOUNTS_V1[text(code)].role;
  return role === 'cash-main' || role === 'bank';
}
function dedupe(values) { return [...new Set(values.filter(Boolean))]; }

function addTreasuryIdentity(plan, command) {
  if (!plan || !Array.isArray(plan.lines)) return plan;
  const type = text(command.type);
  let id = '';
  if (type === 'customer.collect' || type === 'purchase.pay') id = treasuryId(command.treasuryId || command.cashboxId);
  if (type === 'expense.create' && text(command.paymentMode || 'cash').toLowerCase() === 'cash') id = treasuryId(command.treasuryId || command.cashboxId);
  if (!id) return plan;
  return {
    ...plan,
    lines: plan.lines.map((line) => isTreasuryAccount(line.accountCode) ? { ...line, treasuryId: id } : line)
  };
}

export function validateFinancePlanDimensions(plan = {}) {
  const errors = [];
  const lines = Array.isArray(plan.lines) ? plan.lines : [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] || {};
    const role = CHART_OF_ACCOUNTS_V1[text(line.accountCode)] && CHART_OF_ACCOUNTS_V1[text(line.accountCode)].role;
    if ((role === 'accounts-receivable' || role === 'accounts-payable') && !text(line.partyId)) {
      errors.push(`line ${i + 1} requires stable partyId`);
    }
    if ((role === 'cash-main' || role === 'bank') && !text(line.treasuryId)) {
      errors.push(`line ${i + 1} requires stable treasuryId/cashboxId`);
    }
  }
  return { ok: errors.length === 0, errors: dedupe(errors) };
}

function finishPlan(plan, extraErrors = []) {
  const journal = validateJournalPlan(plan);
  const dimensions = validateFinancePlanDimensions(plan);
  const errors = dedupe([...(plan.errors || []), ...extraErrors, ...(journal.errors || []), ...(dimensions.errors || [])]);
  return {
    ...plan,
    version: TRENDOS_ACCOUNTING_FINANCE_SAFE_VERSION,
    financeCoreVersion: TRENDOS_ACCOUNTING_FINANCE_CORE_VERSION,
    persisted: false,
    authoritativeWrites: false,
    persistence: 'none',
    balance: journal,
    errors,
    valid: errors.length === 0 && journal.balanced,
    success: errors.length === 0 && journal.balanced,
    mutationExecuted: false
  };
}

function buildTreasuryTransfer(command) {
  const errors = [];
  const amountMinor = moneyToMinor(command.amount);
  if (amountMinor == null || amountMinor <= 0) errors.push('amount must be greater than zero');
  const documentId = requiredId(command.documentId || command.transferId, 'documentId', errors);
  const actorId = requiredId(command.actorId, 'actorId', errors);
  const fromAccountCode = text(command.fromAccountCode);
  const toAccountCode = text(command.toAccountCode);
  const fromAccount = CHART_OF_ACCOUNTS_V1[fromAccountCode];
  const toAccount = CHART_OF_ACCOUNTS_V1[toAccountCode];
  if (!fromAccount || !isTreasuryAccount(fromAccountCode)) errors.push('fromAccountCode must be a treasury account');
  if (!toAccount || !isTreasuryAccount(toAccountCode)) errors.push('toAccountCode must be a treasury account');
  if (fromAccountCode && fromAccountCode === toAccountCode) errors.push('treasury transfer accounts must differ');
  const fromTreasuryId = requiredId(command.fromTreasuryId || command.fromCashboxId, 'fromTreasuryId', errors);
  const toTreasuryId = requiredId(command.toTreasuryId || command.toCashboxId, 'toTreasuryId', errors);
  if (fromTreasuryId && toTreasuryId && fromTreasuryId === toTreasuryId) errors.push('treasury transfer entities must differ');
  const idem = validateIdempotencyEnvelope({
    idempotencyKey: command.idempotencyKey || command.requestId || command.eventId,
    commandType: 'treasury.post',
    actorId,
    source: command.source || 'trendos-accounting',
    occurredAt: command.occurredAt
  });
  errors.push(...idem.errors);
  const journalId = normalizeStableId(command.journalId || `JRN-${idem.normalized.idempotencyKey || documentId}`);
  const dims = {
    orderId: normalizeStableId(command.orderId),
    lineId: normalizeStableId(command.lineId),
    departmentId: normalizeStableId(command.departmentId),
    profitCenterId: normalizeStableId(command.profitCenterId),
    sourceDocumentId: documentId
  };
  const lines = errors.length || !amountMinor ? [] : [
    {
      lineNo: 1, accountCode: toAccountCode, accountName: toAccount.name,
      debitMinor: amountMinor, creditMinor: 0, debit: minorToMoney(amountMinor), credit: 0,
      memo: 'تحويل خزنة - وارد', treasuryId: toTreasuryId, ...dims
    },
    {
      lineNo: 2, accountCode: fromAccountCode, accountName: fromAccount.name,
      debitMinor: 0, creditMinor: amountMinor, debit: 0, credit: minorToMoney(amountMinor),
      memo: 'تحويل خزنة - صادر', treasuryId: fromTreasuryId, ...dims
    }
  ];
  return finishPlan({
    type: 'treasury.transfer', journalId, documentId,
    idempotencyKey: idem.normalized.idempotencyKey, actorId: idem.normalized.actorId,
    source: idem.normalized.source, occurredAt: idem.normalized.occurredAt,
    currency: 'EGP', lines,
    metadata: { transfer: true, fromAccountCode, toAccountCode, fromTreasuryId, toTreasuryId },
    errors
  });
}

function buildJournalReversal(command) {
  const errors = [];
  const original = command.originalPlan || {};
  const originalJournal = validateJournalPlan(original);
  const originalDimensions = validateFinancePlanDimensions(original);
  if (!originalJournal.valid) errors.push('original journal plan must be valid and balanced');
  if (!originalDimensions.ok) errors.push(...originalDimensions.errors.map((x) => `original ${x}`));
  const originalJournalId = requiredId(original.journalId, 'originalJournalId', errors);
  const documentId = requiredId(command.documentId || command.reversalId, 'documentId', errors);
  const actorId = requiredId(command.actorId, 'actorId', errors);
  const reason = text(command.reason);
  if (!reason) errors.push('reversal reason is required');
  const idem = validateIdempotencyEnvelope({
    idempotencyKey: command.idempotencyKey || command.requestId || command.eventId,
    commandType: 'reversal.create',
    actorId,
    source: command.source || 'trendos-accounting',
    occurredAt: command.occurredAt
  });
  errors.push(...idem.errors);
  const journalId = normalizeStableId(command.journalId || `JRN-${idem.normalized.idempotencyKey || documentId}`);
  const lines = errors.length ? [] : original.lines.map((line, i) => ({
    ...line,
    lineNo: i + 1,
    debitMinor: Number(line.creditMinor || 0),
    creditMinor: Number(line.debitMinor || 0),
    debit: minorToMoney(Number(line.creditMinor || 0)),
    credit: minorToMoney(Number(line.debitMinor || 0)),
    sourceDocumentId: documentId,
    memo: `عكس: ${reason} | ${text(line.memo)}`
  }));
  return finishPlan({
    type: 'journal.reverse', journalId, documentId,
    idempotencyKey: idem.normalized.idempotencyKey, actorId: idem.normalized.actorId,
    source: idem.normalized.source, occurredAt: idem.normalized.occurredAt,
    currency: 'EGP', lines,
    metadata: { reversal: true, originalJournalId, originalDocumentId: text(original.documentId), reason },
    errors
  });
}

export function buildSafeFinancePostingPlan(command = {}) {
  const type = text(command.type);
  if (!FINANCE_PLAN_TYPES.includes(type)) {
    return finishPlan({ type, journalId: '', documentId: '', idempotencyKey: '', currency: 'EGP', lines: [], errors: ['unsupported finance plan type'] });
  }
  if (type === 'treasury.transfer') return buildTreasuryTransfer(command);
  if (type === 'journal.reverse') return buildJournalReversal(command);

  let plan = buildFinancePostingPlan(command);
  const treasuryRequired = type === 'customer.collect' || type === 'purchase.pay' ||
    (type === 'expense.create' && text(command.paymentMode || 'cash').toLowerCase() === 'cash');
  const extraErrors = [];
  if (treasuryRequired) {
    const check = validateStableId(command.treasuryId || command.cashboxId, 'treasuryId');
    if (!check.ok) extraErrors.push(...check.errors);
  }
  plan = addTreasuryIdentity(plan, command);
  return finishPlan(plan, extraErrors);
}

export function financeSafeMetadata() {
  return {
    success: true,
    version: TRENDOS_ACCOUNTING_FINANCE_SAFE_VERSION,
    financeCoreVersion: TRENDOS_ACCOUNTING_FINANCE_CORE_VERSION,
    phase: 'F2',
    mode: 'posting-plan-only',
    persisted: false,
    authoritativeWrites: false,
    persistence: 'none',
    planTypes: [...FINANCE_PLAN_TYPES],
    treasuryIdentity: {
      requiredForTreasuryLegs: true,
      canonicalField: 'treasuryId',
      compatibilityAlias: 'cashboxId',
      transferFields: ['fromTreasuryId','toTreasuryId']
    },
    commandTypeBridge: {
      'treasury.transfer': 'treasury.post',
      'journal.reverse': 'reversal.create'
    },
    rules: [
      'AR/AP journal legs require stable Party ID.',
      'Cash/bank journal legs require stable Treasury/Cashbox ID.',
      'Treasury transfer source and destination identities must differ.',
      'Reversal requires a valid balanced original plan and preserves its dimensions.',
      'All plans remain zero-persistence and non-authoritative.'
    ]
  };
}
