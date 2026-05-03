"""Take a screenshot of the editor toolbar at /admin/tin-tuc/moi"""
import sys, io
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
    print("Logged in")

    # Navigate to editor
    page.goto("http://localhost:3000/admin/tin-tuc/moi")
    page.wait_for_load_state("networkidle")
    page.wait_for_selector(".ProseMirror", timeout=15000)
    page.wait_for_timeout(500)
    print("Editor loaded")

    # Full page screenshot
    page.screenshot(path="scripts/playwright/screenshots/toolbar_proof_full.png", full_page=True)
    print("Full page screenshot saved")

    # Toolbar-only screenshot — find the toolbar container
    toolbar = page.locator(".sticky.top-0.z-20").first
    if toolbar.count() > 0:
        toolbar.screenshot(path="scripts/playwright/screenshots/toolbar_proof_closeup.png")
        print("Toolbar closeup screenshot saved")
    else:
        print("Could not find toolbar element, trying alternate selector")
        # Try the whole editor wrapper
        editor_wrapper = page.locator(".rounded-xl.border.bg-white.shadow-sm").last
        if editor_wrapper.count() > 0:
            editor_wrapper.screenshot(path="scripts/playwright/screenshots/toolbar_proof_closeup.png")
            print("Editor wrapper screenshot saved")

    browser.close()
    print("Done")
