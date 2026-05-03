"""
Test RichTextEditor toolbar buttons on the admin news edit page.

For each toolbar button, we:
  1. Set cursor in editor (with some seed text).
  2. Click the button.
  3. Assert expected HTML mutation / active state / DOM presence.

Runs headless. Dev server expected running on http://localhost:3000.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, Page, BrowserContext

# Force UTF-8 stdout on Windows (cp1252 default can't handle arrows etc.)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

BASE_URL = "http://localhost:3000"
ADMIN_EMAIL = "admin@hoitramhuong.vn"
ADMIN_PASSWORD = "Demo@123"
NEWS_ID = "cmnu1r4c600006ohpw4yvsisy"
SCREENSHOT_DIR = Path(__file__).parent / "screenshots"
SCREENSHOT_DIR.mkdir(exist_ok=True)

console_errors: list[str] = []


def login(page: Page) -> None:
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    page.fill('input#email', ADMIN_EMAIL)
    page.fill('input#password', ADMIN_PASSWORD)
    page.click('button[type="submit"]')
    # Wait until off the login page (redirected to /admin or /tong-quan)
    page.wait_for_url(lambda u: "/login" not in u, timeout=15000)
    page.wait_for_load_state("networkidle")


def go_editor(page: Page) -> None:
    page.goto(f"{BASE_URL}/admin/tin-tuc/{NEWS_ID}")
    page.wait_for_load_state("networkidle")
    # Wait for editor to mount
    page.wait_for_selector(".ProseMirror", timeout=15000)


def reset_editor(page: Page, text: str = "Xin chào thế giới") -> None:
    """Clear editor + type some text so we have a selection target."""
    page.evaluate(
        """(t) => {
            const pm = document.querySelector('.ProseMirror');
            if (!pm) return;
            pm.focus();
        }"""
    )
    page.locator(".ProseMirror").click()
    # Select all + delete
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    page.keyboard.type(text, delay=10)
    # Select all (so toggles apply to the whole text)
    page.keyboard.press("Control+A")


def get_html(page: Page) -> str:
    return page.evaluate(
        """() => document.querySelector('.ProseMirror')?.innerHTML ?? ''"""
    )


def click_tb(page: Page, title: str) -> None:
    page.locator(f'button[data-tb-button="{title}"]').first.click()
    page.wait_for_timeout(80)


def assert_contains(html: str, needle: str, label: str) -> bool:
    ok = needle in html
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {label}: {needle!r}")
    if not ok:
        print(f"         HTML snippet: {html[:200]}")
    return ok


def run_tests(page: Page) -> tuple[int, int]:
    passed = 0
    failed = 0

    tests: list[tuple[str, str, str, str]] = [
        # (title, button title, expected HTML substring, label)
        ("Bold", "In đậm (Ctrl+B)", "<strong>", "Bold wraps selection"),
        ("Italic", "In nghiêng (Ctrl+I)", "<em>", "Italic wraps selection"),
        ("H2", "Tiêu đề H2", "<h2", "H2 heading"),
        ("H3", "Tiêu đề H3", "<h3", "H3 heading"),
        ("Bullet list", "Danh sách gạch đầu dòng", "<ul>", "Bullet list"),
        ("Ordered list", "Danh sách đánh số", "<ol>", "Ordered list"),
        ("Blockquote", "Trích dẫn", "<blockquote>", "Blockquote"),
        ("Align left", "Căn trái", 'text-align: left', "Text align left style"),
        ("Align center", "Căn giữa", 'text-align: center', "Text align center style"),
        ("Align right", "Căn phải", 'text-align: right', "Text align right style"),
        ("Align justify", "Căn đều", 'text-align: justify', "Text align justify style"),
    ]

    print("\n=== Toolbar button tests ===\n")

    for name, title, expected, label in tests:
        reset_editor(page)
        click_tb(page, title)
        html = get_html(page)
        if assert_contains(html, expected, f"{name} → {label}"):
            passed += 1
        else:
            failed += 1
            page.screenshot(path=str(SCREENSHOT_DIR / f"fail_{name}.png"), full_page=True)

    # Table insertion test (separate because we need different assertion)
    print("\n--- Table insertion ---")
    reset_editor(page, "trước bảng")
    click_tb(page, "Chèn bảng 3x3")
    page.wait_for_timeout(150)
    html = get_html(page)
    if assert_contains(html, "<table", "Insert table"):
        passed += 1
    else:
        failed += 1
        page.screenshot(path=str(SCREENSHOT_DIR / "fail_table_insert.png"), full_page=True)

    # After insert, cursor should be in the table → table actions visible
    page.wait_for_timeout(100)
    table_action_visible = page.locator('button[data-tb-button="Thêm hàng phía trên"]').count() > 0
    if table_action_visible:
        print("  [PASS] Table action buttons appear when cursor in table")
        passed += 1
        # Test add row
        click_tb(page, "Thêm hàng phía dưới")
        page.wait_for_timeout(100)
        html_after = get_html(page)
        # Count <tr> tags to confirm row was added
        rows_before = html.count("<tr>")
        rows_after = html_after.count("<tr>")
        if rows_after > rows_before:
            print(f"  [PASS] Add row after: {rows_before} → {rows_after} rows")
            passed += 1
        else:
            print(f"  [FAIL] Add row after: rows stayed {rows_before} → {rows_after}")
            failed += 1
    else:
        print("  [FAIL] Table action buttons did NOT appear")
        failed += 1

    # Test image insertion via dialog
    print("\n--- Image insertion (via dialog) ---")
    reset_editor(page)
    # Stub prompt to return a URL
    page.evaluate(
        """() => { window.prompt = () => 'https://placehold.co/300x200.png' }"""
    )
    click_tb(page, "Chèn ảnh từ URL")
    page.wait_for_timeout(200)
    html = get_html(page)
    if assert_contains(html, "<img", "Insert image"):
        passed += 1
    else:
        failed += 1

    return passed, failed


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
        page.on(
            "pageerror",
            lambda err: console_errors.append(f"[pageerror] {err}"),
        )

        try:
            login(page)
            go_editor(page)
            page.screenshot(path=str(SCREENSHOT_DIR / "01_editor_loaded.png"), full_page=True)
            passed, failed = run_tests(page)
        except Exception as e:
            print(f"FATAL: {e}")
            page.screenshot(path=str(SCREENSHOT_DIR / "fatal.png"), full_page=True)
            browser.close()
            return 1

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
