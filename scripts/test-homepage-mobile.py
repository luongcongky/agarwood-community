"""Test trang chủ ở mobile — kiểm lỗi console, network fail, layout overflow."""
from playwright.sync_api import sync_playwright

URL = "http://localhost:3000"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},  # iPhone 14
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        )
        page = ctx.new_page()

        console_msgs, page_errors, failed_requests = [], [], []

        def on_console(msg):
            if msg.type in ("error", "warning"):
                console_msgs.append(f"[{msg.type}] {msg.text}")

        def on_request_failed(req):
            failed_requests.append(f"{req.method} {req.url} — {req.failure}")

        page.on("console", on_console)
        page.on("pageerror", lambda e: page_errors.append(str(e)))
        page.on("requestfailed", on_request_failed)

        print(f"📱 Loading {URL} (iPhone 14 viewport)...")
        try:
            resp = page.goto(URL, wait_until="networkidle", timeout=60_000)
            print(f"   HTTP {resp.status if resp else '?'}")
        except Exception as e:
            print(f"   ❌ Navigation failed: {e}")
            browser.close()
            return

        # Check layout
        print("\n📐 Layout checks:")
        # 1. Horizontal overflow?
        overflow_x = page.evaluate("""() => {
            const body = document.body;
            const html = document.documentElement;
            return {
                scrollWidth: Math.max(body.scrollWidth, html.scrollWidth),
                clientWidth: html.clientWidth,
                bodyScrollWidth: body.scrollWidth,
                windowInnerWidth: window.innerWidth,
            };
        }""")
        print(f"   viewport: {overflow_x['windowInnerWidth']}px")
        print(f"   body.scrollWidth: {overflow_x['bodyScrollWidth']}px")
        if overflow_x["bodyScrollWidth"] > overflow_x["windowInnerWidth"] + 1:
            print(f"   ⚠ OVERFLOW X: body {overflow_x['bodyScrollWidth']}px > viewport {overflow_x['windowInnerWidth']}px")

        # 2. Find elements overflowing horizontally
        offenders = page.evaluate("""() => {
            const results = [];
            const vw = window.innerWidth;
            const all = document.querySelectorAll('*');
            for (const el of all) {
                const r = el.getBoundingClientRect();
                if (r.width > vw + 1 || r.right > vw + 1) {
                    const tag = el.tagName.toLowerCase();
                    const cls = (el.className || '').toString().slice(0, 80);
                    results.push(`${tag}${cls ? '.' + cls.replace(/\\s+/g, '.') : ''} | width=${Math.round(r.width)} right=${Math.round(r.right)}`);
                    if (results.length >= 10) break;
                }
            }
            return results;
        }""")
        if offenders:
            print(f"   ⚠ Elements vượt viewport ({len(offenders)}):")
            for o in offenders:
                print(f"     • {o}")
        else:
            print("   ✓ Không có element nào tràn ngang")

        # 3. Check critical elements loaded
        critical = {
            "navbar": "header",
            "hero section": "section:has(h2)",
            "footer": "footer",
        }
        for name, sel in critical.items():
            try:
                el = page.locator(sel).first
                visible = el.is_visible(timeout=2000)
                print(f"   {'✓' if visible else '✗'} {name}: {'visible' if visible else 'NOT visible'}")
            except Exception:
                print(f"   ✗ {name}: không tìm thấy")

        # 4. Screenshots
        page.screenshot(path="/tmp/homepage-mobile-top.png")
        print("\n📸 Screenshot top: /tmp/homepage-mobile-top.png")

        # Scroll to bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(500)
        page.screenshot(path="/tmp/homepage-mobile-bottom.png")
        print("📸 Screenshot bottom: /tmp/homepage-mobile-bottom.png")

        # Full page
        page.screenshot(path="/tmp/homepage-mobile-full.png", full_page=True)
        print("📸 Screenshot full: /tmp/homepage-mobile-full.png")

        # Summary
        print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"🔍 Console errors/warnings: {len(console_msgs)}")
        for m in console_msgs[:10]:
            print(f"   {m}")

        print(f"\n💥 Page errors (uncaught JS): {len(page_errors)}")
        for m in page_errors[:10]:
            print(f"   {m}")

        print(f"\n🌐 Failed network requests: {len(failed_requests)}")
        for m in failed_requests[:10]:
            print(f"   {m}")

        browser.close()

if __name__ == "__main__":
    run()
