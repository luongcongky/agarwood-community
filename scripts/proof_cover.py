"""Screenshot: cover image file picker + preview modal"""
import sys, io, base64
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

    # 1. Screenshot: empty cover — should show dashed upload area
    page.screenshot(path="scripts/playwright/screenshots/cover_empty.png", full_page=True)

    # 2. Fill in form and select cover image
    page.fill('input[type="text"]', "Bai viet mau de xem truoc")
    page.wait_for_timeout(200)

    # Create a test image and select it as cover
    page.evaluate("""() => {
        const c = document.createElement('canvas');
        c.width = 800; c.height = 450;
        const ctx = c.getContext('2d');
        // Gradient background
        const g = ctx.createLinearGradient(0, 0, 800, 450);
        g.addColorStop(0, '#6B4226');
        g.addColorStop(1, '#D4A574');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 800, 450);
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Anh bia mau', 400, 240);
        window.__coverData = c.toDataURL('image/png');
    }""")
    data_url = page.evaluate("() => window.__coverData")
    b64 = data_url.split(",")[1]
    img_bytes = base64.b64decode(b64)

    cover_input = page.locator('input[type="file"][accept="image/*"]').first
    cover_input.set_input_files({
        "name": "cover-test.png",
        "mimeType": "image/png",
        "buffer": img_bytes,
    })
    page.wait_for_timeout(500)

    # 3. Screenshot: cover with preview
    page.screenshot(path="scripts/playwright/screenshots/cover_with_image.png", full_page=True)

    # 4. Type some content in editor
    pm = page.locator(".ProseMirror")
    pm.click()
    page.keyboard.type("Noi dung bai viet mau de xem truoc hien thi.", delay=5)
    page.wait_for_timeout(200)

    # 5. Click preview button
    page.locator("text=Xem trước bài viết").last.click()
    page.wait_for_timeout(500)

    # 6. Screenshot: preview modal
    page.screenshot(path="scripts/playwright/screenshots/cover_preview_modal.png", full_page=True)

    browser.close()
    print("Done")
