/* Matbagy Design Catalogue V1. Reuses the EXISTING Marketplace writer and public
 * product feed; no second database, no new customer file permissions.
 * SOURCE ONLY / default OFF until verified release.
 * Published catalogue images are intentionally public; never upload customer originals.
 */
(function (root, factory) {
  'use strict';
  var exported = factory(root, root && root.document);
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root) root.TrendOSDesignCatalogV1 = exported;
})(typeof window !== 'undefined' ? window : globalThis, function (root, doc) {
  'use strict';
  var VENDOR_CODE = 'MB-DESIGNS';
  var VENDOR_NAME = 'كتالوج تصميمات مطبعجي';
  var MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  var CODE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}._-]{0,39}$/u;
  var customerBound = false, adminBound = false;
  var customerOpts = null, adminOpts = null, generation = 0, products = [], searchText = '';

  function enabled() { return !!(root && root.TRENDOS_DESIGN_CATALOG_V1_ENABLED === true); }
  function byId(id) { return doc && doc.getElementById(id); }
  function elt(tag, cls, value) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (value !== undefined) n.textContent = String(value);
    return n;
  }
  function btn(label, cls) { var n = elt('button', cls, label); n.type = 'button'; return n; }
  function status(id, message, error) {
    var e = byId(id);
    if (!e) return;
    e.textContent = message || '';
    e.dataset.error = error ? 'yes' : 'no';
  }
  function closeDialog(dialog) { if (dialog && dialog.open && typeof dialog.close === 'function') dialog.close(); }
  function showDialog(dialog) { if (dialog && !dialog.open && typeof dialog.showModal === 'function') dialog.showModal(); }
  function safeImageUrl(value) {
    try {
      var u = new URL(String(value || ''));
      var h = u.hostname.toLowerCase();
      return u.protocol === 'https:' && (h === 'drive.google.com' || h === 'lh3.googleusercontent.com' ||
        h.endsWith('.googleusercontent.com')) ? u.href : '';
    } catch (_) { return ''; }
  }
  function validateCode(value) {
    var code = String(value || '').trim();
    if (!CODE_PATTERN.test(code)) throw Error('الكود مطلوب: حتى 40 حرفًا أو رقمًا، ويسمح بـ - و _ و . فقط.');
    return code;
  }
  function catalogueRows(response) {
    var vendors = Array.isArray(response && response.vendors) ? response.vendors : [];
    var vendor = vendors.find(function (v) { return v.vendorCode === VENDOR_CODE && v.active !== 'لا'; });
    if (!vendor) return { vendor: null, products: [] };
    var results = (Array.isArray(response.products) ? response.products : []).filter(function (p) {
      return p && p.vendorCode === VENDOR_CODE && p.active !== 'لا' && String(p.productCode || '').trim();
    });
    results.sort(function (a, b) {
      return (Number(a.sortOrder || 9999) - Number(b.sortOrder || 9999)) ||
        String(a.productCode || '').localeCompare(String(b.productCode || ''), 'ar');
    });
    return { vendor: vendor, products: results };
  }
  function image(parent, src, alt) {
    var safe = safeImageUrl(src);
    if (!safe) { parent.append(elt('div', 'dc-no-image', 'لا توجد صورة')); return null; }
    var img = elt('img');
    img.src = safe; img.alt = alt || ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', function () { img.replaceWith(elt('div', 'dc-no-image', 'تعذر عرض الصورة')); }, { once: true });
    parent.append(img);
    return img;
  }
  async function copyCode(value) {
    var code = String(value || '');
    if (!code) return false;
    try {
      if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
        await root.navigator.clipboard.writeText(code);
        return true;
      }
    } catch (_) { /* Try the older browser fallback below. */ }
    try {
      var t = elt('textarea');
      t.value = code; t.setAttribute('readonly', '');
      t.style.position = 'fixed'; t.style.opacity = '0';
      doc.body.append(t); t.select();
      var ok = !!doc.execCommand('copy'); t.remove(); return ok;
    } catch (_) { return false; }
  }
  function renderCustomer() {
    var grid = byId('customerDesignCatalogGrid');
    if (!grid) return;
    grid.replaceChildren();
    var q = searchText.toLocaleLowerCase();
    var visible = products.filter(function (p) {
      return !q || [p.productCode, p.productName, p.description].join(' ').toLocaleLowerCase().includes(q);
    });
    if (!visible.length) { grid.append(elt('p', 'dc-empty', products.length ? 'مفيش تصميمات مطابقة للبحث.' : 'لسه مفيش تصميمات منشورة في الكتالوج.')); return; }
    visible.forEach(function (p) {
      var card = elt('article', 'dc-product');
      var media = btn('', 'dc-media'); media.setAttribute('aria-label', 'تكبير صورة ' + (p.productCode || 'التصميم'));
      image(media, p.thumbnailUrl || p.imageUrl || p.fileUrl, p.productName || p.productCode);
      media.addEventListener('click', function () { openImage(p); });
      card.append(media);
      card.append(elt('div', 'dc-product-name', p.productName || 'تصميم'));
      var code = elt('div', 'dc-code', p.productCode); code.dir = 'ltr'; card.append(code);
      if (p.description) card.append(elt('small', 'dc-description', p.description));
      var actions = elt('div', 'dc-product-actions');
      var copy = btn('نسخ الكود', 'dc-copy'), order = btn('اطلب التصميم', 'dc-order');
      copy.addEventListener('click', async function () {
        var ok = await copyCode(p.productCode);
        status('customerDesignCatalogStatus', ok ? 'اتنسخ الكود: ' + p.productCode : 'المتصفح منع النسخ؛ حدّد الكود وانسخه يدويًا.', !ok);
      });
      order.addEventListener('click', function () {
        if (!customerOpts || !customerOpts.isCurrent || !customerOpts.isCurrent()) {
          status('customerDesignCatalogStatus', 'سجّل الدخول بحسابك الأول علشان تطلب التصميم.', true); return;
        }
        if (typeof customerOpts.onChoose !== 'function') return;
        closeDialog(byId('customerDesignCatalogViewer'));
        closeDialog(byId('customerDesignCatalogDialog'));
        customerOpts.onChoose(p, { vendorCode: VENDOR_CODE, vendorName: VENDOR_NAME });
      });
      actions.append(copy, order); card.append(actions); grid.append(card);
    });
  }
  function openImage(product) {
    var viewer = byId('customerDesignCatalogViewer'), body = byId('customerDesignCatalogViewerBody');
    if (!viewer || !body) return;
    body.replaceChildren();
    image(body, product.thumbnailUrl || product.imageUrl || product.fileUrl, product.productName || product.productCode);
    var code = elt('p', 'dc-viewer-code', 'كود التصميم: ' + product.productCode);
    code.dir = 'auto'; body.append(code);
    showDialog(viewer);
  }
  async function reloadCustomer() {
    if (!enabled() || !customerBound || !customerOpts || !customerOpts.isCurrent || !customerOpts.isCurrent()) return;
    var myGeneration = ++generation;
    status('customerDesignCatalogStatus', 'جاري تحميل التصميمات...');
    try {
      var res = await customerOpts.load();
      if (myGeneration !== generation || !customerOpts.isCurrent()) return;
      if (!res || res.success !== true) throw Error((res && res.message) || 'فشل تحميل الكتالوج.');
      products = catalogueRows(res).products;
      renderCustomer();
      status('customerDesignCatalogStatus', 'عدد التصميمات: ' + products.length);
    } catch (e) {
      if (myGeneration !== generation) return;
      products = []; renderCustomer(); status('customerDesignCatalogStatus', e.message || 'تعذر تحميل الكتالوج.', true);
    }
  }
  function mountCustomer(options) {
    if (!enabled() || !doc || !byId('customerView') || !options || typeof options.load !== 'function') return false;
    customerOpts = options;
    if (customerBound) return true;
    var view = byId('customerView'), shell = byId('customerMessengerShell');
    var opener = btn('🖼️ كتالوج التصميمات', 'dc-open-catalog');
    opener.id = 'customerDesignCatalogOpenBtn';
    var sidebar = shell && shell.querySelector('.cm-sidebar');
    if (sidebar) {
      var draft = byId('customerMessengerDraft');
      if (draft && draft.parentNode) draft.parentNode.insertBefore(opener, draft.nextSibling);
      else sidebar.prepend(opener);
    } else {
      var topActions = view.querySelector('.customer-topbar .top-actions');
      if (!topActions) return false;
      topActions.prepend(opener);
    }
    var dialog = elt('dialog', 'dc-dialog'); dialog.id = 'customerDesignCatalogDialog';
    dialog.setAttribute('aria-label', 'كتالوج تصميمات مطبعجي');
    var head = elt('div', 'dc-head');
    var title = elt('div'); title.append(elt('h3', '', 'كتالوج تصميمات مطبعجي'), elt('p', '', 'افتح الصورة وخُد سكرين شوت، أو انسخ كود التصميم بضغطة.'));
    var close = btn('×', 'dc-close'); close.setAttribute('aria-label', 'إغلاق الكتالوج');
    close.addEventListener('click', function () { closeDialog(dialog); });
    head.append(title, close); dialog.append(head);
    var tools = elt('div', 'dc-tools'), search = elt('input');
    search.type = 'search'; search.placeholder = 'ابحث بالاسم أو كود التصميم'; search.setAttribute('aria-label', 'البحث في كتالوج التصميمات');
    search.addEventListener('input', function () { searchText = search.value.trim(); renderCustomer(); });
    var reload = btn('تحديث', 'dc-reload'); reload.addEventListener('click', reloadCustomer);
    tools.append(search, reload); dialog.append(tools);
    var note = elt('p', 'dc-status'); note.id = 'customerDesignCatalogStatus'; note.setAttribute('role', 'status'); dialog.append(note);
    var grid = elt('div', 'dc-grid'); grid.id = 'customerDesignCatalogGrid'; dialog.append(grid);
    var viewer = elt('dialog', 'dc-viewer'); viewer.id = 'customerDesignCatalogViewer'; viewer.setAttribute('aria-label', 'صورة التصميم بالحجم الكامل');
    var viewerClose = btn('×', 'dc-close'); viewerClose.setAttribute('aria-label', 'إغلاق الصورة'); viewerClose.addEventListener('click', function () { closeDialog(viewer); });
    var viewerBody = elt('div', 'dc-viewer-body'); viewerBody.id = 'customerDesignCatalogViewerBody'; viewer.append(viewerClose, viewerBody);
    view.append(dialog, viewer);
    opener.addEventListener('click', function () {
      if (!customerOpts.isCurrent || !customerOpts.isCurrent()) return;
      showDialog(dialog); reloadCustomer();
    });
    customerBound = true;
    return true;
  }
  function clearCustomer() {
    ++generation;
    products = []; searchText = '';
    var grid = byId('customerDesignCatalogGrid'); if (grid) grid.replaceChildren();
    var body = byId('customerDesignCatalogViewerBody'); if (body) body.replaceChildren();
    closeDialog(byId('customerDesignCatalogViewer')); closeDialog(byId('customerDesignCatalogDialog'));
    status('customerDesignCatalogStatus', '');
  }
  function readBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(Error('تعذر قراءة الصورة.')); };
      reader.onload = function () { resolve(String(reader.result || '').split(',')[1] || ''); };
      reader.readAsDataURL(file);
    });
  }
  async function validateImage(file) {
    if (!file) throw Error('اختار صورة المنتج أو الموك أب.');
    if (!file.size || file.size > MAX_IMAGE_BYTES) throw Error('الصورة لازم تكون أقل من 8 ميجابايت.');
    if (!/^(image\/png|image\/jpeg|image\/webp)$/.test(file.type)) throw Error('مسموح PNG أو JPG أو WEBP فقط.');
    var h = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    var png = h[0] === 137 && h[1] === 80 && h[2] === 78 && h[3] === 71;
    var jpg = h[0] === 255 && h[1] === 216 && h[2] === 255;
    var webp = String.fromCharCode.apply(null, Array.from(h.slice(0, 4))) === 'RIFF' &&
      String.fromCharCode.apply(null, Array.from(h.slice(8, 12))) === 'WEBP';
    if (!((file.type === 'image/png' && png) || (file.type === 'image/jpeg' && jpg) || (file.type === 'image/webp' && webp)))
      throw Error('ملف الصورة لا يطابق نوعه؛ صدّر الصورة مرة ثانية.');
    return file;
  }
  async function uploadAdmin() {
    if (!adminOpts || !adminOpts.isAllowed || !adminOpts.isAllowed()) {
      status('adminDesignCatalogStatus', 'غير مصرح برفع التصميمات.', true); return;
    }
    var submit = byId('adminDesignCatalogSave'), code, file;
    try {
      code = validateCode(byId('adminDesignCatalogCode').value);
      file = await validateImage(byId('adminDesignCatalogImage').files[0]);
      submit.disabled = true; status('adminDesignCatalogStatus', 'جاري فحص الكود ورفع الصورة...');
      var current = await adminOpts.load();
      if (!current || current.success !== true) throw Error((current && current.message) || 'تعذر قراءة الكتالوج.');
      if ((current.products || []).some(function (p) { return String(p.productCode).toLocaleLowerCase() === code.toLocaleLowerCase(); }))
        throw Error('الكود موجود بالفعل. اختار كود مختلف علشان التصميم القديم ما يتغيّرش.');
      if (!(current.vendors || []).some(function (v) { return v.vendorCode === VENDOR_CODE; })) {
        var vendorResult = await adminOpts.post('saveMarketplaceVendor', {
          vendorCode: VENDOR_CODE, vendorName: VENDOR_NAME, category: 'تصميمات مطبعجي',
          commission: '0', active: 'نعم', sortOrder: '1'
        });
        if (!vendorResult || vendorResult.success !== true) throw Error((vendorResult && vendorResult.message) || 'تعذر إنشاء قسم التصميمات.');
      }
      if (!adminOpts.isAllowed()) throw Error('انتهت الجلسة. سجّل الدخول مرة أخرى.');
      var name = byId('adminDesignCatalogName').value.trim() || ('تصميم ' + code);
      var type = byId('adminDesignCatalogType').value;
      var category = byId('adminDesignCatalogCategory').value.trim();
      var result = await adminOpts.post('saveMarketplaceProduct', {
        vendorCode: VENDOR_CODE, productCode: code, productName: name,
        description: type + (category ? ' • ' + category : ''), price: '', unit: 'تصميم',
        active: 'نعم', sortOrder: '', fileName: file.name, mimeType: file.type,
        size: file.size, base64: await readBase64(file)
      });
      if (!result || result.success !== true) throw Error((result && result.message) || 'تعذر حفظ المنتج.');
      if (!adminOpts.isAllowed()) throw Error('استجابة الحفظ وصلت بعد انتهاء الجلسة؛ راجع قائمة المنتجات قبل أي إعادة.');
      byId('adminDesignCatalogCode').value = ''; byId('adminDesignCatalogName').value = '';
      byId('adminDesignCatalogCategory').value = ''; byId('adminDesignCatalogImage').value = '';
      status('adminDesignCatalogStatus', 'اتحفظ التصميم بكود ' + code + '. يقدر العميل ينسخ الكود من الكتالوج.');
      if (adminOpts.afterSave) adminOpts.afterSave();
    } catch (e) {
      status('adminDesignCatalogStatus', e.message || 'تعذر حفظ التصميم.', true);
    } finally { if (submit) submit.disabled = false; }
  }
  function mountAdmin(options) {
    if (!enabled() || !doc || !byId('marketplaceCard') || !options || typeof options.post !== 'function') return false;
    if (!options.isAllowed || !options.isAllowed()) return false;
    adminOpts = options;
    if (adminBound) return true;
    var card = byId('marketplaceCard'), section = elt('section', 'dc-admin'); section.id = 'adminDesignCatalog';
    section.append(elt('h3', '', '🖼️ رفع تصميم للكتالوج'));
    section.append(elt('p', 'dc-admin-hint', 'ارفع صورة واحدة للمنتج أو الموك أب واكتب كود التصميم. الصورة المنشورة يقدر العملاء يشوفوها ويصوروها سكرين شوت.'));
    var form = elt('div', 'dc-admin-form');
    var code = elt('input'); code.id = 'adminDesignCatalogCode'; code.placeholder = 'كود التصميم (مطلوب)'; code.maxLength = 40;
    var name = elt('input'); name.id = 'adminDesignCatalogName'; name.placeholder = 'اسم التصميم (اختياري)';
    var category = elt('input'); category.id = 'adminDesignCatalogCategory'; category.placeholder = 'التصنيف (اختياري، مثل سلوبتات)';
    var type = elt('select'); type.id = 'adminDesignCatalogType';
    [['موك أب', 'موك أب'], ['صورة المنتج', 'صورة المنتج']].forEach(function (entry) { var o = elt('option', '', entry[1]); o.value = entry[0]; type.append(o); });
    var file = elt('input'); file.id = 'adminDesignCatalogImage'; file.type = 'file'; file.accept = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp'; file.setAttribute('aria-label', 'صورة المنتج أو الموك أب');
    var save = btn('رفع وحفظ التصميم', 'dc-save'); save.id = 'adminDesignCatalogSave'; save.addEventListener('click', uploadAdmin);
    form.append(code, name, category, type, file, save);
    var state = elt('p', 'dc-status'); state.id = 'adminDesignCatalogStatus'; state.setAttribute('role', 'status');
    section.append(form, state);
    var old = card.querySelector('.marketplace-product-form');
    if (old) card.insertBefore(section, old); else card.append(section);
    adminBound = true; return true;
  }
  function clearAdmin() {
    ['adminDesignCatalogCode', 'adminDesignCatalogName', 'adminDesignCatalogCategory', 'adminDesignCatalogImage'].forEach(function (id) { var n = byId(id); if (n) n.value = ''; });
    status('adminDesignCatalogStatus', '');
    adminOpts = null;
  }
  return {
    enabled: enabled, vendorCode: VENDOR_CODE, validateCode: validateCode, safeImageUrl: safeImageUrl,
    catalogueRows: catalogueRows, mountCustomer: mountCustomer, clearCustomer: clearCustomer,
    mountAdmin: mountAdmin, clearAdmin: clearAdmin, validateImage: validateImage,
    productionEnabled: false
  };
});
