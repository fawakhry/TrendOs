window.TREND_API_URL = "https://script.google.com/macros/s/AKfycbwGHOduL0BHvH-o4up9nbk1wYFi54D2KOnW1AFDigpBzyuAOTWzPfpSFPGSyFVj_fmTmg/exec";

// V1856 Patch 04 - رابط ملفات مطبعجي من خارج المطبعة عبر Cloudflare Tunnel.
// بعد تركيب Cloudflare Tunnel اجعل الرابط النهائي مثل: https://files.matbagy.com
window.MATBAGY_REMOTE_FILES_URL = "https://files.matbagy.com";

// احتياطي داخل شبكة المطبعة فقط لو لم يتم تفعيل الرابط الخارجي.
window.MATBAGY_FILE_SERVER_URL = "http://192.168.1.10:5050";

// رابط رفع العميل لملفات جاهزة للطباعة.
// الأفضل أن يكون نفس رابط ملفات مطبعجي، والعميل يدخل بيوزر محدود على فولدر طباعة ع الطاير فقط.
window.MATBAGY_FAST_PRINT_UPLOAD_URL = "https://files.matbagy.com";

// العملاء المسموح لهم بظهور زر رفع ملف جاهز للطباعة داخل بوابة العميل.
// اكتب كود الشات أو اسم العميل أو رقم الهاتف. مثال: ["diaa", "ضياء", "01000000000"]
window.MATBAGY_FAST_PRINT_ALLOWED_CUSTOMERS = ["diaa", "ضياء"];
