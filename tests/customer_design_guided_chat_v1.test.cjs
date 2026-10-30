// Synthetic-only tests: no live customer, auth token, Google/Cloudflare, or OpenAI API.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {test} = require("node:test");
const recipes = require("../customer-design-guided-chat-v1.js");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root,"index.html"),"utf8");
const app = fs.readFileSync(path.join(root,"app.js"),"utf8");

test("existing WhatsApp draft with original upload, item and submit handler is reused",()=>{
  const panel = html.slice(html.indexOf('<section id="customerNewOrderPanel"'),html.indexOf('<section id="customerOrdersPanel"'));
  for (const id of [
    "customerDraftMessages","customerOrderFiles","customerOrderDocs",
    "customerOrderItem","customerOrderNotes","customerAddDraftItemBtn",
    "customerSubmitDraftBtn","customerRecipeProduct","customerRecipeWidth",
    "customerRecipeHeight","customerRecipeKeepOriginal",
  ]) assert.ok(panel.includes('id="'+id+'"'),id);
  assert.ok(panel.includes("customer-chat-shell"));
  assert.ok(panel.includes('accept="image/*" multiple'));
  assert.ok(app.includes('api("addCustomerDraftItem"'));
  assert.ok(app.includes('apiPost("uploadCustomerDraftFile"'));
  assert.ok(app.includes('api("submitCustomerDraft"'));
  assert.ok(html.includes('customer-design-guided-chat-v1.js'));
});

test("all requested categories exist and preserve original policy",()=>{
  for (const key of ["tablo","frame","mug","shirt","scarf","bracelet"]) {
    assert.ok(recipes.RECIPES[key],key);
    assert.ok(html.includes('value="'+key+'"'),key);
  }
  assert.deepEqual(recipes.RECIPES.mug.sizes,[[20,9]]);
  assert.deepEqual(recipes.RECIPES.sticker.sizes[0],[7,10]);
  assert.equal(recipes.RECIPES.bracelet.sizes.length,0);
  assert.match(recipes.KEEP,/لا تغيّر صورة العميل الأصلية/);
  assert.match(recipes.KEEP,/ملامح/);
  assert.match(recipes.REVIEW,/300 DPI/);
  assert.match(recipes.REVIEW,/مراجعة بشرية/);
});

test("product, confirmed dimensions, shirt clothing size and photo policy are required",()=>{
  const good={product:"mug",width:"20",height:"9",keepOriginal:true,garment:"",otherName:""};
  assert.equal(recipes.validate(good),"");
  assert.match(recipes.validate({...good,product:""}),/اختر/);
  assert.match(recipes.validate({...good,width:"0"}),/العرض/);
  assert.match(recipes.validate({...good,height:"-1"}),/العرض/);
  assert.match(recipes.validate({...good,width:"NaN"}),/العرض/);
  assert.match(recipes.validate({...good,keepOriginal:false}),/الأصلية/);
  assert.match(recipes.validate({...good,product:"shirt"}),/التيشيرت/);
  assert.equal(recipes.validate({...good,product:"shirt",garment:"L"}),"");
  assert.match(recipes.validate({...good,product:"other"}),/اسم المنتج/);
  assert.equal(recipes.validate({...good,product:"other",otherName:"لوحة خاصة"}),"");
});

test("notes retain instructions, original safety and are idempotent on retry",()=>{
  const fields={product:"mug",width:"20",height:"9",keepOriginal:true,garment:"",otherName:""};
  const a=recipes.buildNotes(fields,"اسم العميل: حنين، صور بدون تغيير");
  assert.match(a,/20 × 9 سم/);
  assert.match(a,/حفظ الأصل/);
  assert.match(a,/لا تغيّر صورة العميل الأصلية/); // instruction is explicit; engine QC is separate
  assert.match(a,/اسم العميل: حنين/);
  const b=recipes.buildNotes(fields,a);
  assert.equal(a,b);
  assert.equal((b.match(/تعليمات العميل:/g)||[]).length,1);
  assert.equal((b.match(/\[مواصفات مطبعجي\]/g)||[]).length,1);
  assert.match(recipes.stripPrior(b),/اسم العميل: حنين/);
});

test("only existing client chat inputs are written; no additional API request",()=>{
  const js = fs.readFileSync(path.join(root,"customer-design-guided-chat-v1.js"),"utf8");
  assert.ok(js.includes('getElementById'));
  assert.ok(js.includes('customerOrderNotes'));
  assert.ok(js.includes('customerOrderItem'));
  assert.ok(js.includes('customerAddDraftItemBtn'));
  assert.ok(js.includes('customerShowNewOrderBtn'));
  assert.ok(!/\bfetch\s*\(/.test(js));
  assert.ok(!/\bXMLHttpRequest\b/.test(js));
  assert.ok(!/\bOPENAI_API_KEY\b/.test(js));
  assert.ok(!/sk-proj-/.test(js));
  assert.ok(!js.includes("createCustomerDraft("));
});
