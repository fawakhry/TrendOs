TrendOS V1874 Clean Login Fix

ارفع الملفات الموجودة هنا على TrendOS repo فقط.

الملفات المهمة:
- index.html
- app.js
- config.js
- styles.css
- matbagy_theme_v1860.css
- matbagy_theme_v1860.js
- trendos_login_rescue_v1874.js

بعد الرفع افتح المنصة بالرابط مع:
?v=trendos-v1874-clean-login-fix
ثم Ctrl + Shift + R.

سبب الإصلاح: ملف app.js في النسخة المرفوعة كان به Syntax Error بسبب سطر Regex مكسور، وده كان موقف تحميل البرنامج بعد شاشة الدخول.
