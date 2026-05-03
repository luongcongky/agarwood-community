"""Screenshot: full-page preview like public viewer"""
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

    # Fill title
    page.locator('input[type="text"]').first.fill("Hoi Tram Huong Viet Nam to chuc Dai hoi nhiem ky IV")

    # Set publish date
    page.locator('input[type="datetime-local"]').fill("2026-04-15T09:00")

    # Select cover image
    page.evaluate("""() => {
        const c = document.createElement('canvas');
        c.width = 1200; c.height = 675;
        const ctx = c.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 1200, 675);
        g.addColorStop(0, '#5C3D1E');
        g.addColorStop(1, '#B8860B');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1200, 675);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Dai hoi nhiem ky IV', 600, 320);
        ctx.font = '24px sans-serif';
        ctx.fillText('Hoi Tram Huong Viet Nam', 600, 380);
        window.__cover = c.toDataURL('image/jpeg', 0.8);
    }""")
    du = page.evaluate("() => window.__cover")
    ib = base64.b64decode(du.split(",")[1])
    page.locator('input[type="file"][accept="image/*"]').first.set_input_files({
        "name": "cover.jpg", "mimeType": "image/jpeg", "buffer": ib
    })
    page.wait_for_timeout(300)

    # Type rich content in editor
    pm = page.locator(".ProseMirror")
    pm.click()
    page.keyboard.type("Sang ngay 15/4/2026, Hoi Tram Huong Viet Nam da to chuc Dai hoi nhiem ky IV tai TP. Ho Chi Minh.", delay=3)
    page.keyboard.press("Enter")
    page.keyboard.press("Enter")
    page.keyboard.type("Cac noi dung chinh:", delay=3)
    page.keyboard.press("Enter")
    page.keyboard.type("Bau doi ngu Ban chap hanh moi", delay=3)
    page.keyboard.press("Enter")
    page.keyboard.type("Phuong huong hoat dong 2026-2031", delay=3)
    page.keyboard.press("Enter")
    page.keyboard.type("Ke hoach phat trien nganh tram huong", delay=3)
    # Select last 3 lines and make bullet list
    page.keyboard.press("Home")
    page.keyboard.press("Shift+ArrowUp")
    page.keyboard.press("Shift+ArrowUp")
    page.keyboard.press("Shift+Home")
    page.locator('button[data-tb-button="Danh sách gạch đầu dòng"]').first.click()
    page.wait_for_timeout(200)

    # Fill excerpt
    page.locator("textarea").first.fill("Hoi Tram Huong Viet Nam to chuc Dai hoi nhiem ky IV, bau Ban chap hanh moi va dinh huong phat trien 2026-2031.")

    page.wait_for_timeout(300)

    # Open preview
    page.locator("text=Xem trước bài viết").last.click()
    page.wait_for_timeout(500)

    # Screenshot top section
    page.screenshot(path="scripts/playwright/screenshots/fullpreview_top.png")

    # Scroll down to see more
    page.locator("main.flex-1.overflow-y-auto").first.evaluate("el => el.scrollTop = 400")
    page.wait_for_timeout(300)
    page.screenshot(path="scripts/playwright/screenshots/fullpreview_content.png")

    # Scroll to bottom
    page.locator("main.flex-1.overflow-y-auto").first.evaluate("el => el.scrollTop = el.scrollHeight")
    page.wait_for_timeout(300)
    page.screenshot(path="scripts/playwright/screenshots/fullpreview_bottom.png")

    browser.close()
    print("Done")
