import {
  buildSafeFinancePostingPlan,
  financeSafeMetadata
} from './accounting-finance-safe-v1.mjs';

export const ACCOUNTING_FINANCE_API_PATHS = Object.freeze([
  '/v1/accounting/finance',
  '/v1/accounting/finance/plan'
]);

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-trendos-module': 'accounting',
      'x-trendos-accounting-phase': 'F2',
      'x-trendos-accounting-persistence': 'none'
    }
  });
}

export function isAccountingFinanceApiPath(path) {
  const normalized = String(path || '').replace(/\/+$/, '') || '/';
  return ACCOUNTING_FINANCE_API_PATHS.includes(normalized);
}

export async function handleAccountingFinanceApiRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (path === '/v1/accounting/finance') {
    if (request.method !== 'GET') {
      return json({
        success: false,
        code: 'finance-metadata-read-only',
        authoritativeWrites: false,
        persisted: false,
        persistence: 'none'
      }, 405);
    }
    return json(financeSafeMetadata());
  }

  if (path === '/v1/accounting/finance/plan') {
    if (request.method !== 'POST') {
      return json({
        success: false,
        code: 'finance-plan-post-only',
        authoritativeWrites: false,
        persisted: false,
        persistence: 'none'
      }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return json({
        success: false,
        valid: false,
        code: 'invalid-json',
        authoritativeWrites: false,
        persisted: false,
        persistence: 'none',
        errors: ['A valid JSON request body is required']
      }, 400);
    }

    const plan = buildSafeFinancePostingPlan(body);
    return json({ ...plan, planningOnly: true }, plan.valid ? 200 : 422);
  }

  return json({ success: false, code: 'not-found', authoritativeWrites: false, persistence: 'none' }, 404);
}
