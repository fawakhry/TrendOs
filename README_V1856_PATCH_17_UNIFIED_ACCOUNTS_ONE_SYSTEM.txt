Matbagy Egypt V1856 Patch 17 - Unified Accounts One System

الهدف:
- ربط برنامج مطبعجي وبرنامج الحسابات في نظام واحد.
- برنامج الحسابات يستخدم نفس TREND_API_URL الخاص بمطبعجي.
- لا توجد خانة Web App منفصلة داخل الحسابات لتجنب اللخبطة.
- الحسابات تفتح من نفس شاشة الموظف بنفس الجلسة والصلاحيات.

التعديلات:
1) app.js
- accountsToolUrl يرسل نفس رابط TREND_API_URL إلى الحسابات داخل iframe.
- إضافة unifiedAccounts=1 في الرابط.

2) config.js
- إضافة MATBAGY_ACCOUNTS_UNIFIED_WITH_TRENDOS = true.
- إضافة MATBAGY_ACCOUNTS_API_URL = window.TREND_API_URL.

3) Trend_Accounts_V1857_Calculator_Linked.html
- صفحة الربط أصبحت "الربط الموحد بين مطبعجي والحسابات".
- لا يوجد إدخال يدوي لرابط Web App.
- يتم حفظ رابط مطبعجي تلقائياً من الرابط القادم من TrendOS.
- الرسائل أصبحت توضّح أن البرنامجين نظام واحد.

التركيب على GitHub:
- ارفع: index.html, app.js, styles.css, config.js, Trend_Accounts_V1857_Calculator_Linked.html
- افتح: https://fawakhry.github.io/TrendOs/?v=1856-patch17
- Ctrl + F5

Apps Script:
- استخدم نفس ملف Apps Script الحالي. لا تحتاج رابط حسابات منفصل.
- لو رفعت GS من Patch 16 قبل كده لا تحتاج تعديل جديد إلا لو عاوز إعادة نشر احتياطية.

علامة النجاح:
✅ Matbagy Egypt V1856 Patch 17 Applied Successfully - Accounts + TrendOS Unified In One System
