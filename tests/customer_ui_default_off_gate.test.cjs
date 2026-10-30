const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const js=fs.readFileSync(path.join(root,"customer-design-guided-chat-v1.js"),"utf8");
const css=fs.readFileSync(path.join(root,"customer-design-guided-chat-v1.css"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");

test("new customer design controls are hidden in committed markup",()=>{
 for (const id of ["customerMatbagyHero","customerMatbagyIdentity","customerDesignRecipe"]) {
  const re=new RegExp('<(?:div|section)\\s+[^>]*id="'+id+'"[^>]*hidden');
  assert.match(html,re,id);
  assert.ok(css.includes('#customerView #'+id+'[hidden]'));
 }
});

test("default runtime provides module helpers but NEVER activates UI or attaches controls",()=>{
 let listeners=0;
 const window={
  document:{
   readyState:"complete",
   documentElement:{classList:{add(){throw Error("premature activation")}}},
   getElementById(){listeners++;return {value:""}}
  },
  TRENDOS_CUSTOMER_CHAT_V1_ENABLED:false
 };
 vm.runInNewContext(js,{window,console});
 assert.ok(window.TrendOSCustomerRecipe);
 assert.equal(listeners,0);
 assert.equal(window.TrendOSCustomerRecipe.mount(window.document),false);
 assert.equal(listeners,0);
});

test("CSS overrides are gated by explicit opt-in class",()=>{
 assert.match(js,/TRENDOS_CUSTOMER_CHAT_V1_ENABLED !== true/);
 assert.match(js,/classList\.add\("matbagy-ui-enabled"\)/);
 assert.match(css,/html\.matbagy-ui-enabled #customerNewOrderPanel/);
 assert.match(css,/html\.matbagy-ui-enabled #customerView/);
 const cleaned=css.replaceAll('html.matbagy-ui-enabled #customerNewOrderPanel','')
                  .replaceAll('html.matbagy-ui-enabled #customerView','');
 assert.ok(!cleaned.includes('#customerView .customer-topbar'));
 assert.ok(!cleaned.includes('#customerNewOrderPanel .matbagy-recipe'));
 assert.ok(!js.includes('fetch('));
});
