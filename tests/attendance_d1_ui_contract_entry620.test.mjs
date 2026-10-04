import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('attendance-v1.js','utf8');

function extractFunction(name) {
  const marker = 'function ' + name + '(';
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, name + ' must exist');
  const brace = source.indexOf('{', start);
  assert.notEqual(brace, -1, name + ' body must exist');
  let depth = 0;
  let inString = false;
  let quote = '';
  let escape = false;
  for (let i = brace; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === quote) { inString = false; quote = ''; }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inString = true; quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

const normalize = Function('"use strict"; return (' + extractFunction('normalizeAttendanceBackendResponse') + ');')();

const legacy = { success:true, state:{status:'working'}, config:{} };
assert.equal(normalize(legacy), legacy, 'legacy Apps Script contract must remain untouched');

const empty = normalize({ success:true, started:false, config:{DEFAULT_WORKDAY_START:'12:00'} });
assert.equal(empty.state.status, 'not_started');
assert.equal(empty.state.workMinutes, 0);

const base = 1700000000000;
const started = normalize({
  success:true,
  started:true,
  attendance:{dayStatus:'OPEN',startedAtMs:base,endedAtMs:null},
  pulses:[{type:'start',createdAtMs:base}],
  config:{}
});
assert.equal(started.state.status, 'working', 'D1 start response must unlock the start overlay');

const paused = normalize({
  success:true,
  started:true,
  attendance:{dayStatus:'OPEN',startedAtMs:base,endedAtMs:null},
  pulses:[
    {type:'pause',createdAtMs:base+60000},
    {type:'start',createdAtMs:base}
  ],
  config:{}
});
assert.equal(paused.state.status, 'paused');

const resumed = normalize({
  success:true,
  started:true,
  attendance:{dayStatus:'OPEN',startedAtMs:base,endedAtMs:null},
  pulses:[
    {type:'resume',createdAtMs:base+120000},
    {type:'pause',createdAtMs:base+60000},
    {type:'start',createdAtMs:base}
  ],
  config:{}
});
assert.equal(resumed.state.status, 'working');

const review = normalize({
  success:true,
  started:true,
  attendance:{dayStatus:'OPEN',startedAtMs:base,endedAtMs:null},
  pulses:[
    {type:'missed_check',createdAtMs:base+60000,reviewReason:'test-review'},
    {type:'start',createdAtMs:base}
  ],
  config:{}
});
assert.equal(review.state.status, 'review');
assert.equal(review.state.needsReview, true);
assert.equal(review.state.reviewReason, 'test-review');

const reviewCleared = normalize({
  success:true,
  started:true,
  attendance:{dayStatus:'OPEN',startedAtMs:base,endedAtMs:null},
  pulses:[
    {type:'resume',createdAtMs:base+120000},
    {type:'missed_check',createdAtMs:base+60000,reviewReason:'test-review'},
    {type:'start',createdAtMs:base}
  ],
  config:{}
});
assert.equal(reviewCleared.state.status, 'working');
assert.equal(reviewCleared.state.needsReview, false);

const ended = normalize({
  success:true,
  started:true,
  attendance:{dayStatus:'ENDED',startedAtMs:base,endedAtMs:base+180000},
  pulses:[
    {type:'end_day',createdAtMs:base+180000},
    {type:'resume',createdAtMs:base+120000},
    {type:'pause',createdAtMs:base+60000},
    {type:'start',createdAtMs:base}
  ],
  config:{}
});
assert.equal(ended.state.status, 'ended');
assert.equal(ended.state.totalMinutes, 3);
assert.equal(ended.state.workMinutes, 2);
assert.equal(ended.state.pauseMinutes, 1);

assert.match(
  source,
  /return normalizeAttendanceBackendResponse\(out\);/,
  'callAttendanceBackend must normalize D1 response before UI consumes it'
);

console.log('ENTRY620_ATTENDANCE_D1_UI_CONTRACT=PASS');
console.log('ENTRY620_D1_START_UNLOCKS_PLATFORM=PASS');
console.log('ENTRY620_LEGACY_ATTENDANCE_CONTRACT_PRESERVED=PASS');
