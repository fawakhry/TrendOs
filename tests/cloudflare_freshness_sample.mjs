import fs from 'node:fs';

const maxAge = Number(process.env.MAX_LIVE_MIRROR_AGE_SECONDS || 180);
const sample = Number(process.env.SAMPLE || 0);
const ordersFile = process.env.ORDERS_FILE || '/tmp/orders.json';
const linesFile = process.env.LINES_FILE || '/tmp/lines.json';

function parseUtc(value) {
  const raw = String(value || '').trim();
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)
    ? raw.replace(' ', 'T') + 'Z'
    : raw;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : 0;
}

function inspect(file, label) {
  const x = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!x.success || !x.sheet || x.schemaMutationFree !== true) {
    throw new Error(label + ' invalid response');
  }
  const s = x.sheet;
  const ms = parseUtc(s.syncedAt);
  const ageSeconds = ms ? Math.max(0, Math.round((Date.now() - ms) / 1000)) : Number.MAX_SAFE_INTEGER;
  const out = {
    sample,
    label,
    rowCount: Number(s.rowCount || 0),
    sourceLastRow: Number(s.sourceLastRow || 0),
    sourceLastCol: Number(s.sourceLastCol || 0),
    syncedAt: String(s.syncedAt || ''),
    ageSeconds,
    status: String(s.status || ''),
    note: String(s.note || ''),
    fresh: ageSeconds <= maxAge
  };
  console.log('STABILITY=' + JSON.stringify(out));
  if (
    out.status !== 'ready' ||
    out.rowCount !== out.sourceLastRow ||
    out.note !== 'TrendOS orders live sync V1' ||
    !out.fresh
  ) {
    throw new Error(label + ' freshness stability failed at sample ' + sample);
  }
  return out;
}

const orders = inspect(ordersFile, 'ORDERS');
const lines = inspect(linesFile, 'LINES');
if (orders.syncedAt !== lines.syncedAt) {
  throw new Error('Orders/Lines snapshots diverged at sample ' + sample);
}
