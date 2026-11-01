/* Customer Native draft upload coordination (source-only, default OFF).
 * Reuses Zero Google Entry665 item + Entry666 private file contracts.
 * NOT loaded by index.html, imported into app.js or wired to any production API.
 * Only the injected transport may make calls; no Google fallback, secrets, persistence,
 * public media URLs, official orders, printing, or paid AI.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  // Browser-only LOCAL isolated stage seam. Never export on production host,
  // and never export unless separately opted in by a disposable test fixture.
  if (root && root.location && root.location.hostname === "127.0.0.1" &&
      root.TRENDOS_CUSTOMER_UI_NATIVE_STAGE_TEST_ONLY === true)
    root.TrendOSCustomerNativeUploadCoordinatorV0 = api;
  // No automatic network, app mount, production export or side effect.
}(typeof window === "undefined" ? null : window, function () {
  "use strict";
  var LIMIT = 5 * 1024 * 1024;
  var ID32 = /^[a-f0-9]{32}$/;
  var DRAFT = /^CDR-[a-f0-9]{32}$/;
  var ITEM = /^CDI-[a-f0-9]{32}$/;
  var FILE = /^CDF-[a-f0-9]{32}$/;
  var TYPES = ["image/png", "image/jpeg", "application/pdf"];

  function key(random) {
    if (!random || typeof random.getRandomValues !== "function")
      throw Error("SECURE_RANDOM_REQUIRED");
    var raw = new Uint8Array(16);
    random.getRandomValues(raw);
    return Array.from(raw, function (x) { return x.toString(16).padStart(2, "0"); }).join("");
  }
  function validFile(x) {
    if (!x || !(x.bytes instanceof Uint8Array) ||
        x.bytes.byteLength < 8 || x.bytes.byteLength > LIMIT ||
        !TYPES.includes(x.contentType)) return false;
    var b = x.bytes;
    if (x.contentType === "image/png")
      return [137,80,78,71,13,10,26,10].every(function (n,i) { return b[i] === n; });
    if (x.contentType === "image/jpeg") return b[0] === 255 && b[1] === 216 && b[2] === 255;
    return [37,80,68,70,45].every(function (n,i) { return b[i] === n; });
  }
  function validItem(x) {
    return x && (x.department === "طباعة" || x.department === "ليزر") &&
      typeof x.itemName === "string" && x.itemName === x.itemName.trim() &&
      x.itemName.length >= 1 && x.itemName.length <= 120 &&
      Number.isSafeInteger(x.qty) && x.qty >= 1 && x.qty <= 99 &&
      typeof x.notes === "string" && x.notes.length <= 1000 &&
      typeof x.heatPress === "boolean" && typeof x.flyPrint === "boolean" &&
      (x.department === "طباعة" || (!x.heatPress && !x.flyPrint));
  }
  function itemReceipt(x) {
    return x && (x.status === 200 || x.status === 201) && x.body &&
      x.body.success === true && ITEM.test(x.body.itemId) &&
      x.body.officialOrderCreated === false &&
      x.body.alreadyAdded === (x.status === 200);
  }
  function fileReceipt(x) {
    return x && (x.status === 200 || x.status === 201) && x.body &&
      x.body.success === true && FILE.test(x.body.fileId) &&
      x.body.fileReady === true && x.body.privateObject === true &&
      x.body.alreadyUploaded === (x.status === 200) &&
      !Object.keys(x.body).some(function (s) { return /url|objectkey|filebytes|bearer|token/i.test(s); });
  }
  function createNativeCustomerUploadCoordinatorV0(options) {
    var o = options || {};
    if (typeof o.ownerId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(o.ownerId) ||
        !DRAFT.test(o.draftId) || !validItem(o.item) ||
        !Array.isArray(o.files) || o.files.length > 5 ||
        !o.files.every(validFile) ||
        !o.transport || typeof o.transport.addItem !== "function" ||
        typeof o.transport.uploadFile !== "function" ||
        typeof o.getActiveOwnerId !== "function") throw Error("NATIVE_UPLOAD_PLAN_INVALID");
    var random = o.random || (typeof globalThis !== "undefined" ? globalThis.crypto : null);
    var requestKey = key(random);
    if (!ID32.test(requestKey)) throw Error("SECURE_RANDOM_REQUIRED");
    var fields = Object.freeze({
      department:o.item.department, itemName:o.item.itemName, qty:o.item.qty,
      notes:o.item.notes, heatPress:o.item.heatPress, flyPrint:o.item.flyPrint
    });
    // Private copied bytes are never stored in local/session storage.
    var staged = o.files.map(function (f) {
      return {requestKey:key(random), bytes:new Uint8Array(f.bytes),
        contentType:f.contentType, fileId:null};
    });
    var ownerId = o.ownerId, draftId = o.draftId, transport = o.transport;
    var getOwner = o.getActiveOwnerId;
    var itemId = null, phase = "READY", closed = false, running = null;
    var lastCode = null;

    function report() {
      return Object.freeze({
        phase:phase, sourceOnly:true, productionReady:false, officialOrderCreated:false,
        itemCreated:Boolean(itemId), itemId:itemId, fileCount:staged.length,
        completedFiles:staged.filter(function (f) { return !!f.fileId; }).length,
        needsOperatorReview:phase === "PENDING_REVIEW_REQUIRED" ||
          phase === "CONFLICT_REVIEW_REQUIRED" || phase === "FILE_REJECTED",
        lastCode:lastCode
      });
    }
    function clear() {
      closed = true;
      staged.forEach(function (f) { f.bytes.fill(0); });
      phase = "DISPOSED"; lastCode = null;
      return report();
    }
    function ownerOk() {
      var current;
      try { current = getOwner(); } catch (_) { current = null; }
      if (!closed && current === ownerId) return true;
      clear(); return false;
    }
    async function advance() {
      if (closed) return report();
      if (!ownerOk()) return report();
      if (["STAGED_NOT_SUBMITTED","PENDING_REVIEW_REQUIRED",
           "CONFLICT_REVIEW_REQUIRED","FILE_REJECTED"].includes(phase)) return report();
      if (!itemId) {
        phase = "CREATING_ITEM";
        var itemResult;
        try { itemResult = await transport.addItem({
          draftId:draftId,requestKey:requestKey,
          department:fields.department,itemName:fields.itemName,qty:fields.qty,
          notes:fields.notes,heatPress:fields.heatPress,flyPrint:fields.flyPrint
        }); }
        catch (_) {
          if (!ownerOk()) return report();
          phase = "ITEM_UNCERTAIN";lastCode = "RETRY_SAME_ITEM_KEY_ONLY";return report();
        }
        if (!ownerOk()) return report();
        if (!itemReceipt(itemResult)) {
          phase = "CONFLICT_REVIEW_REQUIRED";
          lastCode = itemResult && itemResult.body && itemResult.body.code || "ITEM_RECEIPT_UNVERIFIED";
          return report();
        }
        itemId = itemResult.body.itemId;
      }
      for (var i=0;i<staged.length;i++) {
        var file = staged[i];
        if (file.fileId) continue;
        if (!ownerOk()) return report();
        phase = "UPLOADING_PRIVATE_FILE";lastCode = null;
        var response;
        try {
          response = await transport.uploadFile({
            draftId:draftId,itemId:itemId,requestKey:file.requestKey,
            bytes:file.bytes,contentType:file.contentType
          });
        } catch (_) {
          if (!ownerOk()) return report();
          phase = "FILE_UNCERTAIN";
          lastCode = "EXPLICIT_RETRY_SAME_FILE_KEY_ONLY";
          return report();
        }
        if (!ownerOk()) return report();
        if (response && response.status === 409 &&
            response.body && response.body.code === "CUSTOMER_FILE_PENDING_RECONCILIATION") {
          phase = "PENDING_REVIEW_REQUIRED";
          lastCode = "CUSTOMER_FILE_PENDING_RECONCILIATION";
          return report();
        }
        if (response && response.status === 503) {
          phase = "FILE_UNCERTAIN";
          lastCode = "EXPLICIT_RETRY_SAME_FILE_KEY_ONLY";
          return report();
        }
        if (!fileReceipt(response)) {
          phase = response && response.status === 409 ? "CONFLICT_REVIEW_REQUIRED" : "FILE_REJECTED";
          lastCode = response && response.body && response.body.code || "FILE_RECEIPT_UNVERIFIED";
          return report();
        }
        file.fileId = response.body.fileId;
      }
      phase = "STAGED_NOT_SUBMITTED";lastCode = null;
      return report();
    }
    function resume() {
      if (running) return running;
      running = advance().finally(function () { running = null; });
      return running;
    }
    return Object.freeze({resume:resume,status:report,dispose:clear});
  }
  return Object.freeze({
    createNativeCustomerUploadCoordinatorV0:createNativeCustomerUploadCoordinatorV0,
    maxFileBytes:LIMIT, nativeUploadRouteLive:false, autoSubmit:false,
    persistsTokens:false, reloadResumeSupported:false,
    policy:"SOURCE_ONLY_OFF_PENDING_OPERATOR_RECONCILIATION_NO_GO"
  });
}));
