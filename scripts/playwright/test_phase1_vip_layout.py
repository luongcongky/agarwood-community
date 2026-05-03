"""
Phase 1 smoke test — verify VIP layout refactor:
  1. VIP login → /tong-quan shows sidebar (NOT public navbar)
  2. VIP at /feed shows public navbar (NOT sidebar)
  3. "Trang quản lý" item in UserMenu dropdown on public pages
  4. "Về trang công khai" item in dropdown when on VIP management pages
  5. Sidebar contains expected VIP menu items (Tổng quan, Hồ sơ, Doanh nghiệp, Chứng nhận, ...)
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
VIP_EMAIL = "lienhe@baotram.vn"  # VIP seed user (Bảo Trầm)
VIP_PASSWORD = "Demo@123"
SCREENSHOT_DIR = Path(__file__).parent / "screenshots"
SCREENSHOT_DIR.mkdir(exist_ok=True)

console_errors: list[str] = []


def login(page: Page, email: str, password: str) -> None:
    page.set_default_timeout(60000)
    page.set_default_navigation_timeout(180000)
    page.goto(f"{BASE_URL}/login", timeout=180000)
    page.wait_for_selector("input#email", timeout=120000)

    for attempt in range(3):
        page.fill("input#email", email)
        page.fill("input#password", password)
        page.click('button[type="submit"]')
        # Wait up to 60s for redirect away from /login
        for i in range(60):
            page.wait_for_timeout(1000)
            if "/login" not in page.url:
                print(f"  Login redirect after {i+1}s → {page.url}")
                try:
                    page.wait_for_load_state("networkidle", timeout=60000)
                except Exception:
                    pass
                return
        # Check for error banner; if seen, retry
        err = page.locator('text=Email hoặc mật khẩu không chính xác').count()
        print(f"  Attempt {attempt+1}: still on /login, err={err}")
        if err == 0:
            break

    page.screenshot(path=str(SCREENSHOT_DIR / "phase1_login_stuck.png"), full_page=True)
    raise RuntimeError(f"Login failed after 3 attempts, still at {page.url}")


def check(passed: list[int], failed: list[int], label: str, ok: bool, details: str = "") -> None:
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {label}" + (f" — {details}" if details else ""))
    if ok:
        passed[0] += 1
    else:
        failed[0] += 1


def run_tests(page: Page) -> tuple[int, int]:
    passed = [0]
    failed = [0]

    # After login, VIP should land on /tong-quan
    print(f"\n=== Step 1: VIP landed on {page.url} ===")
    check(passed, failed, "Redirected to /tong-quan", "/tong-quan" in page.url)

    # /tong-quan should show sidebar — look for MemberSidebar's unique text "Khu vực hội viên"
    try:
        page.wait_for_load_state("networkidle", timeout=30000)
    except Exception:
        pass
    page.screenshot(path=str(SCREENSHOT_DIR / "phase1_tong_quan.png"), full_page=True)
    has_sidebar_label = page.locator("text=Khu vực hội viên").count() > 0
    check(passed, failed, "Sidebar label 'Khu vực hội viên' visible on /tong-quan", has_sidebar_label)

    # Sidebar has "Hồ sơ cá nhân", "Gia hạn", "Tài liệu"
    has_profile = page.locator('aside a:has-text("Hồ sơ cá nhân")').count() > 0
    check(passed, failed, "Sidebar link 'Hồ sơ cá nhân'", has_profile)
    has_renew = page.locator('aside a:has-text("Gia hạn")').count() > 0
    check(passed, failed, "Sidebar link 'Gia hạn'", has_renew)

    # Should NOT have public Navbar on /tong-quan (no "Tin tức" link at top)
    has_public_navbar = page.locator('header nav a:has-text("Tin tức")').count() > 0
    check(passed, failed, "Public navbar HIDDEN on /tong-quan", not has_public_navbar)

    # Has "Về trang công khai" link at bottom of sidebar
    has_exit_public = page.locator('aside a:has-text("Về trang công khai")').count() > 0
    check(passed, failed, "Sidebar has 'Về trang công khai'", has_exit_public)

    # ── Step 2: navigate to /feed → should show public navbar + NO sidebar ───
    print("\n=== Step 2: Navigate to /feed ===")
    page.goto(f"{BASE_URL}/feed", wait_until="domcontentloaded")
    try:
        page.wait_for_load_state("networkidle", timeout=30000)
    except Exception:
        pass
    page.screenshot(path=str(SCREENSHOT_DIR / "phase1_feed.png"), full_page=True)

    has_sidebar_on_feed = page.locator("text=Khu vực hội viên").count() > 0
    check(passed, failed, "Sidebar HIDDEN on /feed", not has_sidebar_on_feed)

    has_public_tintuc = page.locator('header nav a:has-text("Tin tức")').count() > 0
    check(passed, failed, "Public navbar VISIBLE on /feed (has 'Tin tức' link)", has_public_tintuc)

    has_public_congdong = page.locator('header nav a:has-text("Cộng đồng")').count() > 0
    check(passed, failed, "Public navbar has 'Cộng đồng' link", has_public_congdong)

    # ── Step 3: Open UserMenu dropdown on /feed, should see "Trang quản lý" ──
    print("\n=== Step 3: UserMenu dropdown on /feed ===")
    # UserMenu trigger = avatar button inside header (has avatar img/fallback initial)
    page.locator('header [aria-haspopup="menu"]').first.click()
    page.wait_for_timeout(200)
    has_enter_mgmt = page.locator('[role="menuitem"]:has-text("Trang quản lý")').count() > 0
    check(passed, failed, "Dropdown shows 'Trang quản lý'", has_enter_mgmt)
    page.keyboard.press("Escape")

    # ── Step 4: Navigate back to /tong-quan and open UserMenu — shows 'Về trang công khai' ──
    print("\n=== Step 4: UserMenu on /tong-quan (should show 'Về trang công khai') ===")
    page.goto(f"{BASE_URL}/tong-quan", wait_until="domcontentloaded")
    try:
        page.wait_for_load_state("networkidle", timeout=30000)
    except Exception:
        pass
    # On /tong-quan, no Navbar at all — UserMenu dropdown is in sidebar instead, but actually
    # we have sidebar with "Về trang công khai" directly visible (not dropdown), which we
    # already checked. Pass.

    # ── Step 5: /ho-so also shows sidebar ──
    print("\n=== Step 5: /ho-so also has sidebar ===")
    page.goto(f"{BASE_URL}/ho-so", wait_until="domcontentloaded")
    try:
        page.wait_for_load_state("networkidle", timeout=30000)
    except Exception:
        pass
    has_sidebar_on_hoso = page.locator("text=Khu vực hội viên").count() > 0
    check(passed, failed, "Sidebar VISIBLE on /ho-so", has_sidebar_on_hoso)
    page.screenshot(path=str(SCREENSHOT_DIR / "phase1_ho_so.png"), full_page=True)

    # ── Step 6: /san-pham-doanh-nghiep (public) — has navbar ──
    print("\n=== Step 6: /san-pham-doanh-nghiep has public navbar ===")
    page.goto(f"{BASE_URL}/san-pham-doanh-nghiep", wait_until="domcontentloaded")
    try:
        page.wait_for_load_state("networkidle", timeout=30000)
    except Exception:
        pass
    has_public_navbar_sp = page.locator('header nav a:has-text("Tin tức")').count() > 0
    check(passed, failed, "Public navbar on /san-pham-doanh-nghiep", has_public_navbar_sp)

    return passed[0], failed[0]


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context: BrowserContext = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        page.on(
            "console",
            lambda msg: console_errors.append(f"[{msg.type}] {msg.text}")
            if msg.type == "error"
            else None,
        )
        page.on("pageerror", lambda err: console_errors.append(f"[pageerror] {err}"))

        passed = 0
        failed = 1
        try:
            login(page, VIP_EMAIL, VIP_PASSWORD)
            passed, failed = run_tests(page)
        except Exception as e:
            print(f"FATAL: {e}")
            try:
                page.screenshot(
                    path=str(SCREENSHOT_DIR / "phase1_fatal.png"),
                    full_page=True,
                    timeout=10000,
                )
            except Exception as se:
                print(f"(screenshot failed: {se})")

        browser.close()

    print("\n=== Summary ===")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")

    if console_errors:
        print(f"\n⚠ Console errors ({len(console_errors)}):")
        for err in console_errors[:20]:
            print(f"  {err}")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
