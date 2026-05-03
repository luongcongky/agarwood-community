"""
Test RichTextEditor v2 toolbar — comprehensive test for ALL buttons.

Target page: http://localhost:3000/admin/tin-tuc/moi (create new news)
After testing, we do NOT submit the form, so no data is created.

Runs headless. Dev server expected running on http://localhost:3000.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, Page, BrowserContext

# Force UTF-8 stdout on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

BASE_URL = "http://localhost:3000"
ADMIN_EMAIL = "admin@hoitramhuong.vn"
ADMIN_PASSWORD = "Demo@123"
SCREENSHOT_DIR = Path(__file__).parent / "screenshots"
SCREENSHOT_DIR.mkdir(exist_ok=True)

console_errors: list[str] = []
passed = 0
failed = 0


def login(page: Page) -> None:
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    page.fill("input#email", ADMIN_EMAIL)
    page.fill("input#password", ADMIN_PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_url(lambda u: "/login" not in u, timeout=15000)
    page.wait_for_load_state("networkidle")


def go_editor(page: Page) -> None:
    page.goto(f"{BASE_URL}/admin/tin-tuc/moi")
    page.wait_for_load_state("networkidle")
    page.wait_for_selector(".ProseMirror", timeout=15000)


def reset_editor(page: Page, text: str = "Xin chao the gioi") -> None:
    """Clear editor and type text, then select all."""
    page.locator(".ProseMirror").click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    page.wait_for_timeout(50)
    page.keyboard.type(text, delay=10)
    page.keyboard.press("Control+A")


def get_html(page: Page) -> str:
    return page.evaluate(
        """() => document.querySelector('.ProseMirror')?.innerHTML ?? ''"""
    )


def click_tb(page: Page, title: str) -> None:
    btn = page.locator(f'button[data-tb-button="{title}"]').first
    btn.wait_for(state="visible", timeout=5000)
    btn.click()
    page.wait_for_timeout(100)


def check(ok: bool, label: str, detail: str = "") -> bool:
    global passed, failed
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {label}")
    if not ok and detail:
        print(f"         {detail[:300]}")
    if ok:
        passed += 1
    else:
        failed += 1
    return ok


def screenshot_on_fail(page: Page, name: str) -> None:
    page.screenshot(path=str(SCREENSHOT_DIR / f"v2_fail_{name}.png"), full_page=True)


# ═══════════════════════════════════════════════════════════════════════
# Row 1 tests
# ═══════════════════════════════════════════════════════════════════════

def test_row1_undo_redo(page: Page) -> None:
    print("\n--- Undo / Redo ---")
    # Start fresh — type bold text so undo has something meaningful
    page.locator(".ProseMirror").click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    page.wait_for_timeout(100)
    page.keyboard.type("abc", delay=30)
    page.wait_for_timeout(200)
    # Apply bold to create an undoable action
    page.keyboard.press("Control+A")
    click_tb(page, "In đậm (Ctrl+B)")
    page.wait_for_timeout(200)
    html_bold = get_html(page)
    has_bold = "<strong>" in html_bold
    check(has_bold, "Setup: Bold applied before undo test")

    # Undo bold via button
    click_tb(page, "Hoàn tác (Ctrl+Z)")
    page.wait_for_timeout(200)
    html_after_undo = get_html(page)
    if not check("<strong>" not in html_after_undo and "abc" in html_after_undo,
                 "Undo button removes bold", html_after_undo):
        screenshot_on_fail(page, "undo")

    # Redo via button
    click_tb(page, "Làm lại (Ctrl+Y)")
    page.wait_for_timeout(200)
    html_after_redo = get_html(page)
    if not check("<strong>" in html_after_redo, "Redo button re-applies bold", html_after_redo):
        screenshot_on_fail(page, "redo")


def test_row1_inline_formatting(page: Page) -> None:
    print("\n--- Inline formatting (Bold, Italic, Underline, Strikethrough) ---")
    tests = [
        ("In đậm (Ctrl+B)", "<strong>", "Bold"),
        ("In nghiêng (Ctrl+I)", "<em>", "Italic"),
        ("Gạch chân (Ctrl+U)", "<u>", "Underline"),
        ("Gạch ngang", "<s>", "Strikethrough"),
    ]
    for title, expected, label in tests:
        reset_editor(page)
        click_tb(page, title)
        html = get_html(page)
        if not check(expected in html, f"{label} wraps {expected}", html[:200]):
            screenshot_on_fail(page, label.lower())


def test_row1_link(page: Page) -> None:
    print("\n--- Link / Unlink ---")
    reset_editor(page)
    page.evaluate("""() => { window.prompt = () => 'https://example.com' }""")
    click_tb(page, "Chèn liên kết")
    page.wait_for_timeout(150)
    html = get_html(page)
    if not check('href="https://example.com"' in html, "Link inserts <a> with href", html[:300]):
        screenshot_on_fail(page, "link")

    # Select text again and unlink
    page.keyboard.press("Control+A")
    click_tb(page, "Bỏ liên kết")
    page.wait_for_timeout(150)
    html2 = get_html(page)
    if not check("href" not in html2, "Unlink removes <a>", html2[:200]):
        screenshot_on_fail(page, "unlink")


def test_row1_alignment(page: Page) -> None:
    print("\n--- Text alignment ---")
    aligns = [
        ("Căn trái", "text-align: left"),
        ("Căn giữa", "text-align: center"),
        ("Căn phải", "text-align: right"),
        ("Căn đều", "text-align: justify"),
    ]
    for title, expected in aligns:
        reset_editor(page)
        click_tb(page, title)
        html = get_html(page)
        if not check(expected in html, f"Align: {title}", html[:200]):
            screenshot_on_fail(page, f"align_{title}")


def test_row1_lists_quote(page: Page) -> None:
    print("\n--- Lists & Blockquote ---")
    tests = [
        ("Danh sách gạch đầu dòng", "<ul>", "Bullet list"),
        ("Danh sách đánh số", "<ol>", "Ordered list"),
        ("Trích dẫn", "<blockquote>", "Blockquote"),
    ]
    for title, expected, label in tests:
        reset_editor(page)
        click_tb(page, title)
        html = get_html(page)
        if not check(expected in html, label, html[:200]):
            screenshot_on_fail(page, label.lower().replace(" ", "_"))


def test_row1_hr(page: Page) -> None:
    print("\n--- Horizontal Rule ---")
    reset_editor(page)
    click_tb(page, "Đường kẻ ngang")
    page.wait_for_timeout(150)
    html = get_html(page)
    if not check("<hr" in html, "Horizontal rule inserted", html[:200]):
        screenshot_on_fail(page, "hr")


def test_row1_table(page: Page) -> None:
    print("\n--- Table ---")
    reset_editor(page, "truoc bang")
    click_tb(page, "Chèn bảng 3×3")
    page.wait_for_timeout(200)
    html = get_html(page)
    if not check("<table" in html, "Table inserted"):
        screenshot_on_fail(page, "table_insert")
        return

    # Table action buttons should appear
    page.wait_for_timeout(150)
    add_row_visible = page.locator('button[data-tb-button="Thêm hàng phía trên"]').count() > 0
    if not check(add_row_visible, "Table action buttons visible"):
        screenshot_on_fail(page, "table_actions")
        return

    # Add row
    rows_before = html.count("<tr")
    click_tb(page, "Thêm hàng phía dưới")
    page.wait_for_timeout(150)
    html2 = get_html(page)
    rows_after = html2.count("<tr")
    if not check(rows_after > rows_before, f"Add row: {rows_before} -> {rows_after} rows"):
        screenshot_on_fail(page, "table_add_row")

    # Add column
    cols_before = html2.count("<td") + html2.count("<th")
    click_tb(page, "Thêm cột bên phải")
    page.wait_for_timeout(150)
    html3 = get_html(page)
    cols_after = html3.count("<td") + html3.count("<th")
    if not check(cols_after > cols_before, f"Add column: {cols_before} -> {cols_after} cells"):
        screenshot_on_fail(page, "table_add_col")

    # Delete row
    rows_before_del = html3.count("<tr")
    click_tb(page, "Xóa hàng")
    page.wait_for_timeout(150)
    html4 = get_html(page)
    rows_after_del = html4.count("<tr")
    if not check(rows_after_del < rows_before_del, f"Delete row: {rows_before_del} -> {rows_after_del}"):
        screenshot_on_fail(page, "table_del_row")

    # Delete column
    cols_before_del = html4.count("<td") + html4.count("<th")
    click_tb(page, "Xóa cột")
    page.wait_for_timeout(150)
    html5 = get_html(page)
    cols_after_del = html5.count("<td") + html5.count("<th")
    if not check(cols_after_del < cols_before_del, f"Delete col: {cols_before_del} -> {cols_after_del}"):
        screenshot_on_fail(page, "table_del_col")

    # Delete table
    click_tb(page, "Xóa bảng")
    page.wait_for_timeout(150)
    html6 = get_html(page)
    if not check("<table" not in html6, "Delete table removes <table>"):
        screenshot_on_fail(page, "table_delete")


def test_row1_image(page: Page) -> None:
    print("\n--- Image insertion (local file picker) ---")
    reset_editor(page)

    # Create a small test PNG in memory and set it on the hidden file input
    # The button triggers the hidden <input type="file"> — we set files on it directly
    file_input = page.locator('input[type="file"][accept="image/*"]').first
    # Create a tiny 1x1 red PNG for testing
    page.evaluate("""() => {
        const canvas = document.createElement('canvas');
        canvas.width = 100; canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 100, 100);
        window.__testImageDataUrl = canvas.toDataURL('image/png');
    }""")
    # Use Playwright's set_input_files with a buffer
    import base64
    data_url = page.evaluate("() => window.__testImageDataUrl")
    # Extract base64 data from data URL
    b64_data = data_url.split(",")[1]
    img_bytes = base64.b64decode(b64_data)

    file_input.set_input_files({
        "name": "test-image.png",
        "mimeType": "image/png",
        "buffer": img_bytes,
    })
    page.wait_for_timeout(500)
    html = get_html(page)
    # Image should be inserted with a blob: URL (local preview)
    if not check("<img" in html and "blob:" in html, "Image inserted as local blob preview", html[:300]):
        screenshot_on_fail(page, "image_insert")


# ═══════════════════════════════════════════════════════════════════════
# Row 2 tests
# ═══════════════════════════════════════════════════════════════════════

def test_row2_paragraph_dropdown(page: Page) -> None:
    print("\n--- Paragraph format dropdown ---")

    dropdown_btn = page.locator('button[title="Định dạng khối"]').first

    # Test H2
    reset_editor(page)
    dropdown_btn.click()
    page.wait_for_timeout(200)
    page.locator("button:has-text('Tiêu đề 2')").first.click()
    page.wait_for_timeout(150)
    html = get_html(page)
    if not check("<h2" in html, "Dropdown -> H2", html[:200]):
        screenshot_on_fail(page, "dropdown_h2")

    # Test H3
    reset_editor(page)
    dropdown_btn.click()
    page.wait_for_timeout(200)
    page.locator("button:has-text('Tiêu đề 3')").first.click()
    page.wait_for_timeout(150)
    html = get_html(page)
    if not check("<h3" in html, "Dropdown -> H3", html[:200]):
        screenshot_on_fail(page, "dropdown_h3")

    # Test H4
    reset_editor(page)
    dropdown_btn.click()
    page.wait_for_timeout(200)
    page.locator("button:has-text('Tiêu đề 4')").first.click()
    page.wait_for_timeout(150)
    html = get_html(page)
    if not check("<h4" in html, "Dropdown -> H4", html[:200]):
        screenshot_on_fail(page, "dropdown_h4")

    # Test back to Paragraph — click inside the heading first
    reset_editor(page)
    dropdown_btn.click()
    page.wait_for_timeout(200)
    page.locator("button:has-text('Tiêu đề 2')").first.click()
    page.wait_for_timeout(150)
    # Place cursor inside the H2 text (click on it)
    page.locator(".ProseMirror h2").first.click()
    page.wait_for_timeout(100)
    page.keyboard.press("Control+A")
    page.wait_for_timeout(100)
    dropdown_btn.click()
    page.wait_for_timeout(200)
    page.locator("button:has-text('Đoạn văn')").first.click()
    page.wait_for_timeout(150)
    html = get_html(page)
    # Check that the text is now in a <p> and not in <h2>
    if not check("Xin chao" in html and ("<p" in html), "Dropdown -> Paragraph (from H2)", html[:300]):
        screenshot_on_fail(page, "dropdown_p")


def test_row2_font_color(page: Page) -> None:
    print("\n--- Font color ---")
    reset_editor(page)

    color_btn = page.locator('button[title="Màu chữ"]').first

    # Pick red — use force click to avoid overlap issues with small buttons
    color_btn.click()
    page.wait_for_timeout(200)
    red_btn = page.locator('button[title="Đỏ"]').first
    red_btn.click(force=True)
    page.wait_for_timeout(150)
    html = get_html(page)
    if not check("color" in html.lower(), "Red color applied", html[:300]):
        screenshot_on_fail(page, "color_red")

    # Reset to default
    page.keyboard.press("Control+A")
    color_btn.click()
    page.wait_for_timeout(200)
    default_btn = page.locator('button[title="Mặc định"]').first
    default_btn.click(force=True)
    page.wait_for_timeout(150)
    html2 = get_html(page)
    has_no_color = "dc2626" not in html2.lower() and "rgb(220, 38, 38)" not in html2.lower()
    if not check(has_no_color, "Default removes color style", html2[:300]):
        screenshot_on_fail(page, "color_default")

    # Test another color (blue)
    reset_editor(page)
    color_btn.click()
    page.wait_for_timeout(200)
    blue_btn = page.locator('button[title="Xanh dương"]').first
    blue_btn.click(force=True)
    page.wait_for_timeout(150)
    html3 = get_html(page)
    if not check("color" in html3.lower(), "Blue color applied", html3[:300]):
        screenshot_on_fail(page, "color_blue")


def test_row2_indent(page: Page) -> None:
    print("\n--- Indent / Outdent (in list context) ---")
    # Clear and type two lines, then convert both to a list
    page.locator(".ProseMirror").click()
    page.keyboard.press("Control+A")
    page.keyboard.press("Delete")
    page.wait_for_timeout(50)
    page.keyboard.type("item 1", delay=10)
    page.keyboard.press("Enter")
    page.keyboard.type("item 2", delay=10)
    page.wait_for_timeout(100)
    # Select all and convert to bullet list
    page.keyboard.press("Control+A")
    click_tb(page, "Danh sách gạch đầu dòng")
    page.wait_for_timeout(200)

    # Now place cursor at second item and indent
    # Click at end of editor to get to last item
    page.locator(".ProseMirror li:last-child").last.click()
    page.wait_for_timeout(100)

    # Use Tab key for indent (TipTap supports Tab in lists)
    page.keyboard.press("Tab")
    page.wait_for_timeout(200)
    html = get_html(page)
    nested = html.count("<ul") >= 2
    if not check(nested, "Indent (Tab) creates nested list", html[:400]):
        screenshot_on_fail(page, "indent")

    # Shift+Tab for outdent
    page.keyboard.press("Shift+Tab")
    page.wait_for_timeout(200)
    html2 = get_html(page)
    unnested = html2.count("<ul") < html.count("<ul")
    if not check(unnested, "Outdent (Shift+Tab) removes nesting", html2[:400]):
        screenshot_on_fail(page, "outdent")


# ═══════════════════════════════════════════════════════════════════════
# Contextual tests
# ═══════════════════════════════════════════════════════════════════════

def test_image_contextual_actions(page: Page) -> None:
    print("\n--- Image contextual actions ---")
    reset_editor(page)
    # Insert image via file picker
    import base64 as b64mod
    file_input = page.locator('input[type="file"][accept="image/*"]').first
    page.evaluate("""() => {
        const c = document.createElement('canvas');
        c.width = 200; c.height = 150;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(0, 0, 200, 150);
        window.__testImg2 = c.toDataURL('image/png');
    }""")
    du = page.evaluate("() => window.__testImg2")
    ib = b64mod.b64decode(du.split(",")[1])
    file_input.set_input_files({"name": "ctx-test.png", "mimeType": "image/png", "buffer": ib})
    page.wait_for_timeout(500)

    # Click the image to select it
    img = page.locator(".ProseMirror img").first
    if img.count() == 0:
        check(False, "Image exists for contextual test")
        return
    img.click()
    page.wait_for_timeout(400)

    # Check contextual buttons appear
    reset_btn = page.locator('button[data-tb-button="Về kích thước gốc"]')
    if not check(reset_btn.count() > 0, "Image contextual buttons appear"):
        screenshot_on_fail(page, "image_contextual")
        return

    # Reset size
    reset_btn.first.click()
    page.wait_for_timeout(100)
    check(True, "Reset size button clickable")

    # Change URL
    page.evaluate("""() => { window.prompt = () => 'https://placehold.co/400x300.png' }""")
    url_btn = page.locator('button[data-tb-button="Đổi URL ảnh"]')
    if url_btn.count() > 0:
        url_btn.first.click()
        page.wait_for_timeout(250)
        html = get_html(page)
        if not check("400x300" in html, "Change URL updates src", html[:300]):
            screenshot_on_fail(page, "image_url")
    else:
        check(False, "Change URL button not found")

    # Re-select image
    img2 = page.locator(".ProseMirror img").first
    if img2.count() > 0:
        img2.click()
        page.wait_for_timeout(400)

    # Alt text
    page.evaluate("""() => { window.prompt = () => 'Test alt text' }""")
    alt_btn = page.locator('button[data-tb-button="Chỉnh alt text"]')
    if alt_btn.count() > 0:
        alt_btn.first.click()
        page.wait_for_timeout(250)
        html = get_html(page)
        if not check("Test alt text" in html, "Alt text updated", html[:300]):
            screenshot_on_fail(page, "image_alt")
    else:
        check(False, "Alt text button not found")

    # Re-select image for delete
    img3 = page.locator(".ProseMirror img").first
    if img3.count() > 0:
        img3.click()
        page.wait_for_timeout(400)

    # Delete image
    page.evaluate("""() => { window.confirm = () => true }""")
    del_btn = page.locator('button[data-tb-button="Xóa ảnh"]')
    if del_btn.count() > 0:
        del_btn.first.click()
        page.wait_for_timeout(250)
        html = get_html(page)
        if not check("<img" not in html, "Delete image removes <img>"):
            screenshot_on_fail(page, "image_delete")
    else:
        check(False, "Delete image button not found")


# ═══════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════

def main() -> int:
    global passed, failed

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

        try:
            print("Logging in...")
            login(page)
            print("Navigating to /admin/tin-tuc/moi ...")
            go_editor(page)
            page.screenshot(path=str(SCREENSHOT_DIR / "v2_01_editor_loaded.png"), full_page=True)

            print("\n" + "=" * 60)
            print("  RichTextEditor v2 - Toolbar Comprehensive Test")
            print("=" * 60)

            test_row1_undo_redo(page)
            test_row1_inline_formatting(page)
            test_row1_link(page)
            test_row1_alignment(page)
            test_row1_lists_quote(page)
            test_row1_hr(page)
            test_row1_table(page)
            test_row1_image(page)
            test_row2_paragraph_dropdown(page)
            test_row2_font_color(page)
            test_row2_indent(page)
            test_image_contextual_actions(page)

        except Exception as e:
            print(f"\nFATAL: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path=str(SCREENSHOT_DIR / "v2_fatal.png"), full_page=True)
            browser.close()
            return 1

        page.screenshot(path=str(SCREENSHOT_DIR / "v2_02_tests_done.png"), full_page=True)
        browser.close()

    print("\n" + "=" * 60)
    print(f"  RESULTS: {passed} passed, {failed} failed")
    print("=" * 60)

    if console_errors:
        print(f"\n  Console errors ({len(console_errors)}):")
        for err in console_errors[:10]:
            print(f"    {err[:150]}")

    print("\n  Cleanup: No data created (form was not submitted)")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
