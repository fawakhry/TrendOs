import fs from 'node:fs';
import { performance } from 'node:perf_hooks';

const url = String(process.env.T2_WORKER_URL || '').trim();
if (!url) throw new Error('T2_WORKER_URL_REQUIRED');

const expectedVersion = 'TASKS_V3_READONLY_T2_WAEL_CANARY_2';
const operator = 'وائل';
const role = 'WAEL';
const ops = [
  ...Array(8).fill('health'),
  ...Array(8).fill('status'),
  ...Array(7).fill('flyPrint'),
  ...Array(7).fill('pressCandidates')
];

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank))];
}

function round(value) {
  return value == null ? null : Math.round(value * 100) / 100;
}

function upstreamFromServerTiming(value) {
  const match = String(value || '').match(/(?:^|,\s*)upstream;dur=([0-9.]+)/i);
  return match ? Number(match[1]) : null;
}

function operationSemanticOk(op, body) {
  if (!body || body.success !== true || !body.body || body.body.success !== true) return false;
  const upstream = body.body;

  if (op === 'health') {
    return upstream.readOnly === true &&
      upstream.version === expectedVersion &&
      upstream.sourceReady === true &&
      upstream.canaryConfigured === true;
  }

  if (op === 'status') {
    return upstream.readOnly === true &&
      upstream.version === expectedVersion &&
      upstream.operator === operator &&
      upstream.role === role &&
      upstream.activeTask === null &&
      upstream.flyPrint && upstream.flyPrint.success === true &&
      upstream.pressCandidates && upstream.pressCandidates.success === true;
  }

  if (op === 'flyPrint') {
    return upstream.lane === 'flyPrint' &&
      Array.isArray(upstream.rows) &&
      Number.isInteger(upstream.count) &&
      upstream.count === upstream.rows.length;
  }

  if (op === 'pressCandidates') {
    return upstream.lane === 'press' &&
      Array.isArray(upstream.rows) &&
      Number.isInteger(upstream.count) &&
      upstream.count === upstream.rows.length;
  }

  return false;
}

const samples = [];
let httpFailures = 0;
let transportFailures = 0;
let semanticFailures = 0;

for (let i = 0; i < ops.length; i += 1) {
  const op = ops[i];
  const started = performance.now();
  let response;
  let raw = '';
  let body = null;
  let transportError = '';

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({ op, operator, role, payloadJson: '{}' }),
      signal: AbortSignal.timeout(15000)
    });
    raw = await response.text();
    try {
      body = JSON.parse(raw || '{}');
    } catch (_) {
      body = null;
    }
  } catch (err) {
    transportError = String(err && (err.name || err.message) || err);
  }

  const elapsedMs = performance.now() - started;
  const upstreamMs = response ? upstreamFromServerTiming(response.headers.get('server-timing')) : null;
  const httpOk = Boolean(response && response.ok);
  const semanticOk = Boolean(httpOk && operationSemanticOk(op, body));

  if (!response) transportFailures += 1;
  else if (!response.ok) httpFailures += 1;
  if (response && response.ok && !semanticOk) semanticFailures += 1;

  const upstreamBody = body && body.body;
  const sample = {
    n: i + 1,
    op,
    httpStatus: response ? response.status : null,
    success: semanticOk,
    elapsedMs: round(elapsedMs),
    upstreamMs: round(upstreamMs),
    code: body && body.code || null,
    resultCount: upstreamBody && Number.isInteger(upstreamBody.count) ? upstreamBody.count : null,
    transportError: transportError || null
  };
  samples.push(sample);
  console.log(JSON.stringify(sample));
}

const successSamples = samples.filter((sample) => sample.success);
const elapsed = successSamples.map((sample) => sample.elapsedMs);
const upstream = successSamples.map((sample) => sample.upstreamMs).filter((value) => Number.isFinite(value));
const operationMix = Object.fromEntries(
  [...new Set(ops)].map((op) => [op, ops.filter((value) => value === op).length])
);

const summary = {
  workerUrl: url,
  total: samples.length,
  successCount: successSamples.length,
  httpFailures,
  transportFailures,
  semanticFailures,
  operationMix,
  p50Ms: round(percentile(elapsed, 50)),
  p95Ms: round(percentile(elapsed, 95)),
  maxMs: round(elapsed.length ? Math.max(...elapsed) : null),
  upstreamP50Ms: round(percentile(upstream, 50)),
  upstreamP95Ms: round(percentile(upstream, 95)),
  upstreamMaxMs: round(upstream.length ? Math.max(...upstream) : null),
  acceptanceP95Ms: 2000,
  acceptancePass: successSamples.length === 30 &&
    httpFailures === 0 &&
    transportFailures === 0 &&
    semanticFailures === 0 &&
    percentile(elapsed, 95) <= 2000
};

fs.writeFileSync('/tmp/t2-qualification.json', JSON.stringify({ summary, samples }, null, 2));
console.log('T2_QUALIFICATION_SUMMARY ' + JSON.stringify(summary));

if (!summary.acceptancePass) process.exitCode = 2;
