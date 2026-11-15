'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'customer-design-catalog-v1.js'), 'utf8');
const api = require('../customer-design-catalog-v1.js');

test('the entire catalogue stays default OFF and cannot touch the DOM when OFF', () => {
  for (const flag of [undefined, false]) {
    const fakeWindow = {
      TRENDOS_DESIGN_CATALOG_V1_ENABLED: flag,
      document: { getElementById() { throw Error('OFF accessed DOM'); } }
    };
    vm.runInNewContext(code, { window: fakeWindow, module: { exports: {} }, URL });
    const mod = fakeWindow.TrendOSDesignCatalogV1;
    assert.equal(mod.mountCustomer({ load() { throw Error('OFF read API'); } }), false);
    assert.equal(mod.mountAdmin({ post() { throw Error('OFF wrote API'); } }), false);
  }
  assert.equal(api.productionEnabled, false);
  assert.equal(api.vendorCode, 'MB-DESIGNS');
});
test('catalogue lists only the explicitly dedicated, active Matbagy vendor and published designs', () => {
  const result = api.catalogueRows({
    vendors: [
      { vendorCode: 'OTHER', active: 'نعم', vendorName: 'غير مطبعجي' },
      { vendorCode: 'MB-DESIGNS', active: 'نعم', vendorName: 'كتالوج مطبعجي' }
    ],
    products: [
      { vendorCode: 'OTHER', productCode: 'PRIVATE', active: 'نعم' },
      { vendorCode: 'MB-DESIGNS', productCode: 'D-002', active: 'لا' },
      { vendorCode: 'MB-DESIGNS', productCode: '', active: 'نعم' },
      { vendorCode: 'MB-DESIGNS', productCode: 'D-003', active: 'نعم', sortOrder: 4 },
      { vendorCode: 'MB-DESIGNS', productCode: 'D-001', active: 'نعم', sortOrder: 1 }
    ]
  });
  assert.deepEqual(result.products.map(p => p.productCode), ['D-001', 'D-003']);
  assert.deepEqual(api.catalogueRows({ vendors: [{ vendorCode: 'MB-DESIGNS', active: 'لا' }], products: result.products }).products, []);
});
test('design code is preserved exactly; Arabic and Latin are accepted; unsafe delimiters rejected', () => {
  assert.equal(api.validateCode('SL-0001'), 'SL-0001');
  assert.equal(api.validateCode(' تصاميم_١٢٣ '), 'تصاميم_١٢٣');
  for (const input of ['', ' ', '../../x', 'a b', '<img>', 'a/b', '*', 'z'.repeat(41)]) {
    assert.throws(() => api.validateCode(input), /الكود مطلوب/);
  }
});
test('a product preview is restricted to safe Google Drive image URLs only', () => {
  assert.equal(api.safeImageUrl('https://drive.google.com/thumbnail?id=A&sz=w1000'),
    'https://drive.google.com/thumbnail?id=A&sz=w1000');
  assert.equal(api.safeImageUrl('https://lh3.googleusercontent.com/d/A'), 'https://lh3.googleusercontent.com/d/A');
  for (const url of [
    'javascript:alert(1)', 'data:image/svg+xml,<svg>', '//example.com/img',
    'https://drive.google.com.evil.example/img', 'http://drive.google.com/test',
    'https://notgoogleusercontent.com/file', 'https://example.test/image.jpg'
  ]) assert.equal(api.safeImageUrl(url), '');
});
function file(type, bytes) {
  const b = new Uint8Array(bytes);
  return { type, size: b.length, slice: () => ({ arrayBuffer: async () => b.buffer }) };
}
test('upload accepts a real PNG/JPEG/WebP header and rejects MIME spoofing and huge files', async () => {
  const png = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0];
  const jpg = [255, 216, 255, 224, 0, 0, 0, 0, 0, 0, 0, 0];
  const webp = [...Buffer.from('RIFF'), 0,0,0,0, ...Buffer.from('WEBP')];
  assert.equal(await api.validateImage(file('image/png', png)).then(x => x.type), 'image/png');
  assert.equal(await api.validateImage(file('image/jpeg', jpg)).then(x => x.type), 'image/jpeg');
  assert.equal(await api.validateImage(file('image/webp', webp)).then(x => x.type), 'image/webp');
  await assert.rejects(api.validateImage(file('image/png', jpg)), /لا يطابق نوعه/);
  await assert.rejects(api.validateImage(file('image/svg+xml', png)), /مسموح/);
  await assert.rejects(api.validateImage({type:'image/png', size:9*1024*1024}), /8 ميجابايت/);
});
test('wired through existing auth, Marketplace calls and original order draft, with no new writers', () => {
  const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
  const config = fs.readFileSync(path.join(root,'config.js'),'utf8');
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(config,/TRENDOS_DESIGN_CATALOG_V1_ENABLED = false/);
  assert.match(html,/customer-design-catalog-v1\.js/);
  assert.match(html,/customer-design-catalog-v1\.css/);
  assert.match(app,/catalog\.mountAdmin\(/);
  assert.match(app,/catalog\.mountCustomer\(/);
  assert.match(app,/api\("getMarketplace", authParams\(\{ includeInactive: "نعم" \}\)\)/);
  assert.match(app,/apiPost\(action, authParams\(payload\)\)/);
  assert.match(app,/كود التصميم من كتالوج مطبعجي/);
  assert.match(app,/catalog\.mountCustomer\(\{/);
  assert.doesNotMatch(code,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
  assert.doesNotMatch(code,/ANYONE_WITH_LINK|uploadCustomerDraftFile|createCustomerDraft|submitCustomerDraft/);
  assert.match(code,/copyCode\(p\.productCode\)/);
  assert.match(code,/showDialog\(viewer\)/);
});
