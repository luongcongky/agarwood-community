"""
Smoke test toàn site qua Playwright — duyệt mọi route ở 3 mode để phát hiện
lỗi loading (HTTP 4xx/5xx, uncaught JS exception, console error, failed
network request, redirect lệch).

Usage:
  python scripts/smoke-test-all.py
  python scripts/smoke-test-all.py --base http://localhost:3000

Output:
  smoke-test-result.json     — full report per route
  smoke-test-summary.txt     — bảng PASS/WARN/FAIL + details
"""
import argparse
import json
import sys
import time
from typing import Any
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(line_buffering=True)

# ── Fixtures (re-use từ perf-audit-multi) ─────────────────────────────────────
FIXTURES = {
    "newsSlug": "danh-thuc-co-che-tao-tram-cua-cay-do-bau-huong-tiep-can-sinh-hoc-mo-ra-hieu-qua-moi-cho-nganh-tram-huong",
    "productSlug": "tram-huong-tu-nhien",
    "companySlug": "cong-ty-tnhh-liberty-viet-nam-va-dong-duong",
    "memberId": "cmnv89bi4002hkkhpl21cbybq",
    "postId": "cmo9xbu6t000004l29nf0ky5v",
}

# Route lists per mode. Thêm route mới vào đây để smoke test cover thêm trang.
VIEWER_ROUTES = [
    "/",
    "/vi",
    "/tin-tuc",
    f"/tin-tuc/{FIXTURES['newsSlug']}",
    "/nghien-cuu",
    "/san-pham-chung-nhan",
    "/san-pham-doanh-nghiep",
    f"/san-pham/{FIXTURES['productSlug']}",
    "/doanh-nghiep",
    f"/doanh-nghiep/{FIXTURES['companySlug']}",
    "/ban-lanh-dao",
    "/gioi-thieu",
    "/phap-ly",
    "/dieu-le",
    "/hoi-vien",
    f"/hoi-vien/{FIXTURES['memberId']}",
    f"/bai-viet/{FIXTURES['postId']}",
    "/lien-he",
    "/dich-vu",
    "/khao-sat",
    "/dang-ky",
    "/login",
    "/landing",
    "/cho-duyet",
]

VIP_ROUTES = [
    "/tong-quan",
    "/feed",
    "/feed/tao-bai",
    "/chung-nhan/lich-su",
    "/chung-nhan/nop-don",
    "/tai-lieu",
    "/thanh-toan/lich-su",
    "/ket-nap",
    "/ho-so",
    "/gia-han",
]

ADMIN_ROUTES = [
    "/admin",
    "/admin/tin-tuc",
    "/admin/tin-tuc/tao-moi",
    "/admin/hoi-vien",
    "/admin/hoi-vien/don-ket-nap",
    "/admin/chung-nhan",
    "/admin/bai-viet/cho-duyet",
    "/admin/bai-viet/xin-dang",
    "/admin/banner",
    "/admin/thanh-toan",
    "/admin/truyen-thong",
    "/admin/tu-van",
    "/admin/lien-he",
    "/admin/tai-lieu",
    "/admin/phap-ly",
    "/admin/multimedia",
    "/admin/ban-lanh-dao",
    "/admin/menu",
    "/admin/cai-dat",
    "/admin/khao-sat",
    "/admin/gallery",
    "/admin/tieu-bieu",
]

VIP_EMAIL = "anhpt@hoitramhuong.vn"
VIP_PASSWORD = "Demo@123"
ADMIN_EMAIL = "admin@hoitramhuong.vn"
ADMIN_PASSWORD = "Demo@123"

# Console messages khớp các pattern dưới sẽ ignore (noise/expected).
CONSOLE_IGNORE = [
    # Next.js dev/prod warnings
    "Download the React DevTools",
    "[Fast Refresh]",
    # Known false-positives
    "ResizeObserver loop",
    "punycode",  # node:punycode deprecation noise
]


def is_noise(text: str) -> bool:
    return any(p in text for p in CONSOLE_IGNORE)


def login(page, base_url: str, email: str, password: str) -> bool:
    page.goto(f"{base_url}/login", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(800)
    try:
        page.fill('input[type="email"]', email, timeout=10000)
        page.fill('input[type="password"]', password)
        with page.expect_navigation(timeout=30000):
            page.click('button[type="submit"]')
    except Exception as e:
        print(f"    [login error] {e}")
        return False
    cookies = page.context.cookies()
    return any("authjs" in c["name"].lower() for c in cookies)


def smoke_route(page, base_url: str, route: str) -> dict[str, Any]:
    """Visit 1 route, collect HTTP status + console errors + page errors +
    failed requests + final URL. Returns structured result."""
    target = f"{base_url}{route}"
    console_errors: list[str] = []
    page_errors: list[str] = []
    failed_reqs: list[str] = []

    def on_console(msg):
        if msg.type in ("error", "warning"):
            text = msg.text or ""
            if is_noise(text):
                return
            (console_errors if msg.type == "error" else None)
            if msg.type == "error":
                console_errors.append(text[:300])
            # warnings ignored — too noisy

    def on_pageerror(err):
        page_errors.append(str(err)[:400])

    def on_requestfailed(req):
        # Bỏ qua font preload có thể fail im lặng + favicon misses
        if req.url.endswith((".ico", ".png")) and req.failure and "ABORTED" in str(req.failure):
            return
        failed_reqs.append(f"{req.method} {req.url[:140]} — {req.failure}")

    page.on("console", on_console)
    page.on("pageerror", on_pageerror)
    page.on("requestfailed", on_requestfailed)

    t0 = time.time()
    response = None
    try:
        response = page.goto(target, wait_until="load", timeout=45000)
    except Exception as e:
        return {
            "route": route,
            "status": "FAIL",
            "reason": f"navigation: {e}",
            "elapsedMs": round((time.time() - t0) * 1000),
        }

    # Wait briefly for any post-load JS errors to fire
    try:
        page.wait_for_load_state("networkidle", timeout=8000)
    except Exception:
        pass
    page.wait_for_timeout(500)

    final_url = page.url
    http_status = response.status if response else 0
    title = ""
    try:
        title = page.title()
    except Exception:
        pass

    # Categorize result
    issues: list[str] = []
    severity = "PASS"

    if http_status >= 500:
        severity = "FAIL"
        issues.append(f"HTTP {http_status}")
    elif http_status >= 400:
        severity = "FAIL"
        issues.append(f"HTTP {http_status}")

    if page_errors:
        severity = "FAIL"
        issues.append(f"{len(page_errors)} page error(s)")

    if console_errors:
        if severity == "PASS":
            severity = "WARN"
        issues.append(f"{len(console_errors)} console error(s)")

    if failed_reqs:
        if severity == "PASS":
            severity = "WARN"
        issues.append(f"{len(failed_reqs)} failed request(s)")

    # Cleanup listeners (Playwright shares page across routes)
    page.remove_listener("console", on_console)
    page.remove_listener("pageerror", on_pageerror)
    page.remove_listener("requestfailed", on_requestfailed)

    return {
        "route": route,
        "status": severity,
        "httpStatus": http_status,
        "finalUrl": final_url,
        "title": title[:80],
        "issues": issues,
        "consoleErrors": console_errors,
        "pageErrors": page_errors,
        "failedRequests": failed_reqs,
        "elapsedMs": round((time.time() - t0) * 1000),
    }


def run_mode(browser, base_url: str, routes: list[str], auth: tuple[str, str] | None) -> list[dict]:
    ctx = browser.new_context(
        viewport={"width": 1280, "height": 800},
        # Desktop viewport — smoke test focus on errors, not perf metrics.
    )
    page = ctx.new_page()

    if auth:
        email, pw = auth
        print(f"  [login] {email}", flush=True)
        ok = login(page, base_url, email, pw)
        print(f"  [login] session: {ok}", flush=True)
        if not ok:
            ctx.close()
            return [{"route": "_login", "status": "FAIL", "reason": "auth failed"}]

    results = []
    for r in routes:
        result = smoke_route(page, base_url, r)
        marker = {"PASS": "✓", "WARN": "⚠", "FAIL": "✗"}.get(result["status"], "?")
        print(f"  {marker} {r:55} HTTP={result.get('httpStatus','?')} {result['elapsedMs']}ms  issues={result.get('issues') or '-'}", flush=True)
        results.append(result)
    ctx.close()
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("--mode", choices=["viewer", "vip", "admin", "all"], default="all")
    args = ap.parse_args()

    out = {"base": args.base, "modes": {}}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        if args.mode in ("viewer", "all"):
            print("[VIEWER mode — unauthenticated]", flush=True)
            out["modes"]["viewer"] = run_mode(browser, args.base, VIEWER_ROUTES, auth=None)

        if args.mode in ("vip", "all"):
            print("[VIP mode — login as VIP]", flush=True)
            out["modes"]["vip"] = run_mode(browser, args.base, VIP_ROUTES, auth=(VIP_EMAIL, VIP_PASSWORD))

        if args.mode in ("admin", "all"):
            print("[ADMIN mode — login as admin]", flush=True)
            out["modes"]["admin"] = run_mode(browser, args.base, ADMIN_ROUTES, auth=(ADMIN_EMAIL, ADMIN_PASSWORD))

        browser.close()

    with open("smoke-test-result.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False, default=str)

    # Summary
    print("\n" + "=" * 80)
    total = passes = warns = fails = 0
    for mode, results in out["modes"].items():
        m_pass = sum(1 for r in results if r["status"] == "PASS")
        m_warn = sum(1 for r in results if r["status"] == "WARN")
        m_fail = sum(1 for r in results if r["status"] == "FAIL")
        total += len(results)
        passes += m_pass
        warns += m_warn
        fails += m_fail
        print(f"{mode.upper():8} {len(results):3} routes  PASS={m_pass} WARN={m_warn} FAIL={m_fail}")
    print(f"{'TOTAL':8} {total:3} routes  PASS={passes} WARN={warns} FAIL={fails}")

    # Failure details
    print("\n" + "=" * 80)
    print("FAILURES (FAIL) + WARNINGS (WARN) details:")
    for mode, results in out["modes"].items():
        for r in results:
            if r["status"] in ("FAIL", "WARN"):
                print(f"\n[{mode.upper()}] {r['status']} — {r['route']}")
                print(f"  HTTP: {r.get('httpStatus')}  finalUrl: {r.get('finalUrl', '')[:100]}")
                print(f"  issues: {r.get('issues')}")
                for e in (r.get("pageErrors") or [])[:3]:
                    print(f"  pageError: {e}")
                for e in (r.get("consoleErrors") or [])[:3]:
                    print(f"  consoleError: {e}")
                for e in (r.get("failedRequests") or [])[:3]:
                    print(f"  failedReq: {e}")

    print("\nFull JSON -> smoke-test-result.json")
    sys.exit(0 if fails == 0 else 1)


if __name__ == "__main__":
    main()
