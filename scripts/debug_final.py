"""Final visual proof: list/quote buttons work + color picker fixed"""
import sys, io
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from playwright.sync_api import sync_playwright

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

    # Create content with bullet list
    pm = page.locator(".ProseMirror")
    pm.click()
    page.keyboard.type("Bullet item 1", delay=10)
    page.keyboard.press("Enter")
    page.keyboard.type("Bullet item 2", delay=10)
    page.keyboard.press("Enter")
    page.keyboard.type("Bullet item 3", delay=10)
    page.keyboard.press("Control+A")
    page.wait_for_timeout(100)

    # Apply bullet list
    page.locator('button[data-tb-button="Danh sách gạch đầu dòng"]').first.click()
    page.wait_for_timeout(500)

    # Keep cursor in the list to show active state
    pm.click()
    page.wait_for_timeout(300)

    page.screenshot(path="scripts/playwright/screenshots/proof_bullet_list.png", full_page=True)

    # Now quote
    pm.click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    page.keyboard.type("This is a quoted paragraph", delay=10)
    page.keyboard.press("Control+A")
    page.locator('button[data-tb-button="Trích dẫn"]').first.click()
    page.wait_for_timeout(500)
    pm.click()
    page.wait_for_timeout(300)

    page.screenshot(path="scripts/playwright/screenshots/proof_blockquote.png", full_page=True)

    # Color picker
    pm.click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    page.keyboard.type("Color picker test", delay=10)
    page.keyboard.press("Control+A")
    page.locator('button[title="Màu chữ"]').first.click()
    page.wait_for_timeout(300)

    page.screenshot(path="scripts/playwright/screenshots/proof_color_picker.png", full_page=True)

    browser.close()
    print("Screenshots saved")
