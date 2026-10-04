/** Matbagy Evaluations separate Cloudflare pilot (not a TrendOS adapter).
 * API is OFF until MATBAGY_ADMIN_TOKEN secret, independent EVAL_DB and EVAL_FILES
 * are configured. MATBAGY_READER_TOKEN is an optional distinct READ-ONLY secret.
 * Protect the hostname with Cloudflare Access before production use.
 * No AI, WhatsApp outbound, scheduled writes or TrendOS calls in this Worker.
 */
const CORS = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; connect-src 'self'; frame-ancestors 'none'" };

// UI assets are compiled into this one-file Worker for manual Cloudflare dashboard deployment.
const UI_HTML="<!doctype html>\n<html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>مطبعجي | برنامج التقييمات التجريبي</title><link rel=\"stylesheet\" href=\"/ui.css\"><script src=\"/ui.js\" defer></script></head>\n<body>\n<header class=\"top\"><div class=\"brand\"><div class=\"logo\">مـ</div><div><b>مطبعجي <span class=\"brand-light\">/ بصمة العميل</span></b><small>برنامج التقييمات • نسخة اختبار مستقلة</small></div></div><div class=\"header-status\"><span class=\"pill\">بيانات وهمية فقط</span><span id=\"connection\" class=\"pill gray\">غير متصل</span><button id=\"logout\" type=\"button\" class=\"ghost\" hidden>خروج</button></div></header>\n<div class=\"shell\"><aside class=\"side\"><div class=\"side-label\">مساحة العمل</div><button class=\"nav current\" data-panel=\"overview\">◫ <span>الرئيسية</span></button><button class=\"nav\" data-panel=\"chats\">▤ <span>المحادثات والأدلة</span></button><button class=\"nav\" data-panel=\"facts\">◇ <span>الملاحظات والمراجعة</span></button><button class=\"nav\" data-panel=\"profile\">◎ <span>بصمة العميل</span></button><button class=\"nav\" data-panel=\"staff\">♙ <span>أداء الموظف</span></button><button class=\"nav\" data-panel=\"actions\">↗ <span>أوامر مقترحة</span></button><div class=\"side-bottom\">البرنامج منفصل عن TrendOS.<br>لا توجد رسائل أو أوامر تلقائية.</div></aside>\n<main class=\"main\"><div class=\"pagehead\"><div><div class=\"eyebrow\">MATBAGY EVALUATIONS / PILOT</div><h1 id=\"page-title\">نظرة عامة</h1><p id=\"page-subtitle\">من المحادثة إلى دليل معتمد، ثم بصمة قابلة للاستدعاء.</p></div><div class=\"tools\"><button type=\"button\" id=\"refresh\" class=\"secondary\">تحديث البيانات</button><button type=\"button\" id=\"create-customer\" class=\"primary\">+ عميل تجريبي</button></div></div>\n<div class=\"notice\"><strong>وضع تجريبي:</strong> استخدم المعرّفات التي تبدأ بـ <code>pilot_</code> وملفات محادثات وهمية فقط. التحليل بالذكاء الاصطناعي والرد على واتساب وربط ترند غير مفعّلة.</div>\n<section class=\"chooser card\"><div class=\"flex-between\"><label for=\"customer\">العميل الحالي</label><span id=\"customer-state\" class=\"muted\">اختر عميلًا للمتابعة</span></div><select id=\"customer\"><option value=\"\">— اختر عميلًا وهميًا —</option></select></section>\n<div id=\"flash\" class=\"flash\" role=\"status\" aria-live=\"polite\"></div>\n<section id=\"overview\" class=\"panel\"><div class=\"metrics\"><div class=\"metric card\"><span>الرسائل المستوردة</span><strong id=\"metric-messages\">—</strong><small>من هذا العميل</small></div><div class=\"metric card\"><span>ملاحظات معتمدة</span><strong id=\"metric-facts\">—</strong><small>ملاحظات بدليل ومراجعة</small></div><div class=\"metric card\"><span>نسخة البصمة</span><strong id=\"metric-version\">—</strong><small>آخر إصدار محفوظ</small></div></div><div class=\"grid2\"><article class=\"card\"><h2>مسار العمل</h2><ol class=\"steps\"><li>اختر العميل التجريبي أو أنشئ واحدًا.</li><li>ارفع محادثة TXT وهمية وافحص الرسائل.</li><li>حدّد رسالة كدليل واكتب ملاحظة قابلة للتحقق.</li><li>اعتمد الملاحظة يدويًا واحفظ إصدارًا من البصمة.</li></ol></article><article class=\"card\"><h2>حدود النسخة الحالية</h2><p>هذه شاشة تشغيل يدوي على API الحالي؛ لا تستنتج تفضيلات العملاء تلقائيًا ولا تحكم على موظف دون دليل وسياق. أي أمر يُنشأ يظل اقتراحًا للمراجعة ولا يُنفذ خارج البرنامج.</p><div class=\"tagline\">Access + Bearer token + D1 + R2</div></article></div></section>\n<section id=\"chats\" class=\"panel\" hidden><div class=\"grid2\"><article class=\"card\"><h2>استيراد محادثة وهمية</h2><label for=\"source-kind\">نوع المحادثة</label><select id=\"source-kind\"><option value=\"private\">خاصة بالعميل</option><option value=\"group\">مجموعة عمل تجريبية</option></select><label for=\"source-label\">معرّف المصدر (إن اخترت مجموعة)</label><input id=\"source-label\" maxlength=\"45\" pattern=\"[a-z0-9_-]+\" value=\"pilot_team\" placeholder=\"pilot_team\"><label for=\"chat-file\">ملف TXT بصيغة تاريخ - مُرسل: نص</label><input id=\"chat-file\" type=\"file\" accept=\".txt,text/plain\"><small>حدّ الاختبار: 1MB وحتى 80 رسالة؛ لا ترفع بيانات حقيقية.</small><button id=\"upload\" type=\"button\" class=\"primary full\">رفع المحادثة</button></article><article class=\"card\"><h2>الرسائل ومراجع الأدلة</h2><p class=\"muted\">اضغط «استخدم كدليل» لاختيار المرجع بدل نسخه من Cloudflare.</p><div id=\"messages\" class=\"stack\"><div class=\"empty\">اختر عميلًا لعرض الرسائل.</div></div></article></div></section>\n<section id=\"facts\" class=\"panel\" hidden><div class=\"grid2\"><article class=\"card\"><h2>إنشاء ملاحظة مرشحة</h2><p class=\"muted\">تسجيل واقعة قابلة للإثبات فقط؛ لا تُعتمد تلقائيًا.</p><label for=\"fact-subject\">موضوع الملاحظة</label><select id=\"fact-subject\"><option value=\"customer\">العميل</option><option value=\"employee\">موظف تجريبي</option></select><div id=\"staff-wrap\" hidden><label for=\"fact-employee\">الموظف</label><select id=\"fact-employee\"></select></div><label for=\"fact-topic\">التصنيف</label><select id=\"fact-topic\"></select><label for=\"fact-text\">النص المرصود</label><textarea id=\"fact-text\" rows=\"4\" maxlength=\"900\" placeholder=\"اكتب ما حدث في الرسالة؛ لا تصف صفات أو نوايا الشخص.\"></textarea><label for=\"evidence\">مرجع الدليل المختار</label><input id=\"evidence\" readonly placeholder=\"اختر رسالة من تبويب المحادثات\"><button id=\"fact-create\" type=\"button\" class=\"primary full\">حفظ كملاحظة مرشحة</button></article><article class=\"card\"><h2>مراجعة الملاحظات</h2><div class=\"filter\"><label for=\"fact-filter\">الحالة</label><select id=\"fact-filter\"><option value=\"all\">الكل</option><option value=\"candidate\">قيد المراجعة</option><option value=\"verified\">المعتمدة</option><option value=\"disputed\">المرفوضة/محل خلاف</option></select></div><div id=\"facts-list\" class=\"stack\"><div class=\"empty\">لا توجد ملاحظات للعرض.</div></div></article></div></section>\n<section id=\"profile\" class=\"panel\" hidden><div class=\"grid2\"><article class=\"card\"><div class=\"flex-between\"><h2>آخر بصمة محفوظة</h2><span class=\"pill gray\" id=\"version-badge\">الإصدار 0</span></div><div id=\"profile-read\" class=\"stack\"><div class=\"empty\">اختر العميل أولًا.</div></div></article><article class=\"card\"><h2>تحديث البصمة بعد المراجعة</h2><label for=\"reviewer\">اسم المراجع التجريبي</label><input id=\"reviewer\" value=\"pilot_owner\" maxlength=\"80\"><label for=\"tone\">أسلوب الرد المعتمد</label><input id=\"tone\" maxlength=\"240\" placeholder=\"مثال: مختصر وواضح\" value=\"neutral\"><label for=\"detail\">مستوى التفصيل</label><input id=\"detail\" maxlength=\"240\" value=\"concise\"><label for=\"dos\">اعمل (تعليمة في كل سطر)</label><textarea id=\"dos\" rows=\"3\" placeholder=\"تحقق من حالة الأوردر قبل تأكيده\"></textarea><label for=\"donts\">تجنّب (تعليمة في كل سطر)</label><textarea id=\"donts\" rows=\"3\" placeholder=\"لا تعد بموعد غير متحقق\"></textarea><div class=\"subhead\">الملاحظات المعتمدة المرتبطة بهذا الإصدار</div><div id=\"approved-pick\" class=\"stack small\"><div class=\"empty\">لا توجد ملاحظات معتمدة.</div></div><button id=\"profile-save\" type=\"button\" class=\"primary full\">حفظ إصدار جديد بعد المراجعة</button><small>يُتحقق من نسخة البصمة قبل الحفظ؛ في حالة تعارض النسخ أعد التحميل ثم راجع التغييرات.</small></article></div></section>\n<section id=\"staff\" class=\"panel\" hidden><div class=\"grid2\"><article class=\"card\"><h2>ملف موظف تجريبي</h2><p>أضف موظفًا تجريبيًا لمراجعة ملاحظاته المرتبطة بمحادثات العميل. الربط بين المُرسل والموظف <b>يدوي</b>، ولا توجد درجات أداء أو أحكام آلية.</p><label for=\"employee-id\">المعرّف التجريبي</label><input id=\"employee-id\" placeholder=\"pilot_staff_01\" pattern=\"pilot_[a-z0-9_-]+\"><label for=\"employee-name\">الاسم الوهمي</label><input id=\"employee-name\" placeholder=\"TEST STAFF\"><button id=\"employee-create\" type=\"button\" class=\"primary full\">إضافة موظف وهمي</button></article><article class=\"card\"><h2>ملاحظات أداء الموظف</h2><p class=\"muted\">انتقل لتبويب «الملاحظات والمراجعة»، واختر «موظف تجريبي» مع دليل من محادثة العميل. قيّم الواقعة والسياق لا شخصية الموظف.</p><div id=\"employee-list\" class=\"stack\"><div class=\"empty\">لا يوجد موظفون تجريبيون.</div></div></article></div></section>\n<section id=\"actions\" class=\"panel\" hidden><div class=\"grid2\"><article class=\"card\"><h2>اقتراح إجراء — دون تنفيذ</h2><label for=\"action-kind\">نوع الاقتراح</label><select id=\"action-kind\"><option value=\"check_order\">مراجعة حالة الأوردر</option><option value=\"request_missing_file\">طلب ملف ناقص</option><option value=\"verify_deadline\">التحقق من موعد التسليم</option><option value=\"clarify_specs\">تأكيد المواصفات</option><option value=\"escalate_to_manager\">تصعيد للمسؤول</option><option value=\"prepare_customer_reply\">تجهيز مسودة رد فقط</option><option value=\"staff_coaching_review\">مراجعة احتياج تدريب</option></select><label for=\"action-note\">سبب الاقتراح</label><textarea id=\"action-note\" maxlength=\"700\" rows=\"4\" placeholder=\"اكتب سبب الاقتراح بناءً على دليل محدد.\"></textarea><label for=\"action-ref\">الدليل المختار</label><input id=\"action-ref\" readonly placeholder=\"اختر رسالة من تبويب المحادثات\"><button id=\"action-create\" type=\"button\" class=\"primary full\">حفظ الاقتراح للمراجعة</button></article><article class=\"card\"><h2>قائمة الاقتراحات</h2><p class=\"muted\">كل إجراء هنا حالة «بانتظار المراجعة»؛ لا ينفّذ أوامر على TrendOS ولا يرسل رسائل واتساب.</p><div id=\"actions-list\" class=\"stack\"><div class=\"empty\">لا توجد اقتراحات.</div></div></article></div></section>\n<footer>Matbagy Evaluations · Pilot UI v1 · منفصل عن TrendOS · لا تستخدم بيانات حقيقية قبل اعتماد ضوابط الأمان.</footer></main></div>\n<div id=\"login\" class=\"overlay\"><div class=\"login-card\"><div class=\"logo large\">مـ</div><h2>دخول برنامج التقييمات</h2><p>هذه واجهة اختبار محمية بـCloudflare Access ومفتاح الإدارة. المفتاح يُحتفظ به في ذاكرة الصفحة فقط، ولن يُخزَّن في المتصفح.</p><form id=\"login-form\"><label for=\"token\">مفتاح إدارة التقييمات</label><input id=\"token\" type=\"password\" autocomplete=\"off\" required placeholder=\"MATBAGY_ADMIN_TOKEN\"><button type=\"submit\" class=\"primary full\">الدخول إلى الواجهة</button></form><small>لا ترسل المفتاح في المحادثة أو GitHub أو صور الشاشة.</small><p class=\"muted\" id=\"login-message\"></p></div></div>\n</body></html>\n";
const UI_CSS=":root{font-family:Tahoma,Arial,sans-serif;color:#24334c;background:#f4f6fa;--blue:#3159be;--dark:#192940;--muted:#718096;--border:#e1e7f0}*{box-sizing:border-box}body{margin:0}button,input,select,textarea{font:inherit}button{cursor:pointer}button:disabled{opacity:.4;cursor:not-allowed}h1{font-size:29px;margin:7px 0}h2{font-size:18px;margin:0 0 18px}p{line-height:1.85}small{font-size:12px;color:var(--muted)}.top{height:78px;background:white;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 38px;gap:16px}.brand{display:flex;align-items:center;gap:12px;font-size:18px}.brand small{display:block;margin-top:4px}.brand-light{color:#74819a;font-weight:400}.logo{width:41px;height:41px;border-radius:12px;display:grid;place-items:center;color:white;background:var(--blue);font-weight:bold}.large{width:55px;height:55px;margin:auto}.header-status,.tools,.flex-between{display:flex;align-items:center;justify-content:space-between;gap:12px}.pill{border-radius:30px;background:#e5f5eb;color:#217246;padding:6px 12px;font-size:12px;font-weight:bold}.pill.gray{background:#edf0f5;color:#66778b}.shell{display:flex;min-height:calc(100vh - 78px)}.side{width:250px;flex:none;background:#fff;border-left:1px solid var(--border);padding:25px 14px;position:relative}.side-label{color:#97a2b2;font-size:12px;padding:0 17px 14px}.nav{border:0;width:100%;background:transparent;text-align:right;border-radius:9px;padding:15px 17px;margin-bottom:5px;color:#61718a;display:flex;gap:12px;align-items:center}.nav.current,.nav:hover{background:#eef3ff;color:var(--blue);font-weight:bold}.side-bottom{margin-top:50px;border-top:1px solid var(--border);padding:20px 9px;color:#8693a8;font-size:12px;line-height:2}.main{flex:1;min-width:0;padding:30px 38px;max-width:1660px}.pagehead{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:20px}.pagehead p{color:#8090a7;margin:0}.eyebrow{font-size:11px;color:#7390cb;letter-spacing:1px}.primary,.secondary,.ghost{border:1px solid transparent;border-radius:8px;padding:10px 16px;min-height:39px}.primary{color:white;background:var(--blue)}.secondary{background:white;color:var(--blue);border-color:#ccdaf6}.ghost{background:white;border-color:#d5e0ed;color:var(--dark)}.full{width:100%;margin-top:16px}.notice{border:1px solid #efdfbb;background:#fff9eb;padding:14px 18px;border-radius:8px;margin:18px 0;font-size:13px;line-height:1.8}.notice code{direction:ltr;display:inline-block}.card{background:white;border:1px solid var(--border);border-radius:12px;padding:22px;box-shadow:0 2px 12px rgba(28,51,83,.03)}.chooser{max-width:100%;margin-bottom:16px;padding:15px 20px}.chooser select{margin-top:7px}.muted{color:var(--muted);font-size:13px}.panel{margin-top:20px}.panel[hidden],[hidden]{display:none!important}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:19px}.metric{display:flex;flex-direction:column;gap:12px}.metric span{font-size:14px;color:#6c7e96}.metric strong{font-size:32px;color:#203756}.steps{line-height:2.7;padding-right:20px}.tagline{padding:12px;background:#f2f6fd;color:var(--blue);border-radius:8px}input:not([type=checkbox]):not([type=file]),select,textarea{width:100%;border:1px solid #d6deea;background:white;border-radius:8px;padding:11px;outline-color:#9eb6ee;color:#203554}input[type=file]{display:block;width:100%;padding:12px;border:1px dashed #afbdd4;border-radius:8px}textarea{resize:vertical}label{font-size:13px;font-weight:bold;display:block;margin:16px 0 8px}.filter{display:flex;gap:10px;align-items:center;margin-bottom:15px}.filter label{margin:0}.filter select{max-width:190px}.subhead{font-weight:bold;margin:20px 0 10px}.stack{display:flex;flex-direction:column;gap:10px;max-height:510px;overflow:auto}.stack.small{max-height:170px}.item{border:1px solid #e2e8f2;border-radius:9px;padding:12px 14px;background:#fbfcff}.item p{margin:7px 0;overflow-wrap:anywhere;white-space:pre-wrap}.meta{color:#798ba3;font-size:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}.item-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.item-actions button{font-size:12px;padding:7px 10px}.empty{padding:28px 12px;border:1px dashed #d4dfef;color:#8997ab;text-align:center;border-radius:8px}.flash{min-height:0}.flash:not(:empty){padding:13px 17px;background:#eaf5ee;border:1px solid #b9dfc9;color:#216a40;border-radius:8px;margin:12px 0}.flash.error{background:#fff0ef;color:#ae3535;border-color:#f4c1c1}.check-line{display:flex;gap:8px;align-items:flex-start;margin:0;font-weight:400}.check-line input{margin-top:3px}footer{padding:30px 4px 10px;color:#98a4b5;font-size:11px}.overlay{position:fixed;inset:0;background:rgba(18,32,55,.62);display:grid;place-items:center;padding:20px;z-index:5}.login-card{background:white;border-radius:18px;padding:30px;max-width:440px;width:100%;box-shadow:0 18px 80px #15253a66;text-align:center}.login-card h2{margin:20px 0 8px}.login-card p{font-size:13px;color:#64758d}.login-card form{text-align:right}.login-card input{text-align:left;direction:ltr}@media(max-width:990px){.main{padding:22px}.side{width:75px}.nav span,.side-label,.side-bottom{display:none}.nav{justify-content:center}.grid2{grid-template-columns:1fr}}@media(max-width:600px){.top{padding:13px;height:auto;flex-wrap:wrap}.shell{display:block}.side{width:100%;display:flex;overflow:auto;padding:5px;border-left:0;border-bottom:1px solid var(--border)}.nav{min-width:50px;width:auto}.main{padding:16px}.pagehead{align-items:flex-start;flex-direction:column}.metrics{grid-template-columns:1fr;gap:10px}}\n";
const UI_JS="'use strict';\n// Pilot UI: only the operator's test records are displayed; no localStorage or automatic actions.\nconst $ = id => document.getElementById(id);\nconst S = {token:'',cid:'',customers:[],employees:[],messages:[],facts:[],profile:null,actions:[],evidence:''};\nconst customerTopics = ['reply_style','product_preference','follow_up','price_process','friction','resolution','agreement'];\nconst staffTopics = ['staff_clarity','staff_follow_up','staff_handover','staff_customer_care'];\nconst topicLabel = {reply_style:'أسلوب الرد',product_preference:'تفضيل منتج مثبت',follow_up:'متابعة',price_process:'السعر والإجراءات',friction:'نقطة احتكاك',resolution:'حل مثبت',agreement:'اتفاق موثق',staff_clarity:'وضوح التواصل',staff_follow_up:'المتابعة',staff_handover:'تسليم بين الأقسام',staff_customer_care:'التعامل مع العميل'};\nconst titles = {overview:['نظرة عامة','من المحادثة إلى بصمة معتمدة بالدليل.'],chats:['المحادثات والأدلة','استيراد المحادثات الوهمية وقراءة الرسائل بأمان.'],facts:['الملاحظات والمراجعة','كل ملاحظة مرشحة تحتاج دليلًا وقرارًا بشريًا.'],profile:['بصمة العميل','استدعاء آخر إصدار وإضافة نسخة جديدة بعد الاعتماد.'],staff:['أداء الموظف','ملاحظات مبنية على وقائع محددة، دون درجات أو حكم آلي.'],actions:['الأوامر المقترحة','اقتراحات تنتظر المراجعة ولا تنفذ شيئًا خارجيًا.']};\nfunction show(message,bad=false){const f=$('flash');f.textContent=message;f.classList.toggle('error',bad);}\nfunction clear(node){node.replaceChildren();}\nfunction node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=String(text);if(cls)e.className=cls;return e;}\nfunction info(t){return node('div',t,'empty');}\nfunction item(target,head,body,meta){const box=node('article',undefined,'item');box.append(node('strong',head));if(body)box.append(node('p',body));if(meta)box.append(node('div',meta,'meta'));target.append(box);return box;}\nfunction btn(text,fn,style='secondary'){const b=node('button',text,style);b.type='button';b.addEventListener('click',fn);return b;}\nfunction selected(){if(!S.cid){show('اختر عميلًا تجريبيًا أولًا.',true);return false;}return true;}\nasync function api(path,opts={}){\n if(!S.token)throw Error('سجّل الدخول أولًا.');\n const headers=new Headers(opts.headers||{});headers.set('Authorization','Bearer '+S.token);\n const response=await fetch(path,{...opts,headers,cache:'no-store',credentials:'same-origin'});\n let data;try{data=await response.json();}catch{data={error:'استجابة غير مفهومة من الخادم'};}\n if(!response.ok)throw Error(`HTTP ${response.status}: ${data.error||'فشل الطلب'}`);\n return data;\n}\nfunction pilotId(s){return /^pilot_[a-z0-9_-]{2,44}$/.test(s);}\nfunction labelId(x){return String(x||'').slice(0,60);}\nfunction changePanel(panel){\n document.querySelectorAll('.nav').forEach(e=>e.classList.toggle('current',e.dataset.panel===panel));\n document.querySelectorAll('.panel').forEach(e=>e.hidden=e.id!==panel);\n $('page-title').textContent=titles[panel][0];$('page-subtitle').textContent=titles[panel][1];\n}\nasync function loadCustomers(){const data=await api('/api/pilot/customers');S.customers=(data.customers||[]).filter(c=>pilotId(c.customer_id));const sel=$('customer');const current=S.cid;clear(sel);sel.append(new Option('— اختر عميلًا وهميًا —',''));\n S.customers.forEach(c=>sel.append(new Option(c.display_name+' · '+c.customer_id,c.customer_id)));\n if(S.customers.some(c=>c.customer_id===current))sel.value=current;\n $('customer-state').textContent=S.customers.length+' عميل تجريبي متاح';\n}\nasync function loadEmployees(){const data=await api('/api/employees');S.employees=(data.employees||[]).filter(e=>pilotId(e.employee_id));const sel=$('fact-employee');clear(sel);sel.append(new Option('— اختر موظفًا وهميًا —',''));const list=$('employee-list');clear(list);\n S.employees.forEach(e=>{sel.append(new Option(e.display_name+' · '+e.employee_id,e.employee_id));item(list,e.display_name,'المعرّف: '+e.employee_id,'موظف تجريبي — الربط بالرسائل يدوي');});if(!S.employees.length)list.append(info('أضف موظفًا وهميًا لبدء مراجعة وقائع أداء الموظفين.'));\n}\nfunction markEvidence(ref){S.evidence=ref;$('evidence').value=ref;$('action-ref').value=ref;show('تم اختيار مرجع الدليل؛ انتقل للملاحظات أو الأوامر المقترحة.');}\nfunction renderMessages(){const out=$('messages');clear(out);$('metric-messages').textContent=S.messages.length;\n if(!S.messages.length){out.append(info('لا توجد رسائل مستوردة لهذا العميل.'));return;}\n S.messages.forEach(m=>{const box=item(out,m.sender_label||'مرسل غير محدد',m.message_text,m.message_at+' · '+m.source_id);const a=node('div',undefined,'item-actions');a.append(btn('استخدم كدليل',()=>{markEvidence(m.evidence_ref);changePanel('facts');}));box.append(a);});\n}\nfunction renderFacts(){const out=$('facts-list');clear(out);const filter=$('fact-filter').value;const list=S.facts.filter(f=>filter==='all'||f.status===filter);$('metric-facts').textContent=S.facts.filter(f=>f.status==='verified'&&f.subject_type==='customer').length;\n if(!list.length){out.append(info('لا توجد ملاحظات مطابقة.'));return;}\n list.forEach(f=>{const owner=f.subject_type==='employee'?'الموظف '+f.subject_id:'العميل';const card=item(out,topicLabel[f.topic]||f.topic,f.statement,owner+' · '+f.status+' · أدلة: '+(f.evidence_refs||[]).length);\n const a=node('div',undefined,'item-actions');(f.evidence_refs||[]).forEach(ref=>a.append(btn('عرض مرجع الدليل',()=>{const m=S.messages.find(x=>x.evidence_ref===ref);if(m){show('الدليل: '+m.message_at+' — '+m.message_text);changePanel('chats');}else show('مرجع الدليل: '+ref);})));if(f.status==='candidate'){\n a.append(btn('اعتماد',()=>reviewFact(f,'verified'),'primary'),btn('محل خلاف',()=>reviewFact(f,'disputed'),'secondary'));\n }card.append(a);});\n}\nfunction renderProfile(){const p=S.profile||{version:0,profile:null,approved_fact_ids:[]};$('metric-version').textContent=p.version;$('version-badge').textContent='الإصدار '+p.version;const out=$('profile-read');clear(out);\n if(!p.profile){out.append(info('لم تُحفظ بصمة لهذا العميل بعد.'));$('tone').value='neutral';$('detail').value='concise';$('dos').value='';$('donts').value='';}\n else{item(out,'أسلوب الرد المعتمد',p.profile.tone+' · '+p.profile.detail_level,'الإصدار '+p.version+' · المراجع '+(p.reviewer||'—'));item(out,'اعمل',(p.profile.response_do||[]).join('\\n'));item(out,'تجنّب',(p.profile.response_avoid||[]).join('\\n'));$('tone').value=p.profile.tone;$('detail').value=p.profile.detail_level;$('dos').value=(p.profile.response_do||[]).join('\\n');$('donts').value=(p.profile.response_avoid||[]).join('\\n');}\n const approved=S.facts.filter(f=>f.status==='verified'&&f.subject_type==='customer'&&f.subject_id===S.cid);const pick=$('approved-pick');clear(pick);\n if(!approved.length){pick.append(info('اعتمد ملاحظة خاصة بالعميل أولًا.'));return;}\n approved.forEach(f=>{const wrap=node('label',undefined,'check-line');const ck=document.createElement('input');ck.type='checkbox';ck.value=f.fact_id;ck.name='approved';ck.checked=(p.approved_fact_ids||[]).includes(f.fact_id);wrap.append(ck,node('span',f.statement));pick.append(wrap);});\n}\nfunction renderActions(){const out=$('actions-list');clear(out);S.actions.forEach(a=>item(out,a.kind,a.note,'بانتظار المراجعة · '+a.created_at));if(!S.actions.length)out.append(info('لا توجد اقتراحات لهذا العميل.'));}\nasync function loadCustomer(){if(!S.cid){S.messages=[];S.facts=[];S.actions=[];S.profile={version:0,profile:null,approved_fact_ids:[]};renderMessages();renderFacts();renderProfile();renderActions();return;}\n try{const id=encodeURIComponent(S.cid);const results=await Promise.all([\n api('/api/customers/'+id+'/messages'),api('/api/customers/'+id+'/facts'),api('/api/customers/'+id+'/profile-snapshots/latest'),api('/api/customers/'+id+'/actions')]);\n S.messages=results[0].messages||[];S.facts=results[1].facts||[];S.profile=results[2];S.actions=results[3].actions||[];S.evidence='';$('evidence').value='';$('action-ref').value='';renderMessages();renderFacts();renderProfile();renderActions();show('تم تحميل أحدث بيانات العميل التجريبي.');}\n catch(e){show(e.message,true);}\n}\nasync function createCustomer(){const id=(prompt('معرّف العميل الوهمي (يبدأ بـ pilot_)','pilot_demo_02')||'').trim();if(!id)return;if(!pilotId(id)){show('استخدم معرّفًا تجريبيًا يبدأ بـ pilot_ فقط.',true);return;}\n const name=(prompt('اسم وهمي فقط','TEST CUSTOMER 02')||'').trim();if(!name)return;if(!confirm('تأكيد إنشاء عميل وهمي فقط: '+id+' ؟'))return;\n try{await api('/api/customers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer_id:id,display_name:name})});S.cid=id;await loadCustomers();$('customer').value=id;await loadCustomer();show('تم إنشاء عميل تجريبي.');}catch(e){show(e.message,true);}\n}\nasync function uploadFile(){if(!selected())return;const file=$('chat-file').files[0];if(!file||file.size>1000000||!file.name.toLowerCase().endsWith('.txt')){show('اختر ملف TXT وهميًا بحجم لا يتجاوز 1MB.',true);return;}\n const kind=$('source-kind').value,label=kind==='private'?S.cid:$('source-label').value.trim();if(!/^[a-z0-9][a-z0-9_-]{0,49}$/.test(label)){show('معرّف مصدر غير صالح.',true);return;}\n if(!confirm('هل الملف يحتوي بيانات وهمية فقط؟ سيتم حفظه في R2 واستيراد رسائله إلى D1.'))return;\n try{const data=await api('/api/exports/txt',{method:'POST',headers:{'Content-Type':'text/plain; charset=utf-8','X-Customer-Id':S.cid,'X-Source-Id':kind+'/'+label},body:file});$('chat-file').value='';await loadCustomer();show(data.already_imported?'هذا الملف مستورد من قبل، ولم تُضاف رسائل مكررة.':'تم الاستيراد: '+data.new_messages+' رسالة جديدة من أصل '+data.total_in_export+'.');}catch(e){show(e.message+' — لا تعِد الرفع قبل فحص الحالة.',true);}\n}\nfunction updateTopic(){const employee=$('fact-subject').value==='employee';$('staff-wrap').hidden=!employee;const sel=$('fact-topic');clear(sel);(employee?staffTopics:customerTopics).forEach(t=>sel.append(new Option(topicLabel[t],t)));}\nasync function createFact(){if(!selected())return;const employee=$('fact-subject').value==='employee';const eid=$('fact-employee').value;const statement=$('fact-text').value.trim();if(employee&&!eid){show('اختر موظفًا تجريبيًا أولًا.',true);return;}if(statement.length<8||!S.evidence){show('الملاحظة تحتاج وصفًا واضحًا ومرجع دليل من الرسائل.',true);return;}if(!confirm('حفظ الملاحظة كمرشحة للمراجعة، وليست حقيقة معتمدة؟'))return;\n try{const d=await api('/api/profile/facts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer_id:S.cid,subject_type:employee?'employee':'customer',subject_id:employee?eid:S.cid,topic:$('fact-topic').value,statement,evidence_refs:[S.evidence]})});$('fact-text').value='';await loadCustomer();changePanel('facts');show('تم حفظ الملاحظة كمرشحة للمراجعة: '+d.status);}catch(e){show(e.message,true);}\n}\nasync function reviewFact(f,decision){if(!confirm((decision==='verified'?'اعتماد':'اعتبار الملاحظة محل خلاف')+' الملاحظة بعد فحص نص الرسالة والسياق؟'))return;const reviewer=$('reviewer').value.trim()||'pilot_owner';\n try{await api('/api/profile/facts/'+encodeURIComponent(f.fact_id)+'/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer_id:S.cid,decision,reviewer})});await loadCustomer();changePanel('facts');show('تم تسجيل قرار المراجعة.');}catch(e){show(e.message,true);}\n}\nasync function saveProfile(){if(!selected())return;const ids=Array.from(document.querySelectorAll('input[name=approved]:checked'),e=>e.value);if(!ids.length){show('اختر ملاحظة عميل معتمدة واحدة على الأقل.',true);return;}\n const lines=id=>$(id).value.split('\\n').map(x=>x.trim()).filter(Boolean);const profile={tone:$('tone').value.trim(),detail_level:$('detail').value.trim(),response_do:lines('dos'),response_avoid:lines('donts')};const reviewer=$('reviewer').value.trim();if(!reviewer||!profile.tone||!profile.detail_level){show('أدخل المراجع وأسلوب الرد ومستوى التفصيل.',true);return;}\n const expected=S.profile.version; if(!confirm('حفظ بصمة تجريبية بإصدار '+(expected+1)+' باستخدام '+ids.length+' ملاحظة معتمدة؟'))return;\n try{const request_id='pilot_ui_'+crypto.randomUUID().replaceAll('-','');const data=await api('/api/customers/'+encodeURIComponent(S.cid)+'/profile-snapshots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expected_version:expected,request_id,reviewer,approved_fact_ids:ids,profile})});await loadCustomer();changePanel('profile');show('حُفظ إصدار البصمة '+data.version+' وتمت إعادة قراءته.');}catch(e){show(e.message+' — لا تُعِد الحفظ دون تحديث ومراجعة النسخة.',true);}\n}\nasync function createEmployee(){const id=$('employee-id').value.trim(),name=$('employee-name').value.trim();if(!pilotId(id)||!name){show('أدخل معرّف موظف وهمي يبدأ بـ pilot_ واسمًا وهميًا.',true);return;}\n if(!confirm('إنشاء موظف تجريبي فقط؟'))return;try{await api('/api/employees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({employee_id:id,display_name:name})});$('employee-id').value='';$('employee-name').value='';await loadEmployees();show('تم إنشاء موظف تجريبي.');}catch(e){show(e.message,true);}\n}\nasync function createAction(){if(!selected())return;const note=$('action-note').value.trim();if(note.length<8||!S.evidence){show('الاقتراح يحتاج سببًا ومرجع دليل من الرسائل.',true);return;}\n if(!confirm('حفظ الاقتراح للمراجعة فقط؟ لن تُرسَل رسالة أو يُنفَّذ أمر خارج البرنامج.'))return;try{const d=await api('/api/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer_id:S.cid,kind:$('action-kind').value,note,evidence_refs:[S.evidence]})});$('action-note').value='';await loadCustomer();changePanel('actions');show('تم حفظ الاقتراح: '+d.status+' (دون تنفيذ خارجي).');}catch(e){show(e.message,true);}\n}\nfunction logout(){S.token='';S.cid='';S.customers=[];S.employees=[];S.messages=[];S.facts=[];S.profile=null;$('token').value='';$('login').hidden=false;$('logout').hidden=true;$('connection').textContent='غير متصل';clear($('customer'));$('customer').append(new Option('— اختر عميلًا وهميًا —',''));show('تم الخروج؛ المفتاح لم يُحفظ في المتصفح.');}\nasync function login(e){e.preventDefault();const value=$('token').value;if(!value)return;S.token=value;$('token').value='';$('login-message').textContent='جاري التحقق من المفتاح...';try{await loadCustomers();await loadEmployees();$('login').hidden=true;$('logout').hidden=false;$('connection').textContent='متصل عبر API';$('login-message').textContent='';if(S.customers.some(c=>c.customer_id==='pilot_demo_01')){S.cid='pilot_demo_01';$('customer').value=S.cid;await loadCustomer();}show('تم تسجيل الدخول. اختر عميلًا تجريبيًا لبدء العمل.');}catch(err){S.token='';$('login-message').textContent=err.message;}}\n$('login-form').addEventListener('submit',login);$('logout').addEventListener('click',logout);$('customer').addEventListener('change',e=>{S.cid=e.target.value;loadCustomer();});$('refresh').addEventListener('click',async()=>{if(!S.token)return;try{await loadCustomers();await loadEmployees();await loadCustomer();}catch(e){show(e.message,true);}});$('create-customer').addEventListener('click',createCustomer);\n$('upload').addEventListener('click',uploadFile);$('fact-subject').addEventListener('change',updateTopic);$('fact-filter').addEventListener('change',renderFacts);$('fact-create').addEventListener('click',createFact);$('profile-save').addEventListener('click',saveProfile);$('employee-create').addEventListener('click',createEmployee);$('action-create').addEventListener('click',createAction);document.querySelectorAll('.nav').forEach(e=>e.addEventListener('click',()=>changePanel(e.dataset.panel)));updateTopic();\n";
const UI_HEADERS = { 'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
 'X-Frame-Options':'DENY','Referrer-Policy':'no-referrer', 'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" };
function staticResponse(content,type){return new Response(content,{status:200,headers:{...UI_HEADERS,'Content-Type':type}});}
const ID=/^[a-z0-9][a-z0-9_-]{1,49}$/;
const SOURCE=/^(private|group)\/[a-z0-9][a-z0-9_-]{0,49}$/;
const TOPICS=new Set(['reply_style','product_preference','follow_up','price_process','friction','resolution','agreement',
  'staff_clarity','staff_follow_up','staff_handover','staff_customer_care']);
const STAFF_TOPICS=new Set(['staff_clarity','staff_follow_up','staff_handover','staff_customer_care']);
const ACTIONS=new Set(['check_order','request_missing_file','verify_deadline','clarify_specs',
 'escalate_to_manager','prepare_customer_reply','staff_coaching_review']);
const now=()=>new Date().toISOString();
const error=(message,status=400)=>Response.json({error:message},{status,headers:CORS});
const ok=(payload,status=200)=>Response.json(payload,{status,headers:CORS});
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)))
    .map(x=>x.toString(16).padStart(2,'0')).join('');
const enc=new TextEncoder();
function tokenEquals(given,token){
 if(typeof token!=='string'||!token)return false;
 const expected='Bearer '+token;
 const a=enc.encode(given),b=enc.encode(expected);
 if(a.length!==b.length)return false;
 let mismatch=0;for(let i=0;i<a.length;i++) mismatch|=a[i]^b[i];
 return mismatch===0;
}
function authorizedRole(req,env){
 const given=req.headers.get('Authorization')||'';
 if(tokenEquals(given,env.MATBAGY_ADMIN_TOKEN))return 'admin';
 if(tokenEquals(given,env.MATBAGY_READER_TOKEN))return 'reader';
 return null;
}
function readerAllowed(path,method){
 return method==='GET'&&(
  /^\/api\/customers\/[a-z0-9_-]{2,50}\/profile-snapshots\/latest$/.test(path)||
  /^\/api\/customers\/[a-z0-9_-]{2,50}\/fingerprint$/.test(path));
}
async function bodyJson(req,max=16000){
 const length=Number(req.headers.get('content-length')||0);
 if(length>max)throw new Error('حجم البيانات تجاوز الحد المسموح');
 const bytes=await req.arrayBuffer();
 if(bytes.byteLength>max)throw new Error('حجم البيانات تجاوز الحد المسموح');
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new Error('صيغة JSON غير صالحة');}
}
const isId=x=>typeof x==='string'&&ID.test(x);
async function customerExists(db,cid){return !!(await db.prepare('SELECT customer_id FROM customers WHERE customer_id=?').bind(cid).first());}
async function validateRefs(db,cid,refs){
 if(!Array.isArray(refs)||!refs.length||refs.length>8)throw new Error('الدليل مطلوب (1-8 رسائل)');
 const uniq=[...new Set(refs)];
 if(uniq.length!==refs.length)throw new Error('أدلة مكررة');
 for(const ref of uniq){
  if(typeof ref!=='string'||!/^((private|group)\/[a-z0-9_-]{1,50})#[0-9a-f]{24}$/.test(ref))
    throw new Error('مرجع دليل غير صالح');
  const message=await db.prepare('SELECT message_id FROM messages WHERE customer_id=? AND source_id=? AND message_id=?')
     .bind(cid,ref.split('#')[0],ref.split('#')[1]).first();
  if(!message)throw new Error('الدليل غير موجود داخل ملف هذا العميل');
 }
 return uniq;
}
export function parseChat(text){
 const lines=text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n');
 const header=/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM|ص|م))?\s+-\s+([^:]+):\s*(.*)$/i;
 const out=[];let current=null;
 for(const line of lines){
  const match=header.exec(line);
  if(match){
   const [,day,month,year,hour,minute,ampm,sender,body]=match;
   let h=Number(hour);if(ampm){if(h<1||h>12)continue;h=h%12+(/PM|م/i.test(ampm)?12:0);}
   const dt=new Date(Date.UTC(Number(year),Number(month)-1,Number(day),h,Number(minute)));
   if(dt.getUTCFullYear()!==Number(year)||dt.getUTCMonth()+1!==Number(month)||dt.getUTCDate()!==Number(day))continue;
   current={message_at:`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(h).padStart(2,'0')}:${minute}`,
     sender:sender.trim().slice(0,200),body:body.slice(0,5000)};out.push(current);
  }else if(current){current.body+='\n'+line.slice(0,5000);current.body=current.body.slice(0,6000);}
 }
 return out;
}
// Profile snapshots are separate from candidate facts and only reference approved facts.
// Versions are monotonic; a caller must state its observed version before appending.
function makePlaybook(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('بصمة غير صالحة');
 const simple=x=>typeof x==='string' && x.length<=240 && !/[\u0000-\u001f]/.test(x);
 const strings=x=>Array.isArray(x)&&x.length<=12&&x.every(simple);
 const p={tone:input.tone,detail_level:input.detail_level,
  response_do:input.response_do,response_avoid:input.response_avoid};
 if(!simple(p.tone)||!simple(p.detail_level)||!strings(p.response_do)||!strings(p.response_avoid))
  throw new Error('بصمة غير صالحة');
 return p;
}
async function approvedFacts(db,cid,ids){
 if(!Array.isArray(ids)||ids.length<1||ids.length>30||new Set(ids).size!==ids.length ||
    !ids.every(x=>typeof x==='string'&&/^[0-9a-f-]{36}$/.test(x)))throw new Error('مراجع الملاحظات المعتمدة غير صالحة');
 for(const fid of ids){
  const fact=await db.prepare("SELECT fact_id FROM profile_facts WHERE fact_id=? AND customer_id=? AND subject_type='customer' AND subject_id=? AND status='verified'").bind(fid,cid,cid).first();
  if(!fact)throw new Error('بصمة تحتوي ملاحظة غير معتمدة');
 }
 return ids;
}
async function upload(req,env){
 const cid=req.headers.get('X-Customer-Id'),source=req.headers.get('X-Source-Id');
 if(!isId(cid)||!SOURCE.test(source||''))return error('معرّف العميل أو المصدر غير صالح');
 if(!(await customerExists(env.EVAL_DB,cid)))return error('العميل غير موجود',404);
 if(!req.headers.get('Content-Type')?.startsWith('text/plain'))return error('ملف TXT فقط في تجربة كلاود');
 const contentLength=Number(req.headers.get('content-length')||0);
 if(contentLength>1000000)return error('الملف أكبر من حد التجربة 1MB',413);
 const bytes=await req.arrayBuffer();if(bytes.byteLength>1000000)return error('الملف أكبر من حد التجربة 1MB',413);
 const digest=await sha(bytes);const exportId=crypto.randomUUID();
 const already=await env.EVAL_DB.prepare('SELECT export_id FROM chat_exports WHERE customer_id=? AND source_id=? AND sha256=?')
    .bind(cid,source,digest).first();
 if(already)return ok({already_imported:true,export_id:already.export_id,new_messages:0});
 const messages=parseChat(new TextDecoder().decode(bytes));
 if(!messages.length)return error('لم نجد رسائل مؤرخة مدعومة');
 if(messages.length>80)return error('ملف التجربة يدعم حتى 80 رسالة في الدفعة');
 const key=`customers/${cid}/exports/${source.replace('/','_')}/${digest}.txt`;
 // R2 original is private; the DB transaction may fail AFTER upload; orphan cleanup is an admin task.
 await env.EVAL_FILES.put(key,bytes,{httpMetadata:{contentType:'text/plain; charset=utf-8'}});
 const steps=[env.EVAL_DB.prepare(`INSERT INTO chat_exports
 (export_id,customer_id,source_id,sha256,r2_key,filename_label,message_count,imported_at)
 VALUES(?,?,?,?,?,?,?,?)`).bind(exportId,cid,source,digest,key,'WhatsApp TXT',messages.length,now())];
 const seen=new Map();let added=0;
 for(const m of messages){
   const core=JSON.stringify([m.message_at,m.sender,m.body]);
   const occurrence=(seen.get(core)||0)+1;seen.set(core,occurrence);
   const fingerprint=await sha(enc.encode(core+'\u0000'+occurrence));
   const mid=(await sha(enc.encode(cid+'\u0000'+source+'\u0000'+fingerprint))).slice(0,24);
   // OR IGNORE is only used for the message unique key; export row is not silently ignored.
   steps.push(env.EVAL_DB.prepare(`INSERT OR IGNORE INTO messages
    (message_id,customer_id,source_id,fingerprint,message_at,sender_label,message_text,export_id,created_at)
    VALUES(?,?,?,?,?,?,?,?,?)`).bind(mid,cid,source,fingerprint,m.message_at,m.sender,m.body,exportId,now()));
 }
 const existing=await env.EVAL_DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE customer_id=?').bind(cid).first();
 const batch=await env.EVAL_DB.batch(steps);
 added=batch.slice(1).reduce((n,x)=>n+(x.meta?.changes||0),0);
 return ok({export_id:exportId,total_in_export:messages.length,new_messages:added,
  already_imported:false,source_id:source,coverage_total_approx:(existing?.n||0)+added},201);
}

export default {
 async fetch(req,env){
  const url=new URL(req.url),path=url.pathname,method=req.method;
  if(method==='GET'&&path==='/')return staticResponse(UI_HTML,'text/html; charset=utf-8');
  if(method==='GET'&&path==='/ui.css')return staticResponse(UI_CSS,'text/css; charset=utf-8');
  if(method==='GET'&&path==='/ui.js')return staticResponse(UI_JS,'text/javascript; charset=utf-8');
  if(method==='GET'&&path==='/health')return ok({service:'matbagy-evaluations-pilot',trendos_connected:false});
  if(!env.MATBAGY_ADMIN_TOKEN||!env.EVAL_DB||!env.EVAL_FILES)return error('خدمة التجربة غير مهيأة بعد',503);
  // A reader must not accidentally become an admin through duplicated secrets.
  if(env.MATBAGY_READER_TOKEN && env.MATBAGY_READER_TOKEN===env.MATBAGY_ADMIN_TOKEN)
    return error('إعدادات الصلاحيات غير آمنة',503);
  const role=authorizedRole(req,env);
  if(!role)return error('دخول غير مصرح به',401);
  if(!path.startsWith('/api/'))return error('المسار غير موجود',404);
  if(role==='reader'&&!readerAllowed(path,method))return error('ليس لديك صلاحية تنفيذ هذا الطلب',403);
  try{
   const db=env.EVAL_DB;
   if(method==='GET'&&path==='/api/customers'){
    const rows=await db.prepare('SELECT customer_id,display_name,created_at FROM customers ORDER BY created_at').all();
    return ok({customers:rows.results||[]});
   }
   if(method==='POST'&&path==='/api/customers'){
    const data=await bodyJson(req),cid=data.customer_id,name=String(data.display_name||'').trim();
    if(!isId(cid)||!name||name.length>150)return error('معرّف أو اسم عميل غير صالح');
    await db.prepare('INSERT INTO customers(customer_id,display_name,created_at) VALUES(?,?,?)').bind(cid,name,now()).run();
    return ok({customer_id:cid,created:true},201);
   }
   if(method==='POST'&&path==='/api/exports/txt')return await upload(req,env);

   if(method==='GET'&&path==='/api/pilot/customers'){
     const rows=await db.prepare("SELECT customer_id,display_name,created_at FROM customers WHERE customer_id LIKE 'pilot_%' ORDER BY created_at DESC LIMIT 100").all();
     return ok({customers:rows.results||[]});
   }
   // Pilot UI read endpoints. All routes require the admin bearer token above.
   if(method==='GET'&&path==='/api/employees'){
     const rows=await db.prepare("SELECT employee_id,display_name,created_at FROM employees WHERE employee_id LIKE 'pilot_%' ORDER BY created_at DESC LIMIT 100").all();
     return ok({employees:rows.results||[]});
   }
   if(method==='POST'&&path==='/api/employees'){
     const d=await bodyJson(req),eid=d.employee_id,name=String(d.display_name||'').trim();
     if(!/^pilot_[a-z0-9_-]{2,44}$/.test(eid||'')||!name||name.length>150)return error('موظف تجريبي غير صالح');
     await db.prepare('INSERT INTO employees(employee_id,display_name,created_at) VALUES(?,?,?)').bind(eid,name,now()).run();
     return ok({employee_id:eid,created:true},201);
   }
   const messageList=path.match(/^\/api\/customers\/([a-z0-9_-]{2,50})\/messages$/);
   if(method==='GET'&&messageList){
     const cid=messageList[1];if(!/^pilot_[a-z0-9_-]{2,44}$/.test(cid))return error('عرض الرسائل تجريبي فقط',403);
     if(!(await customerExists(db,cid)))return error('العميل غير موجود',404);
     const rows=await db.prepare('SELECT message_id,source_id,message_at,sender_label,message_text FROM messages WHERE customer_id=? ORDER BY message_at DESC LIMIT 80').bind(cid).all();
     return ok({customer_id:cid,messages:(rows.results||[]).reverse().map(m=>({...m,evidence_ref:m.source_id+'#'+m.message_id}))});
   }
   const factList=path.match(/^\/api\/customers\/([a-z0-9_-]{2,50})\/facts$/);
   if(method==='GET'&&factList){
     const cid=factList[1];if(!/^pilot_[a-z0-9_-]{2,44}$/.test(cid))return error('عرض الملاحظات تجريبي فقط',403);
     if(!(await customerExists(db,cid)))return error('العميل غير موجود',404);
     const rows=await db.prepare('SELECT fact_id,subject_type,subject_id,topic,statement,status,reviewed_by,reviewed_at,created_at,evidence_refs_json FROM profile_facts WHERE customer_id=? ORDER BY created_at DESC LIMIT 100').bind(cid).all();
     return ok({customer_id:cid,facts:(rows.results||[]).map(f=>({...f,evidence_refs:JSON.parse(f.evidence_refs_json),evidence_refs_json:undefined}))});
   }
   const actionList=path.match(/^\/api\/customers\/([a-z0-9_-]{2,50})\/actions$/);
   if(method==='GET'&&actionList){
     const cid=actionList[1];if(!/^pilot_[a-z0-9_-]{2,44}$/.test(cid))return error('عرض الاقتراحات تجريبي فقط',403);
     if(!(await customerExists(db,cid)))return error('العميل غير موجود',404);
     const rows=await db.prepare('SELECT action_id,kind,note,status,created_at FROM agent_actions WHERE customer_id=? ORDER BY created_at DESC LIMIT 50').bind(cid).all();
     return ok({customer_id:cid,actions:rows.results||[]});
   }

   const fp=path.match(/^\/api\/customers\/([a-z0-9_-]{2,50})\/fingerprint$/);
   if(method==='GET'&&fp){
    const cid=fp[1];if(!(await customerExists(db,cid)))return error('العميل غير موجود',404);
    const rows=await db.prepare("SELECT fact_id,topic,statement,evidence_refs_json,reviewed_at FROM profile_facts WHERE customer_id=? AND subject_type='customer' AND subject_id=? AND status='verified' ORDER BY reviewed_at DESC LIMIT 100").bind(cid,cid).all();
    return ok({customer_id:cid,verified_facts:(rows.results||[]).map(r=>({...r,evidence_refs:JSON.parse(r.evidence_refs_json),evidence_refs_json:undefined})),
      notice:'تعليمات الرد لا تستخدم نتائج AI غير المعتمدة'});
   }
   // Cross-chat contract: GET latest private snapshot; append an approved one with CAS.
   const profile=path.match(/^\/api\/customers\/([a-z0-9_-]{2,50})\/profile-snapshots$/);
   const latest=path.match(/^\/api\/customers\/([a-z0-9_-]{2,50})\/profile-snapshots\/latest$/);
   if(method==='GET'&&latest){
    const cid=latest[1];if(!(await customerExists(db,cid)))return error('العميل غير موجود',404);
    const row=await db.prepare('SELECT version,playbook_json,approved_fact_ids_json,request_id,created_at,reviewer FROM customer_profile_versions WHERE customer_id=? ORDER BY version DESC LIMIT 1').bind(cid).first();
    if(!row)return ok({customer_id:cid,version:0,profile:null,approved_fact_ids:[]});
    return ok({customer_id:cid,version:row.version,profile:JSON.parse(row.playbook_json),
      approved_fact_ids:JSON.parse(row.approved_fact_ids_json),reviewer:row.reviewer,created_at:row.created_at});
   }
   if(method==='POST'&&profile){
    const cid=profile[1];if(!(await customerExists(db,cid)))return error('العميل غير موجود',404);
    const data=await bodyJson(req),expected=data.expected_version,reviewer=String(data.reviewer||'').trim();
    if(!Number.isSafeInteger(expected)||expected<0||expected>1000000 || !reviewer||reviewer.length>80 ||
      !/^[a-z0-9][a-z0-9_-]{7,79}$/.test(data.request_id||''))return error('الإصدار أو المراجع أو معرّف الطلب غير صالح');
    const playbook=makePlaybook(data.profile);
    const factIds=await approvedFacts(db,cid,data.approved_fact_ids);
    const serialized=JSON.stringify({playbook,approved_fact_ids:factIds,expected_version:expected});
    const hash=await sha(enc.encode(serialized));
    const old=await db.prepare('SELECT version,content_sha256 FROM customer_profile_versions WHERE customer_id=? AND request_id=?').bind(cid,data.request_id).first();
    if(old)return old.content_sha256===hash ? ok({customer_id:cid,version:old.version,already_saved:true}) : error('معرّف الطلب سبق استخدامه بمحتوى مختلف',409);
    const t=now(),version=expected+1;
    const result=await db.prepare(`INSERT INTO customer_profile_versions
     (customer_id,version,request_id,content_sha256,playbook_json,approved_fact_ids_json,reviewer,created_at)
     SELECT ?,?,?,?,?,?,?,? WHERE COALESCE((SELECT MAX(version) FROM customer_profile_versions WHERE customer_id=?),0)=?`)
     .bind(cid,version,data.request_id,hash,JSON.stringify(playbook),JSON.stringify(factIds),reviewer,t,cid,expected).run();
    if(result.meta?.changes!==1)return error('نسخة البصمة تغيرت؛ أعد قراءة أحدث إصدار قبل التحديث',409);
    return ok({customer_id:cid,version,already_saved:false,external_write:false},201);
   }
   if(method==='POST'&&path==='/api/profile/facts'){
    const d=await bodyJson(req),cid=d.customer_id,typ=d.subject_type,sid=d.subject_id;
    if(!isId(cid)||!(await customerExists(db,cid))||!['customer','employee'].includes(typ)||!isId(sid))return error('هوية غير صالحة');
    if(typ==='customer'&&sid!==cid)return error('ملف عميل آخر مرفوض');
    if(typ==='employee'&&!(await db.prepare('SELECT employee_id FROM employees WHERE employee_id=?').bind(sid).first()))return error('الموظف غير معروف');
    if(!TOPICS.has(d.topic)||(STAFF_TOPICS.has(d.topic)!==(typ==='employee')))return error('نوع ملاحظة لا يطابق الطرف');
    const statement=String(d.statement||'').trim();if(statement.length<8||statement.length>900)return error('وصف الملاحظة غير صالح');
    const refs=await validateRefs(db,cid,d.evidence_refs);const id=crypto.randomUUID();
    await db.prepare(`INSERT INTO profile_facts(fact_id,customer_id,subject_type,subject_id,topic,statement,source_type,evidence_refs_json,status,created_at)
     VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(id,cid,typ,sid,d.topic,statement,'observed',JSON.stringify(refs),'candidate',now()).run();
    return ok({fact_id:id,status:'candidate'},201);
   }
   const approve=path.match(/^\/api\/profile\/facts\/([0-9a-f-]{36})\/review$/);
   if(method==='POST'&&approve){
    const data=await bodyJson(req),cid=data.customer_id,reviewer=String(data.reviewer||'').trim();
    if(!isId(cid)||!reviewer||reviewer.length>120||!['verified','disputed'].includes(data.decision))return error('مراجعة غير صالحة');
    const fact=await db.prepare('SELECT status,evidence_refs_json FROM profile_facts WHERE fact_id=? AND customer_id=?').bind(approve[1],cid).first();
    if(!fact||fact.status!=='candidate')return error('ملاحظة سبق مراجعتها أو غير موجودة',409);
    if(data.decision==='verified')await validateRefs(db,cid,JSON.parse(fact.evidence_refs_json));
    const result=await db.prepare("UPDATE profile_facts SET status=?,reviewed_by=?,reviewed_at=? WHERE fact_id=? AND customer_id=? AND status='candidate'")
         .bind(data.decision,reviewer,now(),approve[1],cid).run();
    if(result.meta?.changes!==1)return error('تغيّرت حالة الملاحظة أثناء المراجعة',409);
    return ok({fact_id:approve[1],status:data.decision});
   }
   if(method==='POST'&&path==='/api/actions'){
    const data=await bodyJson(req),cid=data.customer_id;
    if(!isId(cid)||!(await customerExists(db,cid)))return error('العميل غير معروف');
    if(!ACTIONS.has(data.kind))return error('الأمر ليس ضمن القائمة المسموحة');
    const note=String(data.note||'').trim();if(note.length<8||note.length>700)return error('سبب الأمر غير صالح');
    const refs=await validateRefs(db,cid,data.evidence_refs),id=crypto.randomUUID();
    await db.prepare(`INSERT INTO agent_actions(action_id,customer_id,kind,note,evidence_refs_json,status,created_at)
     VALUES(?,?,?,?,?,?,?)`).bind(id,cid,data.kind,note,JSON.stringify(refs),'awaiting_review',now()).run();
    return ok({action_id:id,status:'awaiting_review',external_write:false},201);
   }
   return error('المسار غير موجود',404);
  }catch(err){
   if(/UNIQUE constraint failed/i.test(String(err)))return error('تعارض إصدار أو معرّف طلب؛ اقرأ أحدث بصمة قبل إعادة المحاولة',409);
   // Do not leak SQL, tokens, raw messages or stack traces to the caller.
   const publicErrors=['حجم البيانات تجاوز الحد المسموح','صيغة JSON غير صالحة','الدليل مطلوب (1-8 رسائل)',
       'أدلة مكررة','مرجع دليل غير صالح','الدليل غير موجود داخل ملف هذا العميل'];
   const msg=String(err?.message||'');
   return error(publicErrors.includes(msg)?msg:'تعذّر إتمام الطلب؛ لم يتم إعلان نجاحه',400);
  }
 }
};