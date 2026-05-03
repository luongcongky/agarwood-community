"""
Phase 3 smoke test — verify marketplace categories + product comment:
  1. /san-pham-doanh-nghiep shows categories grid + filter tabs
  2. Category click filters products
  3. /san-pham/:slug detail page loads + has "Thảo luận" section
  4. Login + post comment on product
"""
from __future__ import annotations

import io
import sys
import urllib.request
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


def check(label: str, ok: bool, details: str = "") -> None:
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {label}" + (f" -- {details}" if details else ""))
    if ok:
        passed[0] += 1
    else:
        failed[0] += 1


def login(page: Page) -> None:
    page.set_default_timeout(120000)
    page.set_default_navigation_timeout(300000)
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


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx: BrowserContext = browser.new_context(viewport={"width": 1400, "height": 900})
        page = ctx.new_page()

        try:
            # Warmup
            for path in ["/san-pham-doanh-nghiep", "/login"]:
                try:
                    urllib.request.urlopen(f"{BASE_URL}{path}", timeout=120)
                    print(f"  Warmed up {path}")
                except Exception as e:
                    print(f"  Warmup {path}: {e}")

            # === Step 1: Marketplace page ===
            print("\n=== Step 1: Marketplace page ===")
            page.goto(f"{BASE_URL}/san-pham-doanh-nghiep", wait_until="domcontentloaded", timeout=120000)
            try:
                page.wait_for_load_state("networkidle", timeout=30000)
            except Exception:
                pass
            page.screenshot(path=str(SCREENSHOT_DIR / "phase3_marketplace.png"), full_page=True)

            # Check for categories grid
            has_categories = page.locator('text=Trầm tự nhiên').count() > 0
            check("Categories grid visible", has_categories)

            has_tinh_dau = page.locator('text=Tinh dầu').count() > 0
            check("Category 'Tinh dầu' visible", has_tinh_dau)

            # Check filter tabs
            has_all_tab = page.locator('a:has-text("Tất cả")').count() > 0
            check("'Tất cả' filter tab", has_all_tab)

            has_cert_tab = page.locator('a:has-text("Chứng nhận")').count() > 0
            check("'Chứng nhận' filter tab", has_cert_tab)

            # === Step 2: Category click (if products exist) ===
            print("\n=== Step 2: Category filter ===")
            # Click "Tinh dầu" category
            tinh_dau_link = page.locator('a:has-text("Tinh dầu")').first
            if tinh_dau_link.count() > 0:
                tinh_dau_link.click()
                try:
                    page.wait_for_load_state("networkidle", timeout=30000)
                except Exception:
                    pass
                has_filter_text = page.locator('text=Đang lọc').count() > 0
                check("Category filter active indicator", has_filter_text or "category=" in page.url)
                page.screenshot(path=str(SCREENSHOT_DIR / "phase3_filtered.png"), full_page=True)
            else:
                check("Category link found", False)

            # === Step 3: Product detail ===
            print("\n=== Step 3: Product detail ===")
            # Navigate to a product
            page.goto(f"{BASE_URL}/san-pham-doanh-nghiep", wait_until="domcontentloaded", timeout=60000)
            try:
                page.wait_for_load_state("networkidle", timeout=30000)
            except Exception:
                pass

            product_links = page.locator('a[href^="/san-pham/"]').count()
            if product_links > 0:
                first_product = page.locator('a[href^="/san-pham/"]').first
                href = first_product.get_attribute("href") or ""
                print(f"  First product: {href}")
                page.goto(f"{BASE_URL}{href}", wait_until="domcontentloaded", timeout=120000)
                try:
                    page.wait_for_load_state("networkidle", timeout=30000)
                except Exception:
                    pass
                page.screenshot(path=str(SCREENSHOT_DIR / "phase3_product_detail.png"), full_page=True)

                has_discussion = page.locator('text=Thảo luận').count() > 0
                check("Product detail has 'Thảo luận' section", has_discussion)

                # === Step 4: Login + comment on product ===
                print("\n=== Step 4: Login + comment on product ===")
                login(page)
                # Navigate back to the product
                page.goto(f"{BASE_URL}{href}", wait_until="domcontentloaded", timeout=120000)
                try:
                    page.wait_for_load_state("networkidle", timeout=30000)
                except Exception:
                    pass

                textarea = page.locator('textarea[placeholder*="bình luận"]')
                if textarea.count() > 0:
                    test_comment = f"Product test {int(page.evaluate('Date.now()'))}"
                    textarea.fill(test_comment)
                    page.locator('button:has-text("Gửi")').click()
                    page.wait_for_timeout(2000)
                    comment_visible = page.locator(f'text={test_comment}').count() > 0
                    check("Product comment posted and visible", comment_visible)
                    page.screenshot(path=str(SCREENSHOT_DIR / "phase3_product_commented.png"), full_page=True)

                    # Cleanup: delete the comment
                    page.evaluate('window.confirm = () => true')
                    delete_btn = page.locator('button:has-text("Xóa")').first
                    if delete_btn.count() > 0:
                        delete_btn.click()
                        page.wait_for_timeout(500)
                else:
                    check("Comment textarea visible after login", False)
            else:
                print("  SKIP: no products to test detail/comment")
                check("Products exist to test", False)

        except Exception as e:
            print(f"FATAL: {e}")
            try:
                page.screenshot(path=str(SCREENSHOT_DIR / "phase3_fatal.png"), full_page=True, timeout=10000)
            except Exception:
                pass

        browser.close()

    print(f"\n=== Summary ===")
    print(f"Passed: {passed[0]}")
    print(f"Failed: {failed[0]}")
    return 0 if failed[0] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
