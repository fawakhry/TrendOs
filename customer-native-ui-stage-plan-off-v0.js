/* Customer portal form -> Native draft stage plan. SOURCE-ONLY, DEFAULT OFF.
 * Not imported by current index.html / app.js, Native dispatcher or Worker.
 * The only browser export is an explicit loopback-test-only seam.
 * No bearer, localStorage, Google API, public R2 URL, order submission, or fetch.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.location && root.location.hostname === "127.0.0.1" &&
      root.TRENDOS_CUSTOMER_UI_NATIVE_STAGE_TEST_ONLY === true)
    root.TrendOSCustomerNativeUiStagePlanV0 = api;
}(typeof window === "undefined" ? null : window, function () {
  "use strict";
  var MAX_BYTES = 5 * 1024 * 1024;
  var OWNER = /^[A-Za-z0-9_-]{1,70}$/;
  var DRAFT = /^CDR-[a-f0-9]{32}$/;
  var ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
  function error(code) {
    var e = new Error(code); e.code = code; return e;
  }
  function parseBool(x) {
    if (x === true || x === "نعم") return true;
    if (x === false || x === "لا") return false;
    throw error("NATIVE_UI_OPTION_INVALID");
  }
  function nativeItem(form, fileCount) {
    if (!form || (form.department !== "طباعة" && form.department !== "ليزر"))
      throw error("NATIVE_UI_DEPARTMENT_INVALID");
    var qtyText = String(form.qty == null ? "" : form.qty).trim();
    if (!/^[1-9][0-9]?$/.test(qtyText))
      throw error("NATIVE_UI_QUANTITY_INVALID");
    var itemName = typeof form.itemName === "string" ? form.itemName.trim() : "";
    var notes = typeof form.notes === "string" ? form.notes.trim() : "";
    if (!itemName) itemName = fileCount ? "ملفات مرفوعة" : "بند جديد";
    if (itemName.length > 120 || notes.length > 1000)
      throw error("NATIVE_UI_FIELDS_TOO_LONG");
    var heatPress = parseBool(form.heatPress);
    var flyPrint = parseBool(form.flyPrint);
    if (form.department === "ليزر" && (heatPress || flyPrint))
      throw error("NATIVE_UI_LASER_FLAGS_DENIED");
    // Branch/vendor routing metadata, pricing, customer ID and legacy secrets
    // cannot be trusted from DOM or customer-supplied inputs.
    var forbidden = ["customerId", "token", "password", "customerCode",
      "bearer", "fileUrl", "folderUrl", "franchiseBranchCode", "vendorCode"];
    if (forbidden.some(function (k) { return Object.prototype.hasOwnProperty.call(form, k); }))
      throw error("NATIVE_UI_UNTRUSTED_FIELD_DENIED");
    return {department:form.department,itemName:itemName,qty:Number(qtyText),
      notes:notes,heatPress:heatPress,flyPrint:flyPrint};
  }
  function safeSession(get) {
    var s;
    try { s = get(); } catch (_) { return null; }
    if (!s || s.verified !== true || s.stage !== "isolated-local" ||
        !OWNER.test(s.ownerId) || !DRAFT.test(s.draftId) ||
        !Number.isSafeInteger(s.authEpoch) || s.authEpoch < 1 ||
        Object.keys(s).some(function (k) {
          return /token|bearer|password|customerCode|phone/i.test(k);
        })) return null;
    return {ownerId:s.ownerId,draftId:s.draftId,authEpoch:s.authEpoch};
  }
  function scope(s) {
    return s.ownerId + "__e" + s.authEpoch;
  }
  function createNativeCustomerUiStagePlanV0(options) {
    var o = options || {};
    if (o.sourceOnlyLocalOptIn !== true ||
        typeof o.getVerifiedSession !== "function" ||
        typeof o.coordinatorFactory !== "function" ||
        !o.transport || typeof o.transport.addItem !== "function" ||
        typeof o.transport.uploadFile !== "function")
      throw error("NATIVE_UI_STAGE_OFF");
    var active = null, snapshot = null, preparing = false, generation = 0;
    function inScope() {
      var current = safeSession(o.getVerifiedSession);
      return !!(snapshot && current && scope(current) === scope(snapshot) &&
        current.draftId === snapshot.draftId);
    }
    async function prepare(input) {
      if (active || preparing)
        throw error("NATIVE_UI_PLAN_ALREADY_PREPARED");
      var s = safeSession(o.getVerifiedSession);
      if (!s) throw error("NATIVE_UI_VERIFIED_LOCAL_SESSION_REQUIRED");
      if (!input || !Array.isArray(input.files) || input.files.length > 5)
        throw error("NATIVE_UI_FILE_COUNT_INVALID");
      var item = nativeItem(input, input.files.length);
      snapshot = s;
      preparing = true;
      var ticket = ++generation;
      var staged = [];
      try {
        for (var i = 0; i < input.files.length; i++) {
          var file = input.files[i];
          if (!file || !Number.isSafeInteger(file.size) ||
              file.size < 8 || file.size > MAX_BYTES ||
              !ALLOWED_TYPES.includes(file.type) ||
              typeof file.arrayBuffer !== "function")
            throw error("NATIVE_UI_FILE_INPUT_INVALID");
          var buf = await file.arrayBuffer();
          if (!(buf instanceof ArrayBuffer) || buf.byteLength !== file.size)
            throw error("NATIVE_UI_FILE_BYTES_INVALID");
          var bytes = new Uint8Array(buf.slice(0));
          staged.push({bytes:bytes,contentType:file.type});
          if (ticket !== generation || !inScope())
            throw error("NATIVE_UI_SESSION_STALE");
        }
        if (ticket !== generation || !inScope())
          throw error("NATIVE_UI_SESSION_STALE");
        var localSnapshot = snapshot;
        active = o.coordinatorFactory({
          ownerId:scope(localSnapshot),
          draftId:localSnapshot.draftId,
          item:item,files:staged,transport:o.transport,
          random:o.random,
          getActiveOwnerId:function () {
            var current = safeSession(o.getVerifiedSession);
            return current && current.draftId === localSnapshot.draftId ?
              scope(current) : null;
          }
        });
        return active.status();
      } catch (e) {
        snapshot = null;
        throw e;
      } finally {
        staged.forEach(function (f) { f.bytes.fill(0); });
        preparing = false;
      }
    }
    async function resume() {
      if (!active) throw error("NATIVE_UI_PLAN_NOT_PREPARED");
      if (!inScope()) {
        active.dispose(); active = null; snapshot = null;
        throw error("NATIVE_UI_SESSION_STALE");
      }
      return active.resume();
    }
    function status() {
      return active ? active.status() : Object.freeze({
        phase:preparing?"PREPARING":"EMPTY",sourceOnly:true,
        productionReady:false,officialOrderCreated:false
      });
    }
    function cancel() {
      generation++;
      if (active) active.dispose();
      active=null;snapshot=null;
      return status();
    }
    return Object.freeze({prepare:prepare,resume:resume,status:status,cancel:cancel,
      autoSubmit:false,sourceOnly:true,productionReady:false});
  }
  return Object.freeze({
    createNativeCustomerUiStagePlanV0:createNativeCustomerUiStagePlanV0,
    testOnlyBrowserExport:true,loadedByLivePortal:false,
    maxFileBytes:MAX_BYTES,paidAiEnabled:false,customerProduction:"NO_GO"
  });
}));
