"""Check if list/blockquote CSS styles are actually applied"""
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

    # Create bullet list
    pm = page.locator(".ProseMirror")
    pm.click()
    page.keyboard.type("Item A", delay=10)
    page.keyboard.press("Enter")
    page.keyboard.type("Item B", delay=10)
    page.keyboard.press("Control+A")
    page.locator('button[data-tb-button="Danh sách gạch đầu dòng"]').first.click()
    page.wait_for_timeout(500)

    # Check computed styles on the <ul> element
    styles = page.evaluate("""() => {
        const ul = document.querySelector('.ProseMirror ul');
        if (!ul) return { error: 'No <ul> found' };
        const cs = window.getComputedStyle(ul);
        return {
            listStyleType: cs.listStyleType,
            paddingLeft: cs.paddingLeft,
            marginLeft: cs.marginLeft,
            display: cs.display,
        };
    }""")
    print(f"UL computed styles: {styles}")

    # Check <li> styles
    li_styles = page.evaluate("""() => {
        const li = document.querySelector('.ProseMirror li');
        if (!li) return { error: 'No <li> found' };
        const cs = window.getComputedStyle(li);
        return {
            listStyleType: cs.listStyleType,
            display: cs.display,
            paddingLeft: cs.paddingLeft,
        };
    }""")
    print(f"LI computed styles: {li_styles}")

    # Check if prose class is on the container
    prose_check = page.evaluate("""() => {
        const container = document.querySelector('.ProseMirror')?.closest('.prose');
        return {
            hasProseParent: !!container,
            proseClasses: container?.className?.substring(0, 200) ?? 'none',
        };
    }""")
    print(f"Prose check: {prose_check}")

    # Now check blockquote
    pm.click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    page.keyboard.type("Quoted text here", delay=10)
    page.keyboard.press("Control+A")
    page.locator('button[data-tb-button="Trích dẫn"]').first.click()
    page.wait_for_timeout(500)

    bq_styles = page.evaluate("""() => {
        const bq = document.querySelector('.ProseMirror blockquote');
        if (!bq) return { error: 'No <blockquote> found' };
        const cs = window.getComputedStyle(bq);
        return {
            borderLeft: cs.borderLeft,
            paddingLeft: cs.paddingLeft,
            marginLeft: cs.marginLeft,
            fontStyle: cs.fontStyle,
            color: cs.color,
        };
    }""")
    print(f"Blockquote computed styles: {bq_styles}")

    # Take zoomed screenshot of editor area only
    editor_el = page.locator(".rounded-xl.border.bg-white.shadow-sm").last
    editor_el.screenshot(path="scripts/playwright/screenshots/debug_list_visual.png")

    browser.close()
    print("Done")
