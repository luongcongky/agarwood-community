"""Debug active state of toolbar buttons"""
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

    # Type and apply bold
    page.locator(".ProseMirror").click()
    page.keyboard.type("Bold text", delay=10)
    page.keyboard.press("Control+A")
    page.wait_for_timeout(100)

    # Apply bold
    page.locator('button[data-tb-button="In đậm (Ctrl+B)"]').first.click()
    page.wait_for_timeout(500)  # Wait longer for state to update

    bold_btn = page.locator('button[data-tb-button="In đậm (Ctrl+B)"]').first
    classes = bold_btn.get_attribute("class") or ""
    print(f"Bold button classes after toggle: {classes}")
    print(f"Has active class: {'bg-brand-700' in classes}")

    html = page.evaluate("() => document.querySelector('.ProseMirror')?.innerHTML ?? ''")
    print(f"HTML has <strong>: {'<strong>' in html}")

    # Apply bullet list
    page.locator(".ProseMirror").click()
    page.keyboard.press("Control+A")
    page.locator('button[data-tb-button="Danh sách gạch đầu dòng"]').first.click()
    page.wait_for_timeout(500)

    bullet_btn = page.locator('button[data-tb-button="Danh sách gạch đầu dòng"]').first
    classes2 = bullet_btn.get_attribute("class") or ""
    print(f"\nBullet button classes after toggle: {classes2}")
    print(f"Has active class: {'bg-brand-700' in classes2}")

    html2 = page.evaluate("() => document.querySelector('.ProseMirror')?.innerHTML ?? ''")
    print(f"HTML has <ul>: {'<ul>' in html2}")

    # Check if the issue is that useEditorState is not updating
    # Let's check editor.isActive directly
    is_bold = page.evaluate("() => { const pm = document.querySelector('.ProseMirror'); if (!pm || !pm.pmViewDesc) return 'no-view'; try { return pm.pmViewDesc.view.state.doc.firstChild?.content?.firstChild?.marks?.some(m => m.type.name === 'bold') } catch(e) { return e.message } }")
    print(f"\nDirect mark check (bold): {is_bold}")

    page.screenshot(path="scripts/playwright/screenshots/debug_active_state.png", full_page=True)

    browser.close()
    print("Done")
