"""Visual proof: list, ordered list, blockquote, headings all styled correctly"""
import sys, io
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from playwright.sync_api import sync_playwright

def click_tb(page, title):
    page.locator(f'button[data-tb-button="{title}"]').first.click()
    page.wait_for_timeout(150)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1400, "height": 900})

    page.goto("http://localhost:3000/login")
    page.wait_for_load_state("networkidle")
    page.fill("input#email", "admin@hoitramhuong.vn")
    page.fill("input#password", "Demo@123")
    page.click('button[type="submit"]')
    page.wait_for_url(lambda u: "/login" not in u, timeout=15000)
    page.wait_for_load_state("networkidle")

    page.goto("http://localhost:3000/admin/tin-tuc/moi")
    page.wait_for_load_state("networkidle")
    page.wait_for_selector(".ProseMirror", timeout=15000)
    page.wait_for_timeout(500)

    pm = page.locator(".ProseMirror")
    pm.click()

    # === Build rich content ===

    # Bullet list
    page.keyboard.type("Apple", delay=5)
    page.keyboard.press("Enter")
    page.keyboard.type("Banana", delay=5)
    page.keyboard.press("Enter")
    page.keyboard.type("Cherry", delay=5)
    page.keyboard.press("Control+A")
    click_tb(page, "Danh sách gạch đầu dòng")
    page.wait_for_timeout(200)

    # Exit list and add space
    page.keyboard.press("Control+End")
    page.keyboard.press("Enter")
    page.keyboard.press("Enter")
    page.wait_for_timeout(100)

    # Ordered list
    page.keyboard.type("Buoc 1", delay=5)
    page.keyboard.press("Enter")
    page.keyboard.type("Buoc 2", delay=5)
    page.keyboard.press("Enter")
    page.keyboard.type("Buoc 3", delay=5)
    # Select last 3 lines
    page.keyboard.press("Home")
    page.keyboard.press("Shift+ArrowUp")
    page.keyboard.press("Shift+ArrowUp")
    page.keyboard.press("Shift+Home")
    click_tb(page, "Danh sách đánh số")
    page.wait_for_timeout(200)

    # Exit list
    page.keyboard.press("Control+End")
    page.keyboard.press("Enter")
    page.keyboard.press("Enter")
    page.wait_for_timeout(100)

    # Blockquote
    page.keyboard.type("Day la mot cau trich dan quan trong.", delay=5)
    page.keyboard.press("Home")
    page.keyboard.press("Shift+End")
    click_tb(page, "Trích dẫn")
    page.wait_for_timeout(200)

    # Exit quote
    page.keyboard.press("Control+End")
    page.keyboard.press("Enter")
    page.keyboard.press("Enter")
    page.wait_for_timeout(100)

    # Horizontal rule
    click_tb(page, "Đường kẻ ngang")
    page.wait_for_timeout(200)

    # Deselect
    pm.click()
    page.wait_for_timeout(300)

    # Take screenshots
    page.screenshot(path="scripts/playwright/screenshots/proof_formats_full.png", full_page=True)

    editor_area = page.locator(".lg\\:col-span-2").first
    if editor_area.count() > 0:
        editor_area.screenshot(path="scripts/playwright/screenshots/proof_formats_editor.png")
    else:
        pm.screenshot(path="scripts/playwright/screenshots/proof_formats_editor.png")

    browser.close()
    print("Done")
