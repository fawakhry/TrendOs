# TrendOS Tasks V3 — temporary latency-smoke wrapper authorized — 2026-09-18

## Timestamp
2026-09-18 14:34 EEST

## Owner authorization
Owner explicitly authorized:
`نفّذ الـwrapper المؤقت.`

## Authorized temporary mutation
Add one temporary public read-only wrapper to isolated T2 Head only:

```javascript
function tasksV3LatencySmoke() {
  const startedAt = Date.now();
  tasksV3ProductionProjection_();
  return {
    success: true,
    elapsedMs: Date.now() - startedAt
  };
}
```

Purpose:
- make the private helper `tasksV3ProductionProjection_()` selectable from Apps Script editor;
- execute exactly 3 latency-smoke runs;
- collect only success/failure and elapsed duration;
- do not inspect or expose business-data rows.

## Mandatory rollback
Immediately after the three smoke runs:
1. restore `Code.gs` exactly from authoritative source commit `31565dfdbf7b63744b32b02e5042a5f6b0664249`;
2. Save Head only;
3. perform independent read-only verification;
4. confirm temporary wrapper absent and authoritative markers restored.

## Prohibited
- Deploy/version;
- Properties/Secrets;
- Services changes;
- business-data writes;
- claimNext / completeTask;
- T1/V4/V5/Worker change;
- T3.

## Current branch pre-write head
The branch head was fetched immediately before this record. No wrapper mutation had occurred yet.
