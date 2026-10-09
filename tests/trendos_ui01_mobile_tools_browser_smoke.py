"""UI-001 browser-only regression: isolated demo surface, never connects to TrendOS APIs.

Install for CI:
    python -m pip install playwright==1.56.0
    python -m playwright install chromium
    python tests/trendos_ui01_mobile_tools_browser_smoke.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
JS = (ROOT / "trendos-ui01-mobile-tools.js").read_text(encoding="utf-8")
CSS = (ROOT / "trendos-ui01-mobile-tools.css").read_text(encoding="utf-8")

# Intentional legacy-theme precedence fixture: the current Matbagy theme applies
# this rule !important below 980px. UI-001 must override it below 721px.
HTML = """<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}
body{margin:0;padding:12px;font-family:Tahoma,Arial,sans-serif}
.hidden{display:none!important}
.topbar{display:flex;gap:16px;justify-content:space-between;padding:16px;border:1px solid #ddd}
.top-actions{display:flex;gap:8px;flex-wrap:wrap}
.top-actions button{font-size:14px;min-height:44px;background:white;border:1px solid #ccc}
@media(max-width:980px){
.topbar{display:block}
.top-actions{display:grid!important;grid-template-columns:1fr!important;margin-top:12px!important}
.top-actions button{width:100%!important}
}
</style></head><body>
<section id="entryView">بوابة العملاء دون تعديل</section>
<section id="mainView"><header class="topbar">
<div><h2>موظف تجريبي</h2><p>لا API ولا بيانات تشغيلية</p></div>
<div class="top-actions">
<button id="refreshBtn">تحديث الآن</button>
<button id="remoteFilesBtn">ملفات مطبعجي</button>
<button id="matbagySheetsBtn" class="hidden">أداة محجوبة</button>
<button id="matbagyRotetBtn">روتيت</button>
<button id="matbagyNoteBtn">نوت مطبعجي</button>
<button id="accountingBtn">حسابات</button>
<button id="logoutBtn">خروج</button>
<div class="matbagy-theme-switcher hidden">Theme placeholder</div>
</div></header></section>
<script>
window.calls = [];
document.querySelectorAll(".top-actions button").forEach(function(btn){
  btn.addEventListener("click", function(){window.calls.push(btn.id);});
});
</script>
</body></html>"""


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        try:
            for width in (360, 390, 690, 720, 721, 1280):
                page = browser.new_page(viewport={"width": width, "height": 960})
                errors = []
                page.on("pageerror", lambda err: errors.append(str(err)))
                # About:blank only: cannot send orders, credentials or tracking.
                page.set_content(HTML)
                page.add_style_tag(content=CSS)
                page.add_script_tag(content=JS)
                toggle = page.locator(".tm-ui01-toggle")
                tools = page.locator(".top-actions")
                assert toggle.count() == 1, ("duplicate/missing toggle", width)
                assert tools.evaluate("(x) => x.children.length") == 9
                assert page.locator("#matbagySheetsBtn").is_hidden(), width
                assert page.locator("#entryView").inner_text() == "بوابة العملاء دون تعديل"
                if width <= 720:
                    assert toggle.is_visible(), width
                    assert page.locator("#refreshBtn").is_hidden(), width
                    toggle.click()
                    assert toggle.get_attribute("aria-expanded") == "true"
                    assert page.locator("#refreshBtn").is_visible(), width
                    assert page.locator("#matbagySheetsBtn").is_hidden(), width
                    # Regression: legacy-theme 1fr !important previously won the cascade.
                    columns = tools.evaluate("(e) => getComputedStyle(e).gridTemplateColumns")
                    assert len(columns.split()) == 2, (width, columns)
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), width
                    page.locator("#refreshBtn").click()
                    assert page.evaluate('window.calls.filter(x=>x==="refreshBtn").length') == 1
                    assert toggle.get_attribute("aria-expanded") == "false"
                    toggle.click()
                    page.keyboard.press("Escape")
                    assert toggle.get_attribute("aria-expanded") == "false"
                    assert toggle.evaluate("(x)=>document.activeElement===x"), width
                    toggle.click()
                    page.locator("#mainView").evaluate("(x)=>x.classList.add('hidden')")
                    assert toggle.get_attribute("aria-expanded") == "false"
                else:
                    assert toggle.is_hidden(), width
                    assert page.locator("#refreshBtn").is_visible(), width
                    assert page.locator("#matbagySheetsBtn").is_hidden(), width
                assert not errors, (width, errors)
                print(f"UI-001 BROWSER PASS {width}px")
                page.close()
        finally:
            browser.close()


if __name__ == "__main__":
    main()
