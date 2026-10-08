import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const config=fs.readFileSync(new URL('../config.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

const appended=[];
const timers=[];
const nodes=new Map();
const document={
  getElementById(id){ return nodes.get(id)||null; },
  createElement(tag){
    const el={tagName:String(tag).toUpperCase(),id:'',src:'',defer:false};
    return el;
  },
  head:{ appendChild(el){ appended.push(el); if(el.id)nodes.set(el.id,el); } },
  documentElement:{ appendChild(el){ appended.push(el); if(el.id)nodes.set(el.id,el); } }
};
const window={};
const sandbox={window,document,console,setTimeout(fn,ms){timers.push({fn,ms});return timers.length;},clearTimeout(){}};
vm.runInNewContext(config,sandbox,{filename:'config.js'});

assert.equal(appended.length,0,'login surface must not fetch employee runtime modules before authentication');
assert.equal(typeof window.trendosLoadAuthenticatedCriticalV1,'function');
assert.equal(typeof window.trendosLoadAuthenticatedModulesV1,'function');

window.trendosLoadAuthenticatedCriticalV1();
assert.equal(appended.length,2,'critical authenticated modules should be edge router + resume guard only');
assert.match(appended[0].src,/trendos-edge-orders-read-v1\.js\?v=20261008-entry652-session-lifecycle/);
assert.match(appended[1].src,/trendos-resume-no-autorefresh-v1\.js/);

window.trendosLoadAuthenticatedModulesV1();
assert.equal(timers.length,1,'deferred modules should be queued once');
assert.equal(timers[0].ms,250);
timers[0].fn();
assert.equal(appended.length,18,'all authenticated runtime modules should load after session');

window.trendosLoadAuthenticatedModulesV1();
assert.equal(timers.length,1,'loader must be idempotent');

const bootStart=app.indexOf('function bootMain()');
const bootEnd=app.indexOf('function renderHeader()',bootStart);
assert.ok(bootStart>=0&&bootEnd>bootStart);
const boot=app.slice(bootStart,bootEnd);
assert.match(boot,/trendosLoadAuthenticatedModulesV1/);
assert.ok(
  boot.indexOf('trendosLoadAuthenticatedModulesV1') < boot.indexOf('showMain()'),
  'authenticated loader should start before main boot requests data'
);

assert.match(index,/config\.js\?v=20261008-entry652-session-lifecycle/);
assert.match(index,/app\.js\?v=20261008-entry652-session-lifecycle/);
assert.doesNotMatch(config,/^trendLoadModuleV1932\(/m,'config must not eagerly invoke runtime module loader');

console.log('ENTRY603_LOGIN_FAST_SURFACE=PASS');
console.log('UNAUTHENTICATED_DYNAMIC_MODULE_REQUESTS=0');
console.log('AUTH_CRITICAL_MODULES=2');
console.log('AUTH_DEFERRED_MODULES=16');
