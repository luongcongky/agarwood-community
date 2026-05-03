"""Debug: test list/quote buttons with realistic user flow"""
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

    # Scenario 1: Type text, DON'T select, just put cursor at end, then click bullet
    print("=== Scenario 1: cursor at end, no selection ===")
    page.locator(".ProseMirror").click()
    page.keyboard.type("Line one", delay=10)
    page.wait_for_timeout(200)
    # Don't select — just click bullet button
    page.locator('button[data-tb-button="Danh sách gạch đầu dòng"]').first.click()
    page.wait_for_timeout(300)
    html = page.evaluate("() => document.querySelector('.ProseMirror')?.innerHTML ?? ''")
    print(f"  Has <ul>: {'<ul>' in html}")
    print(f"  HTML: {html[:200]}")

    # Scenario 2: Click in empty editor, then click bullet, then type
    print("\n=== Scenario 2: empty editor, click bullet first ===")
    page.locator(".ProseMirror").click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    page.wait_for_timeout(100)
    page.locator('button[data-tb-button="Danh sách gạch đầu dòng"]').first.click()
    page.wait_for_timeout(300)
    page.keyboard.type("Should be bulleted", delay=10)
    page.wait_for_timeout(200)
    html = page.evaluate("() => document.querySelector('.ProseMirror')?.innerHTML ?? ''")
    print(f"  Has <ul>: {'<ul>' in html}")
    print(f"  HTML: {html[:200]}")

    # Scenario 3: Ordered list
    print("\n=== Scenario 3: ordered list ===")
    page.locator(".ProseMirror").click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    page.wait_for_timeout(100)
    page.keyboard.type("Numbered item", delay=10)
    page.keyboard.press("Control+A")
    page.locator('button[data-tb-button="Danh sách đánh số"]').first.click()
    page.wait_for_timeout(300)
    html = page.evaluate("() => document.querySelector('.ProseMirror')?.innerHTML ?? ''")
    print(f"  Has <ol>: {'<ol>' in html}")
    print(f"  HTML: {html[:200]}")

    # Scenario 4: Blockquote
    print("\n=== Scenario 4: blockquote ===")
    page.locator(".ProseMirror").click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    page.wait_for_timeout(100)
    page.keyboard.type("Quote text", delay=10)
    page.keyboard.press("Control+A")
    page.locator('button[data-tb-button="Trích dẫn"]').first.click()
    page.wait_for_timeout(300)
    html = page.evaluate("() => document.querySelector('.ProseMirror')?.innerHTML ?? ''")
    print(f"  Has <blockquote>: {'<blockquote>' in html}")
    print(f"  HTML: {html[:200]}")

    # Check if buttons show active state
    print("\n=== Active state check ===")
    for name, title in [("Bullet", "Danh sách gạch đầu dòng"), ("Ordered", "Danh sách đánh số"), ("Quote", "Trích dẫn")]:
        btn = page.locator(f'button[data-tb-button="{title}"]').first
        classes = btn.get_attribute("class") or ""
        print(f"  {name} classes: {classes[:100]}")

    # Screenshot color picker
    print("\n=== Color picker width test ===")
    page.locator(".ProseMirror").click()
    page.keyboard.press("Control+A")
    page.locator('button[title="Màu chữ"]').first.click()
    page.wait_for_timeout(300)
    page.screenshot(path="scripts/playwright/screenshots/debug_color_fixed.png", full_page=True)

    picker = page.locator(".grid.grid-cols-5").first
    if picker.count() > 0:
        box = picker.bounding_box()
        print(f"  Picker box: {box}")

    browser.close()
    print("\nDone")
