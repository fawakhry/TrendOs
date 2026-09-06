#!/usr/bin/env python3
from pathlib import Path
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--root', default='.')
args = parser.parse_args()
root = Path(args.root)

app_path = root / 'app.js'
index_path = root / 'index.html'
press_path = root / 'press-control-v1.js'
config_path = root / 'config.js'
test_path = root / 'tests/frontend_global_counters_filters_press_02cw.test.mjs'

app = app_path.read_text(encoding='utf-8')
index = index_path.read_text(encoding='utf-8')
press = press_path.read_text(encoding='utf-8')
config = config_path.read_text(encoding='utf-8')

state_anchor = '    serverStatusCounts: {},\n    serverStatusOrderCounts: {},\n'
if '    activeSummaryCounts: null,\n' not in app:
    if state_anchor not in app:
        raise SystemExit('app state anchor missing')
    app = app.replace(state_anchor, state_anchor + '    activeSummaryCounts: null,\n', 1)

load_anchor = '      state.serverStatusCounts = res.statusCounts || {};\n      state.serverStatusOrderCounts = res.statusOrderCounts || {};\n'
load_new = load_anchor + '      if (res.activeSummaryCounts && typeof res.activeSummaryCounts === "object") state.activeSummaryCounts = res.activeSummaryCounts;\n'
if 'state.activeSummaryCounts = res.activeSummaryCounts' not in app:
    if load_anchor not in app:
        raise SystemExit('app load summary anchor missing')
    app = app.replace(load_anchor, load_new, 1)

old_priority = '    const priority = $("priorityFilter").value || "__ACTIVE__";'
new_priority = '    const priority = $("priorityFilter").value;'
if new_priority not in app:
    if old_priority not in app:
        raise SystemExit('priority local filter anchor missing')
    app = app.replace(old_priority, new_priority, 1)

render_start = app.index('  function renderStats(rows) {')
render_end = app.index('\n  function ', render_start + 10)
if render_start < 0 or render_end < 0:
    raise SystemExit('renderStats boundaries missing')
new_render = '''  function renderStats(rows) {
    const summary = state.serverPaging.enabled && state.activeSummaryCounts && typeof state.activeSummaryCounts === "object"
      ? state.activeSummaryCounts : null;
    const displayed = summary ? Number(summary.total || 0) : rows.length;
    const urgent = summary ? Number(summary.urgent || 0) : rows.filter(r => r.priority === "عاجل" || r.priority === "VIP").length;
    const normal = summary ? Number(summary.normal || 0) : rows.filter(r => !r.priority || r.priority === "عادي").length;
    const problem = summary ? Number(summary.problems || 0) : rows.filter(r => WORK_PROBLEM_STATUS.includes(normalizeStatus(r.status))).length;
    const overdue = summary ? Number(summary.overdue || 0) : rows.filter(r => text(r.overdue) === "نعم").length;
    const debts = summary ? Number(summary.debts || 0) : rows.filter(r => Number(r.debtAmount || 0) > 0).length;
    const heatPress = summary ? Number(summary.heatPress || 0) : rows.filter(r => isHeatPress(r.heatPress)).length;
    const cancelled = summary ? Number(summary.cancelled || 0) : rows.filter(r => normalizeStatus(r.status) === "ملغى").length;
    const flyPrint = summary ? Number(summary.flyPrint || 0) : rows.filter(r => isFlyPrint(r.flyPrint || r.quickPrint || r.fastPrint || r["طباعة على الطاير"] || r["طباعة ع الطاير"])).length;
    statsBar.innerHTML =
      "<span class='stat-chip'>المعروض: <b>" + displayed + "</b></span>" +
      "<span class='stat-chip blue'>عاجل: <b>" + urgent + "</b></span>" +
      "<span class='stat-chip'>عادي: <b>" + normal + "</b></span>" +
      "<span class='stat-chip red'>متأخرة: <b>" + overdue + "</b></span>" +
      "<span class='stat-chip red'>مديونية: <b>" + debts + "</b></span>" +
      "<span class='stat-chip red'>مكبس: <b>" + heatPress + "</b></span>" +
      "<span class='stat-chip'>طباعة على الطاير: <b>" + flyPrint + "</b></span>" +
      "<span class='stat-chip blue'>ملغي: <b>" + cancelled + "</b></span>" +
      "<span class='stat-chip'>مشاكل/متوقف: <b>" + problem + "</b></span>";
  }
'''
app = app[:render_start] + new_render + app[render_end:]
app_path.write_text(app, encoding='utf-8')

old_priority_html = '<option value="__ACTIVE__" selected>العاجل والعادي فقط</option>\n          <option value="">كل الأولويات</option>'
new_priority_html = '<option value="__ACTIVE__">العاجل والعادي فقط</option>\n          <option value="" selected>كل الأولويات</option>'
if new_priority_html not in index:
    if old_priority_html not in index:
        raise SystemExit('priority html anchor missing')
    index = index.replace(old_priority_html, new_priority_html, 1)

old_config_loader = 'config.js?v=trendos-02cu-resume-20260906a'
new_config_loader = 'config.js?v=trendos-02cw-globalcounts-20260906d'
if new_config_loader not in index:
    if old_config_loader not in index:
        raise SystemExit('config cache-bust anchor missing')
    index = index.replace(old_config_loader, new_config_loader, 1)

old_app_loader = 'app.js?v=trendos-02cv-flylane-20260906c'
new_app_loader = 'app.js?v=trendos-02cw-globalcounts-20260906d'
if new_app_loader not in index:
    if old_app_loader not in index:
        raise SystemExit('app cache-bust anchor missing')
    index = index.replace(old_app_loader, new_app_loader, 1)
index_path.write_text(index, encoding='utf-8')

old_press_loader = "trendLoadModuleV1932('trendPressControlV1Loader','press-control-v1.js?v=20260826a');"
new_press_loader = "trendLoadModuleV1932('trendPressControlV1Loader','press-control-v1.js?v=20260906-02cw');"
if new_press_loader not in config:
    if old_press_loader not in config:
        raise SystemExit('press loader anchor missing')
    config = config.replace(old_press_loader, new_press_loader, 1)
config_path.write_text(config, encoding='utf-8')

old_queue = "function queueLabel(q){q=q||{};const items=Array.isArray(q.items)?q.items:[];const unique={};items.forEach(function(x){const id=txt(x.orderId||x['رقم الأوردر']||x.order||'');if(id)unique[id]=1;});const lines=Number(q.count||items.length||0),orders=Object.keys(unique).length||Number(q.orderCount||q.orders||0)||lines;let out='Queue المكبس: '+orders+' أوردر • '+lines+' بند';if(Number(q.urgent||0)>0)out+=' • عاجل: '+Number(q.urgent||0)+' بند';return out;}"
new_queue = "function queueLabel(q){q=q||{};const items=Array.isArray(q.items)?q.items:[];const unique={};items.forEach(function(x){const id=txt(x.orderId||x['رقم الأوردر']||x.order||'');if(id)unique[id]=1;});const lines=Number(q.count||items.length||0),summary=window.trendosState&&window.trendosState.activeSummaryCounts&&typeof window.trendosState.activeSummaryCounts==='object'?window.trendosState.activeSummaryCounts:null,hasGlobalOrders=!!(summary&&Object.prototype.hasOwnProperty.call(summary,'heatPressOrders')),orders=hasGlobalOrders?Number(summary.heatPressOrders||0):(Number(q.orderCount||q.orders||0)||Object.keys(unique).length||lines);let out='Queue المكبس: '+orders+' أوردر • '+lines+' بند';if(Number(q.urgent||0)>0)out+=' • عاجل: '+Number(q.urgent||0)+' بند';return out;}"
if new_queue not in press:
    if old_queue not in press:
        raise SystemExit('press queueLabel anchor missing')
    press = press.replace(old_queue, new_queue, 1)
press_path.write_text(press, encoding='utf-8')

test_path.write_text("""import fs from 'node:fs';
import assert from 'node:assert/strict';

const app=fs.readFileSync('app.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const press=fs.readFileSync('press-control-v1.js','utf8');
const config=fs.readFileSync('config.js','utf8');

assert.match(app,/activeSummaryCounts:\\s*null/);
assert.match(app,/res\\.activeSummaryCounts && typeof res\\.activeSummaryCounts === \"object\"/);
assert.doesNotMatch(app,/state\\.activeSummaryCounts\\s*=\\s*res\\.activeSummaryCounts\\s*\\|\\|\\s*\\{\\}/);
assert.match(app,/const displayed = summary \\? Number\\(summary\\.total \\|\\| 0\\) : rows\\.length/);
for(const key of ['urgent','normal','problems','overdue','debts','heatPress','cancelled','flyPrint']) assert.ok(app.includes('summary.'+key),key);
assert.match(app,/const priority = \\$\\(\"priorityFilter\"\\)\\.value;/);
assert.doesNotMatch(app,/const priority = \\$\\(\"priorityFilter\"\\)\\.value \\|\\| \"__ACTIVE__\";/);
assert.match(app,/priorityFilter: \\(\\$\\(\"priorityFilter\"\\) \\|\\| \\{\\}\\)\\.value \\|\\| \"\"/);
assert.match(index,/<option value=\"__ACTIVE__\" selected>الحالات الجارية فقط<\\/option>/);
assert.match(index,/<option value=\"__ACTIVE__\">العاجل والعادي فقط<\\/option>\\s*<option value=\"\" selected>كل الأولويات<\\/option>/);
assert.match(index,/config\\.js\\?v=trendos-02cw-globalcounts-20260906d/);
assert.match(index,/app\\.js\\?v=trendos-02cw-globalcounts-20260906d/);
assert.match(config,/press-control-v1\\.js\\?v=20260906-02cw/);
assert.match(press,/activeSummaryCounts/);
assert.match(press,/heatPressOrders/);
assert.match(press,/hasGlobalOrders\\?Number\\(summary\\.heatPressOrders\\|\\|0\\)/);
assert.match(press,/Number\\(q\\.orderCount\\|\\|q\\.orders\\|\\|0\\)\\|\\|Object\\.keys\\(unique\\)\\.length\\|\\|lines/);
console.log('PERF_CF_02CW_FRONTEND_GLOBAL_COUNTERS_FILTERS_PRESS_PASS');
""", encoding='utf-8')

print('02CW_FRONTEND_PATCH_APPLIED')
