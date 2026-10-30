/* TrendOS customer chat product recipes v1 — presentation/validation only.
 * Reuses existing authenticated draft upload and order submission handlers.
 * NEVER calls a new API, opens WhatsApp externally, or performs AI edits.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.document) {
    root.TrendOSCustomerRecipe = api;
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", function () { api.mount(root.document); });
    } else { api.mount(root.document); }
  }
}(typeof window === "undefined" ? null : window, function () {
  "use strict";
  var KEEP = "لا تغيّر صورة العميل الأصلية، ولا ملامح أي وجه أو عدد الأشخاص أو ملامحهم أو أسماءهم أو النصوص الأصلية. أي تعديل في نسخة منفصلة مع بقاء الأصل محفوظًا، ولا يتم اعتمادها للطباعة قبل مراجعة بشرية.";
  var REVIEW = "مطلوب فحص الأبعاد الفعلية بالبكسل مقابل 300 DPI عند المقاس النهائي، وصحة الكتابة والألوان، والحفاظ على تفاصيل الصور. 300 DPI لا يتحقق بتعديل بيانات الملف وحدها. لا طباعة قبل مراجعة بشرية.";
  var RECIPES = Object.freeze({
    tablo: { name:"تابلوه", department:"طباعة", sizes:[[20,30],[30,40],[40,50],[50,70],[60,90]], note:"خلفية بيضاء فقط عند الطلب؛ لا تمس الصور الأصلية أو ترتيب الأشخاص إلا بتوجيه صريح." },
    frame: { name:"برواز", department:"طباعة", sizes:[[10,15],[15,21],[20,30],[30,40],[40,50]], note:"أكد المقاس الداخلي ونوع الإطار والهوامش قبل تجهيز الطباعة." },
    mug: { name:"مج", department:"طباعة", sizes:[[20,9]], note:"القالب المعتاد 20×9 سم؛ ضع الصور حسب تعليمات العميل ولا تغيّر الوجوه. لا تضف استروك قص ما لم يُطلب." },
    shirt: { name:"تيشيرت", department:"طباعة", sizes:[[20,25],[25,30],[30,35]], note:"مقاس الطباعة منفصل عن مقاس التيشيرت؛ قياسات الطباعة مقترحات قابلة للتعديل حسب المقاس الفعلي." },
    scarf: { name:"منديل", department:"طباعة", sizes:[], note:"حدد أبعاد المنديل ومساحة الطباعة بدقة؛ تجنب النصوص والوجوه قرب الثنيات." },
    bracelet: { name:"سوار", department:"طباعة", sizes:[], note:"المقاس النهائي ونوع الخامة وطريقة التنفيذ لابد من تأكيدها؛ لا تستخدم مقاسًا افتراضيًا." },
    sticker: { name:"استيكر", department:"طباعة", sizes:[[7,10],[8,8],[9,6],[10,15]], note:"استروك أسود مقفول للقص فقط عند الطلب؛ لا تغيّر ملامح الوجه أو النصوص." },
    invitation: { name:"دعوة / كارت", department:"طباعة", sizes:[[10,15],[15,21],[11,17]], note:"تأكيد الأسماء والتواريخ حرفيًا قبل الاعتماد؛ الهوامش والقص حسب المقاس النهائي." },
    other: { name:"منتج آخر", department:"طباعة", sizes:[], note:"يجب توضيح اسم المنتج والخامة والمقاس النهائي وأي طريقة قص أو تشطيب." }
  });
  var START = "[مواصفات مطبعجي]";
  var END = "[نهاية المواصفات]";

  function byId(doc, id) { return doc.getElementById(id); }
  function dims(value) {
    var n = Number(value);
    return Number.isFinite(n) && n >= 1 && n <= 500 && String(value).trim() !== "" ? n : null;
  }
  function getRecipe(code) { return RECIPES[code] || null; }
  function validate(value) {
    var recipe = getRecipe(value.product);
    if (!recipe) return "اختر نوع المنتج من القائمة أولًا.";
    if (value.product === "other" && !(value.otherName || "").trim()) return "اكتب اسم المنتج المطلوب.";
    if (dims(value.width) === null || dims(value.height) === null)
      return "حدد العرض والارتفاع الصحيحين بالسنتيمتر قبل إرسال البند.";
    if (value.product === "shirt" && !value.garment) return "اختر مقاس التيشيرت مع مقاس الطباعة.";
    if (!value.keepOriginal) return "أكد حفظ الصور الأصلية بدون تغيير الملامح قبل إرسال البند.";
    return "";
  }
  function stripPrior(text) {
    var str = String(text || "");
    var start = str.indexOf(START);
    if (start < 0) return str.trim();
    var end = str.indexOf(END, start);
    if (end < 0) return str.trim(); // never delete user's text on malformed tag
    return (str.slice(0,start) + str.slice(end+END.length)).trim().replace(/^تعليمات العميل:\s*/,"").trim();
  }
  function buildNotes(value, rawNotes) {
    var recipe = getRecipe(value.product);
    if (!recipe) throw new Error("PRODUCT_REQUIRED");
    var label = value.product === "other" ? String(value.otherName).trim() : recipe.name;
    var spec = [
      START,
      "المنتج: " + label,
      "المقاس النهائي: " + dims(value.width) + " × " + dims(value.height) + " سم",
      value.product === "shirt" ? "مقاس التيشيرت: " + value.garment : "",
      "قواعد المنتج: " + recipe.note,
      "حفظ الأصل: " + KEEP,
      "فحص الطباعة: " + REVIEW,
      END
    ].filter(Boolean).join("\n");
    var notes = stripPrior(rawNotes);
    return spec + (notes ? "\nتعليمات العميل:\n" + notes : "");
  }
  function read(doc) {
    return {
      product: byId(doc,"customerRecipeProduct").value,
      width: byId(doc,"customerRecipeWidth").value,
      height: byId(doc,"customerRecipeHeight").value,
      garment: byId(doc,"customerRecipeGarment").value,
      otherName: byId(doc,"customerRecipeOtherName").value,
      keepOriginal: byId(doc,"customerRecipeKeepOriginal").checked
    };
  }
  function announce(doc, message, error) {
    var el=byId(doc,"customerRecipeHint");
    if (!el) return;
    el.textContent=message;
    el.classList.toggle("is-warning", !!error);
  }
  function populate(doc) {
    var product=byId(doc,"customerRecipeProduct").value;
    var spec=getRecipe(product);
    var sizes=byId(doc,"customerRecipeSize");
    var w=byId(doc,"customerRecipeWidth"),h=byId(doc,"customerRecipeHeight");
    var other=byId(doc,"customerRecipeOtherWrap"),garment=byId(doc,"customerRecipeGarmentWrap");
    other.classList.toggle("hidden",product!=="other");
    garment.classList.toggle("hidden",product!=="shirt");
    sizes.textContent="";
    var placeholder=doc.createElement("option");placeholder.value="";
    placeholder.textContent="مقاس مخصص / اختر المقاس";sizes.appendChild(placeholder);
    (spec?spec.sizes:[]).forEach(function(pair){
      var option=doc.createElement("option");
      option.value=pair.join("x");option.textContent=pair[0]+" × "+pair[1]+" سم";
      sizes.appendChild(option);
    });
    w.value="";h.value="";
    if (spec && spec.sizes.length===1) {
      sizes.value=spec.sizes[0].join("x");
      w.value=String(spec.sizes[0][0]);h.value=String(spec.sizes[0][1]);
    }
    announce(doc,spec ? spec.note+" "+(spec.sizes.length?"يمكن تغيير الأبعاد يدويًا.":"اكتب المقاس الفعلي بالسنتيمتر.") : "اختار المنتج علشان تظهر قواعده والمقاسات المتاحة.",false);
  }
  function mount(doc) {
    if (!doc || !byId(doc,"customerDesignRecipe")) return false;
    var send=byId(doc,"customerAddDraftItemBtn"),designer=byId(doc,"customerShowDesignerBtn");
    var product=byId(doc,"customerRecipeProduct"),size=byId(doc,"customerRecipeSize");
    if (!send || !product || send.dataset.recipeAttached==="1") return false;
    send.dataset.recipeAttached="1";
    product.addEventListener("change",function(){
      populate(doc);
      var item=byId(doc,"customerOrderItem");
      if (item && (!item.value.trim() || item.dataset.recipeFilled===item.value)) {
        var spec=getRecipe(product.value);
        item.value=spec ? spec.name : "";
        item.dataset.recipeFilled=item.value;
        item.dispatchEvent(new Event("input",{bubbles:true}));
      }
    });
    size.addEventListener("change",function(){
      var parts=size.value.split("x");
      if(parts.length===2){
        byId(doc,"customerRecipeWidth").value=parts[0];
        byId(doc,"customerRecipeHeight").value=parts[1];
      }
    });
    send.addEventListener("click",function(event){
      var value=read(doc),error=validate(value);
      if (error) {
        event.preventDefault();event.stopImmediatePropagation();
        announce(doc,error,true);
        byId(doc,"customerRecipeProduct").focus();
        return;
      }
      var nativeNotes=byId(doc,"customerOrderNotes");
      nativeNotes.value=buildNotes(value,nativeNotes.value);
      nativeNotes.dispatchEvent(new Event("input",{bubbles:true}));
      var dep=byId(doc,"customerOrderDepartment");
      dep.value=getRecipe(value.product).department;
      announce(doc,"المواصفات وقواعد حماية الصورة أُضيفت لنفس مسودة الأوردر. رفع الملفات يتم من الأزرار الأصلية للمحادثة.",false);
    },true);
    // The former designer teaser must open the exact same authenticated draft chat,
    // never a second order system, network endpoint or inactive placeholder.
    if (designer && designer.dataset.recipeAttached!=="1") {
      designer.dataset.recipeAttached="1";
      designer.addEventListener("click",function(event){
        var newOrder=byId(doc,"customerShowNewOrderBtn");
        if (!newOrder) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        newOrder.click();
      },true);
    }
    populate(doc);
    return true;
  }
  return {RECIPES:RECIPES,KEEP:KEEP,REVIEW:REVIEW,START:START,END:END,
          getRecipe:getRecipe,validate:validate,buildNotes:buildNotes,stripPrior:stripPrior,mount:mount};
}));
