"""
Phase 2 smoke test — verify feed + post detail + comments:
  1. VIP login → /feed shows posts with comment links
  2. Click comment link → /bai-viet/:id loads
  3. Post comment → appears in list
  4. Like comment → toggle
  5. Delete comment → removed
"""
from __future__ import annotations

import io
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, Page, BrowserContext

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

BASE_URL = "http://localhost:3000"
VIP_EMAIL = "lienhe@baotram.vn"
VIP_PASSWORD = "Demo@123"
SCREENSHOT_DIR = Path(__file__).parent / "screenshots"
SCREENSHOT_DIR.mkdir(exist_ok=True)

passed = [0]
failed = [0]


def login(page: Page) -> None:
    page.set_default_timeout(120000)
    page.set_default_navigation_timeout(300000)
    # First page load is slow due to Turbopack compilation — use generous timeout
    page.goto(f"{BASE_URL}/login", timeout=300000)
    page.wait_for_selector("input#email", timeout=120000)
    page.fill("input#email", VIP_EMAIL)
    page.fill("input#password", VIP_PASSWORD)
    page.click('button[type="submit"]')
    for _ in range(60):
        page.wait_for_timeout(1000)
        if "/login" not in page.url:
            break
    try:
        page.wait_for_load_state("networkidle", timeout=30000)
    except Exception:
        pass


def check(label: str, ok: bool, details: str = "") -> None:
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {label}" + (f" -- {details}" if details else ""))
    if ok:
        passed[0] += 1
    else:
        failed[0] += 1


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx: BrowserContext = browser.new_context(viewport={"width": 1400, "height": 900})
        page = ctx.new_page()

        try:
            # Pre-warm critical routes via fetch (Turbopack cold-compile is slow)
            import urllib.request
            for warmup_path in ["/login", "/feed", "/feed/tao-bai"]:
                try:
                    urllib.request.urlopen(f"{BASE_URL}{warmup_path}", timeout=120)
                    print(f"  Warmed up {warmup_path}")
                except Exception as e:
                    print(f"  Warmup {warmup_path}: {e}")

            login(page)

            # === Step 0: Create a test post via /feed/tao-bai ===
            print("\n=== Step 0: Create test post ===")
            page.goto(f"{BASE_URL}/feed/tao-bai", wait_until="domcontentloaded", timeout=120000)
            try:
                page.wait_for_load_state("networkidle", timeout=60000)
            except Exception:
                pass

            # Fill title
            title_input = page.locator('input[placeholder*="Tiêu đề"]')
            test_title = f"Playwright test {int(page.evaluate('Date.now()'))}"
            title_input.fill(test_title)

            # Type some content in tiptap editor
            page.locator('.tiptap, [contenteditable="true"]').first.click()
            page.keyboard.type(
                "Day la bai viet test tu Playwright. " * 3 + "Noi dung du dai de pass validation.",
                delay=5,
            )
            page.wait_for_timeout(500)

            # Submit
            page.locator('button:has-text("Đăng bài")').click()
            # Wait for redirect back to /feed
            for _ in range(30):
                page.wait_for_timeout(1000)
                if "/tao-bai" not in page.url:
                    break
            try:
                page.wait_for_load_state("networkidle", timeout=30000)
            except Exception:
                pass
            check("Post created, redirected to feed", "/feed" in page.url and "/tao-bai" not in page.url)

            # === Step 1: Feed has comment links ===
            print("\n=== Step 1: Feed page ===")
            page.goto(f"{BASE_URL}/feed", wait_until="domcontentloaded", timeout=60000)
            try:
                page.wait_for_load_state("networkidle", timeout=30000)
            except Exception:
                pass
            page.screenshot(path=str(SCREENSHOT_DIR / "phase2_feed.png"), full_page=True)

            comment_links = page.locator('a[href^="/bai-viet/"]').count()
            check("Feed has comment links to /bai-viet/", comment_links > 0, f"found {comment_links}")

            if comment_links == 0:
                print("  SKIP: no posts found after creation, cannot test detail page")
                browser.close()
                return 1

            # Get first post detail link
            first_link = page.locator('a[href^="/bai-viet/"]').first
            href = first_link.get_attribute("href") or ""
            print(f"  First post link: {href}")

            # === Step 2: Navigate to post detail ===
            print("\n=== Step 2: Post detail page ===")
            page.goto(f"{BASE_URL}{href}", wait_until="domcontentloaded", timeout=60000)
            try:
                page.wait_for_load_state("networkidle", timeout=30000)
            except Exception:
                pass
            page.screenshot(path=str(SCREENSHOT_DIR / "phase2_detail.png"), full_page=True)

            has_back = page.locator('text=Quay lại cộng đồng').count() > 0
            check("Detail page has back link", has_back)

            has_comment_section = page.locator('text=Bình luận').count() > 0
            check("Detail page has comment section", has_comment_section)

            has_textarea = page.locator('textarea[placeholder*="bình luận"]').count() > 0
            check("Comment textarea visible (logged in)", has_textarea)

            # === Step 3: Post a comment ===
            print("\n=== Step 3: Post a comment ===")
            test_comment = f"Test comment Playwright {int(page.evaluate('Date.now()'))}"
            page.fill('textarea[placeholder*="bình luận"]', test_comment)
            page.click('button:has-text("Gửi")')
            page.wait_for_timeout(2000)

            page.screenshot(path=str(SCREENSHOT_DIR / "phase2_after_comment.png"), full_page=True)
            comment_visible = page.locator(f'text={test_comment}').count() > 0
            check("Comment appears after posting", comment_visible)

            # === Step 4: Like the comment ===
            print("\n=== Step 4: Like comment ===")
            like_btn = page.locator('button:has-text("Thích")').first
            if like_btn.count() > 0:
                like_btn.click()
                page.wait_for_timeout(500)
                liked = page.locator('button:has-text("Đã thích")').count() > 0
                check("Comment like toggles to 'Đã thích'", liked)
            else:
                check("Like button found", False)

            # === Step 5: Delete comment ===
            print("\n=== Step 5: Delete comment ===")
            page.evaluate('window.confirm = () => true')  # auto-confirm
            delete_btn = page.locator('button:has-text("Xóa")').first
            if delete_btn.count() > 0:
                delete_btn.click()
                page.wait_for_timeout(1000)
                comment_gone = page.locator(f'text={test_comment}').count() == 0
                check("Comment removed after delete", comment_gone)
            else:
                check("Delete button found", False)

        except Exception as e:
            print(f"FATAL: {e}")
            try:
                page.screenshot(path=str(SCREENSHOT_DIR / "phase2_fatal.png"), full_page=True, timeout=10000)
            except Exception:
                pass

        browser.close()

    print(f"\n=== Summary ===")
    print(f"Passed: {passed[0]}")
    print(f"Failed: {failed[0]}")
    return 0 if failed[0] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
