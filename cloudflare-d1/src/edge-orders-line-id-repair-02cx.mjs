const GOOGLE_SHEETS_SERIAL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);
const GOOGLE_SHEETS_SERIAL_DAY_MS = 24 * 60 * 60 * 1000;

function text(value) {
  return String(value == null ? '' : value).trim();
}

export function repairSerializedLineId02CX(orderId, lineId) {
  const order = text(orderId);
  const line = text(lineId);
  if (!/^\d{3,6}$/.test(order) || !/^\d{5,8}$/.test(line)) return line;

  const serial = Number(line);
  if (!Number.isSafeInteger(serial) || serial <= 0) return line;
  const date = new Date(GOOGLE_SHEETS_SERIAL_EPOCH_UTC_MS + (serial * GOOGLE_SHEETS_SERIAL_DAY_MS));
  if (!Number.isFinite(date.getTime())) return line;

  const year = String(date.getUTCFullYear());
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  if (year !== order || day !== 1 || month < 1 || month > 12) return line;
  return `${order}-${String(month).padStart(2, '0')}`;
}

export function repairEdgeOrderRows02CX(rows) {
  let repaired = 0;
  const output = (Array.isArray(rows) ? rows : []).map((row) => {
    if (!row || typeof row !== 'object') return row;
    const current = text(row.lineId);
    const next = repairSerializedLineId02CX(row.orderId, current);
    if (!next || next === current) return row;
    repaired += 1;
    return { ...row, lineId: next };
  });
  return { rows: output, repaired };
}

export async function repairEdgeOrdersResponse02CX(response) {
  if (!response || !response.ok) return response;
  let body;
  try {
    body = await response.json();
  } catch (err) {
    return response;
  }
  if (!body || body.success !== true || !Array.isArray(body.rows)) {
    return new Response(JSON.stringify(body || {}), {
      status: response.status,
      headers: new Headers(response.headers)
    });
  }

  const result = repairEdgeOrderRows02CX(body.rows);
  body.rows = result.rows;
  body.lineIdentityRepair = {
    version: '02CX',
    repaired: result.repaired
  };
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(body), { status: response.status, headers });
}
