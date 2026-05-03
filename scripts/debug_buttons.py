"""Debug list/quote buttons and color picker"""
import sys, io, base64
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1400, "height": 900})

    # Login
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

    # Type some text
    page.locator(".ProseMirror").click()
    page.keyboard.type("Test bullet list", delay=10)
    page.keyboard.press("Control+A")
    page.wait_for_timeout(100)

    # Click bullet list button
    btn = page.locator('button[data-tb-button="Danh sách gạch đầu dòng"]').first
    print(f"Bullet list button found: {btn.count() > 0}")
    print(f"Button visible: {btn.is_visible()}")
    print(f"Button disabled: {btn.is_disabled()}")
    btn.click()
    page.wait_for_timeout(300)

    html = page.evaluate("() => document.querySelector('.ProseMirror')?.innerHTML ?? ''")
    print(f"After bullet click HTML: {html[:300]}")
    print(f"Has <ul>: {'<ul>' in html}")

    page.screenshot(path="scripts/playwright/screenshots/debug_after_bullet.png", full_page=True)

    # Now test color picker width
    page.locator(".ProseMirror").click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    page.keyboard.type("Color test", delay=10)
    page.keyboard.press("Control+A")

    color_btn = page.locator('button[title="Màu chữ"]').first
    color_btn.click()
    page.wait_for_timeout(300)

    page.screenshot(path="scripts/playwright/screenshots/debug_color_picker.png", full_page=True)

    # Get color picker dimensions
    picker = page.locator(".grid.grid-cols-5").first
    if picker.count() > 0:
        box = picker.bounding_box()
        print(f"Color picker dimensions: {box}")
        # Count visible color buttons
        color_btns = page.locator(".grid.grid-cols-5 button").all()
        print(f"Color buttons count: {len(color_btns)}")
        for cb in color_btns[:5]:
            cbox = cb.bounding_box()
            print(f"  Button box: {cbox}")

    browser.close()
    print("Done")
