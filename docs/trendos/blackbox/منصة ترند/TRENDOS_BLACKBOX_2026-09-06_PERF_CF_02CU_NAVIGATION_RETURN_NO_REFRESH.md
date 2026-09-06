# PERF-CF-02CU — NAVIGATION-RETURN-NO-REFRESH

Date: 2026-09-06
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## هدف الـcheckpoint

منع TrendOS من إعادة تحميل الداتا أو توليد traffic إضافي لمجرد أن المستخدم خرج إلى Tab / أداة أخرى ثم عاد، مع الحفاظ على refresh اليدوي والـsession وD1-first Orders reads وApps Script fallback وtimers الضرورية.

## السبب الحقيقي — full platform refresh

الـlegacy frontend في `app.js` يحتوي `safeRefresh()` ويضغط `#refreshBtn` برمجيًا، وكان مربوطًا بثلاثة triggers:

- `document.visibilitychange` عند الرجوع إلى visible؛
- `window.focus`؛
- `setInterval(safeRefresh, 180000)`.

ضغط `refreshBtn` يؤدي إلى مسار full data refresh، لذلك كان الرجوع إلى TrendOS يبدو كأن المنصة بدأت من أول وجديد.

الإصلاح الأساسي السابق `trendos-resume-no-autorefresh-v1.js` يمنع فقط `refreshBtn.click()` القادم من stack الخاص بـ`safeRefresh`، ويترك زر التحديث اليدوي وأي refresh غير ناتج من `safeRefresh` كما هو.

Production evidence للإصلاح الأساسي:

- production commit قبل هذا checkpoint: `20a56241da2919e31fc12cb5224d29ac18fdf4f3`
- bounded production workflow Run `34027313379` — **SUCCESS**
- GitHub Pages Run `34027347761` — **SUCCESS**

## residual return traffic الذي ظهر في التدقيق

بعد منع full refresh، بقي مصدران لا يعملان reset للمنصة لكن يمكن أن يضيفا requests عند الرجوع:

1. `attendance-v1.js`
   - `visibilitychange -> visible -> loadState()`
   - مع وجود loop دوري `loadState()` كل 60 ثانية أصلًا.

2. `employee-manager-strips-v2.js`
   - `window.focus -> refresh({source:'focus'})`
   - `refresh()` يقرأ `getRows` + `getMatbagyNotes`، مع وجود interval دوري كل 60 ثانية وminimum refresh window.

`customer-feedback-v1.js` يحتوي focus listener داخل start path، لكن production config يحافظ على:

`MATBAGY_CUSTOMER_FEEDBACK_AUTO_SCAN_V1 = false`

وبالتالي الـauto scan/focus registration لا يبدأ في الوضع الحالي.

## Candidate الجديد — narrow early guard

أضيف ملف مستقل صغير:

`trendos-return-traffic-quiet-v1.js`

وظيفته الوحيدة هي اعتراض تسجيل listenerين المعروفين أعلاه قبل تحميل باقي modules:

- يمنع Attendance `visibilitychange` listener فقط إذا كان source الخاص به يطابق `loadState()` + `currentUser()` + `document.hidden`؛
- يمنع Employee Manager `focus` listener فقط إذا كان source الخاص به يطابق `refresh({source:'focus'})`؛
- لا يمنع legacy `safeRefresh` listeners؛
- لا يمنع Customer Feedback focus listener؛
- لا يمنع أي focus/visibility listener آخر؛
- لا يعمل أي network request بنفسه.

Timers الضرورية بقيت كما هي:

- Attendance state loop كل 60 ثانية؛
- Attendance presence/prayer timers؛
- Employee Manager interval كل 60 ثانية.

## Candidate / CI evidence

Candidate commits:

- guard: `4bbbfd7a51d74ac7c286d0d86e6bb5b2847f1c54`
- regression test: `9dfdb55b6c27b72e7f3cf2a88c93bdb8bb5aff70`
- dedicated CI workflow: `e5051df3cbf44ee3bc536e44059bce7d26105b6b`

Runs on candidate HEAD `e5051df3cbf44ee3bc536e44059bce7d26105b6b`:

- TrendOS Return Traffic Quiet V1 CI — Run `34028439196` — **SUCCESS**
- TrendOS Integrity V1 — Run `34028439136` — **SUCCESS**

Regression coverage proves:

- the two exact residual listeners are suppressed;
- legacy safeRefresh registration is not broadly blocked;
- unrelated focus/visibility listeners remain registered;
- D1 Orders read wrapper remains ON;
- D1 freshness gate remains 5 minutes;
- `__DEBT__` remains outside D1 eligible reads;
- Apps Script fallback path remains present;
- Trend Master resilience remains enabled with concurrency `2` and attempts `1`;
- Customer Feedback auto scan remains OFF;
- Go-Live Autopilot auto sweep remains OFF;
- demo operations remain disabled.

## Bounded production deploy

Temporary bounded workflow commit:

`6e524682588e6360e1ec755843e2d371ce668e03`

Safety guards before mutation:

- exact production base required: `20a56241da2919e31fc12cb5224d29ac18fdf4f3`;
- candidate syntax + regression rerun;
- production config safety flags checked;
- exact changed-file scope enforced.

Exact production scope:

- `trendos-return-traffic-quiet-v1.js` — new frontend guard;
- `index.html` — one early synchronous script include before `config.js`.

No other production file was allowed by the scope gate.

Production workflow:

- TrendOS 02CU Return Traffic Quiet Production TEMP — Run `34028483654` — **SUCCESS**
- same-push TrendOS Integrity V1 — Run `34028483586` — **SUCCESS**

Production commit:

`9552407c5a5136371f9afd452b913c226329d7dc`

Commit message:

`Quiet residual return-to-tab background traffic`

GitHub Pages:

- Run `34028490166` — **SUCCESS** on production SHA `9552407c5a5136371f9afd452b913c226329d7dc`

The production `index.html` now loads:

`trendos-return-traffic-quiet-v1.js?v=trendos-02cu-return-quiet-20260906a`

before `config.js`.

The temporary production workflow was removed from the working branch after the successful deploy. Rollback base for this residual guard is:

`20a56241da2919e31fc12cb5224d29ac18fdf4f3`

## UI state decision

No new PII or customer dataset is stored.

No new token/session storage mechanism was added.

Reason:

- TrendOS already stores the employee session and current screen in its existing sessionStorage path;
- external employee/customer tools are generally opened in separate windows/tabs;
- the reported bug was a return/focus refresh trigger, not a hard unload/navigation-state loss.

Therefore adding extra filters/search/customer state persistence in this hotfix would increase scope and regression risk without being required to solve the current defect. It can be handled separately only if a real hard-navigation state-loss case is reproduced.

## Expected production behavior now

After one normal/manual reload to receive the new production assets:

- switching to another tab and returning must not trigger full platform refresh;
- returning must not create the Attendance visibility `loadState()` request solely because the tab became visible;
- returning must not create the Employee Manager `getRows + getMatbagyNotes` pair solely because window focus returned;
- the current screen, filters/page/search held in live SPA state should remain untouched;
- the user remains logged in;
- manual `تحديث البيانات` still works;
- attendance/employee bounded periodic timers continue normally;
- Trend Master remains manual/bounded and does not regain heavy startup loading.

## Safety boundary — unchanged

- Apps Script New Version / Deploy: **NO**
- Worker production deploy: **NO**
- D1 writes: **NO**
- authority transfer: **NO**
- Sheets / Apps Script authority: **YES**
- eligible Orders reads: **D1 first**
- Apps Script fallback: **retained**
- `__DEBT__`: **Apps Script**
- 02CL: **OFF**
- generic drain: **OFF**
- secret rotation: **NO**
- `EDGE_SESSION_SECRET` change: **NO**

## User-visible validation

Technical deployment and CI are **PASS**.

User-visible validation is still **PENDING** until the user performs the real browser return test and confirms that the screen no longer reloads/restarts when switching away and back.

## Separate pending 02CU item

Orders Live Sync V2 / `بنود الأوردرات` heartbeat recovery remains a separate pending 02CU item. Do not infer that it was activated by this frontend change.

The D1 freshness fail-safe remains the protection against stale Orders reads until that sync heartbeat is separately recovered and qualified.

## نقطة الوقوف الدقيقة

`PERF-CF-02CU / NAVIGATION-RETURN-NO-REFRESH — TECHNICAL PASS — PRODUCTION MAIN 9552407c5a5136371f9afd452b913c226329d7dc — GITHUB PAGES SUCCESS — FULL SAFE-REFRESH RETURN RELOAD SUPPRESSED + RESIDUAL ATTENDANCE/EMPLOYEE RETURN TRAFFIC QUIETED — MANUAL REFRESH + REQUIRED TIMERS RETAINED — USER-VISIBLE VALIDATION PENDING — ORDERS LIVE SYNC HEARTBEAT RECOVERY PENDING`
