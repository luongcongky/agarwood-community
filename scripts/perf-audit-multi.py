"""
Performance audit cho nhiều mode trong 1 run:
  - viewer: public routes (không login)
  - vip: các route trong (vip) + (member) scope (login VIP)

Usage:
  python scripts/perf-audit-multi.py
  python scripts/perf-audit-multi.py --base http://localhost:3000

Output:
  perf-audit-multi.json  — { viewer: {route: metrics}, vip: {route: metrics} }

Cấu hình dưới đây — chỉnh ROUTES + FIXTURES khi muốn test route mới.
"""
import argparse
import json
import sys
import time
from playwright.sync_api import sync_playwright

# Line buffering để print() hiện trên console ngay thay vì flush lúc exit
# (Python 3.12 Windows mặc định block buffering khi stdout không phải TTY).
sys.stdout.reconfigure(line_buffering=True)

# Fixtures từ query-fixtures.ts (chạy 2026-04-24)
FIXTURES = {
    "newsSlug": "danh-thuc-co-che-tao-tram-cua-cay-do-bau-huong-tiep-can-sinh-hoc-mo-ra-hieu-qua-moi-cho-nganh-tram-huong",
    "productSlug": "tram-huong-tu-nhien",
    "companySlug": "cong-ty-tnhh-liberty-viet-nam-va-dong-duong",
    "memberId": "cmnv89bi4002hkkhpl21cbybq",
    "postId": "cmo9xbu6t000004l29nf0ky5v",
}

VIEWER_ROUTES = [
    "/tin-tuc",
    f"/tin-tuc/{FIXTURES['newsSlug']}",
    "/san-pham-chung-nhan",
    f"/san-pham/{FIXTURES['productSlug']}",
    "/doanh-nghiep",
    f"/doanh-nghiep/{FIXTURES['companySlug']}",
    "/ban-lanh-dao",
    "/gioi-thieu",
    "/phap-ly",
]

VIP_ROUTES = [
    "/tong-quan",
    "/feed",
    "/chung-nhan/lich-su",
    "/tai-lieu",
    "/thanh-toan/lich-su",
]

VIP_EMAIL = "anhpt@hoitramhuong.vn"
VIP_PASSWORD = "Demo@123"


def install_perf_observers(ctx):
    ctx.add_init_script(r"""
    (() => {
        window.__perf = { lcp: [], cls: [], longtasks: [] }
        try { new PerformanceObserver((list) => {
            for (const e of list.getEntries()) window.__perf.lcp.push({
                startTime: e.startTime, renderTime: e.renderTime, loadTime: e.loadTime,
                size: e.size, url: e.url || null,
                tag: e.element ? e.element.tagName : null,
                src: e.element && e.element.currentSrc ? e.element.currentSrc.slice(0,200) : null,
            })
        }).observe({ type: 'largest-contentful-paint', buffered: true }) } catch(_){}
        try { new PerformanceObserver((list) => {
            for (const e of list.getEntries()) if (!e.hadRecentInput) window.__perf.cls.push(e.value)
        }).observe({ type: 'layout-shift', buffered: true }) } catch(_){}
        try { new PerformanceObserver((list) => {
            for (const e of list.getEntries()) window.__perf.longtasks.push({
                startTime: e.startTime, duration: e.duration
            })
        }).observe({ type: 'longtask', buffered: true }) } catch(_){}
    })()
    """)


def collect_metrics(page):
    return page.evaluate(r"""() => {
        const paint = performance.getEntriesByType('paint')
        const nav = performance.getEntriesByType('navigation')[0] || {}
        const p = window.__perf || { lcp: [], cls: [], longtasks: [] }
        const lcp = p.lcp.length ? p.lcp[p.lcp.length-1] : null
        const cls = p.cls.reduce((s, v) => s+v, 0)
        const longTasks = p.longtasks
        const tbt = longTasks.reduce((s,t) => s+Math.max(0,t.duration-50), 0)

        const resources = performance.getEntriesByType('resource').map(r => ({
            url: r.name, type: r.initiatorType,
            transferSize: r.transferSize, decodedSize: r.decodedBodySize,
        }))

        const images = Array.from(document.querySelectorAll('img')).map(img => ({
            src: (img.currentSrc || img.src || '').slice(0, 160),
            loading: img.loading, fetchPriority: img.fetchPriority,
            naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
            displayWidth: Math.round(img.getBoundingClientRect().width),
            displayHeight: Math.round(img.getBoundingClientRect().height),
        }))

        // Oversized: natural > 2× display
        const oversized = images.filter(i => i.naturalWidth && i.displayWidth && i.naturalWidth > i.displayWidth * 2)

        // Images without alt text
        const imgsNoAlt = Array.from(document.querySelectorAll('img:not([alt])')).length
            + Array.from(document.querySelectorAll('img[alt=""]')).length

        return {
            timing: {
                fcp: paint.find(x => x.name === 'first-contentful-paint')?.startTime ?? null,
                lcp: lcp ? (lcp.renderTime || lcp.loadTime || lcp.startTime) : null,
                lcpTag: lcp ? lcp.tag : null,
                lcpSize: lcp ? lcp.size : null,
                lcpSrc: lcp ? (lcp.src || '').slice(0, 140) : null,
                cls,
                tbtApprox: Math.round(tbt),
                transferSize: nav.transferSize,
                loadEvent: Math.round(nav.loadEventEnd || 0),
            },
            dom: {
                totalNodes: document.querySelectorAll('*').length,
                scripts: document.querySelectorAll('script[src]').length,
                stylesheets: document.querySelectorAll('link[rel=stylesheet]').length,
                images: images.length,
                fonts: document.fonts.size,
            },
            totalResources: resources.length,
            byType: (() => {
                const g = {}
                for (const r of resources) {
                    if (!g[r.type]) g[r.type] = { count: 0, bytes: 0 }
                    g[r.type].count++
                    g[r.type].bytes += r.transferSize || 0
                }
                return g
            })(),
            top3Resources: resources.sort((a,b) => (b.transferSize||0)-(a.transferSize||0)).slice(0,3),
            oversizedCount: oversized.length,
            oversizedSamples: oversized.slice(0, 3).map(i => ({
                src: i.src, natural: `${i.naturalWidth}x${i.naturalHeight}`,
                display: `${i.displayWidth}x${i.displayHeight}`,
            })),
            imgsNoAlt,
            longTaskCount: longTasks.length,
            longTaskMaxMs: longTasks.length ? Math.max(...longTasks.map(t => t.duration)) : 0,
        }
    }""")


def login(page, base_url, email, password):
    page.goto(f"{base_url}/login", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(800)
    page.fill('input[type="email"], input[name="email"]', email)
    page.fill('input[type="password"], input[name="password"]', password)
    with page.expect_navigation(timeout=30000):
        page.click('button[type="submit"]')
    cookies = page.context.cookies()
    return any("next-auth" in c["name"].lower() or "authjs" in c["name"].lower() for c in cookies)


def audit_route(page, base_url, route):
    t0 = time.time()
    try:
        page.goto(f"{base_url}{route}", wait_until="load", timeout=60000)
    except Exception as e:
        return {"error": f"nav: {e}"}
    # Debug: log URL thật sau redirect (luôn in)
    actual = page.url
    print(f"    [url] {actual[:140]}")
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass
    page.wait_for_timeout(1500)
    # Scroll để trigger lazy image
    page.evaluate("window.scrollTo(0, Math.min(document.body.scrollHeight, 2000))")
    page.wait_for_timeout(1000)
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(300)

    metrics = collect_metrics(page)
    metrics["navTotalMs"] = round((time.time() - t0) * 1000)
    return metrics


def make_context(browser):
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        user_agent=(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 "
            "Mobile/15E148 Safari/604.1"
        ),
        device_scale_factor=3, is_mobile=True, has_touch=True,
    )
    install_perf_observers(ctx)
    return ctx


def warmup(base_url, routes):
    """Gọi route qua HTTP trước khi đo để Next.js dev compile sẵn. Dev mode
    compile lần đầu mỗi route có thể 3-10s → audit đầu tiên bị trừ oan."""
    import urllib.request
    for r in routes:
        try:
            urllib.request.urlopen(f"{base_url}{r}", timeout=30)
            print(f"  [warmup] {r}")
        except Exception as e:
            print(f"  [warmup] {r} ERR {e}")


def run_mode(browser, base_url, routes, auth):
    ctx = make_context(browser)
    page = ctx.new_page()
    client = page.context.new_cdp_session(page)
    client.send("Network.emulateNetworkConditions", {
        "offline": False,
        "downloadThroughput": 1.6 * 1024 * 1024 / 8,
        "uploadThroughput": 750 * 1024 / 8,
        "latency": 150,
    })
    client.send("Emulation.setCPUThrottlingRate", {"rate": 4})

    if auth:
        email, password = auth
        print(f"  [login] {email}")
        ok = login(page, base_url, email, password)
        print(f"  [login] session cookie: {ok}")
        if not ok:
            ctx.close()
            return {"_login_error": "no auth cookie"}

    out = {}
    for route in routes:
        print(f"  [audit] {route}")
        try:
            out[route] = audit_route(page, base_url, route)
        except Exception as e:
            out[route] = {"error": str(e)}
        # Reset perf buffer
        page.evaluate("window.__perf = { lcp: [], cls: [], longtasks: [] }")
    ctx.close()
    return out


def print_summary(mode_name, results):
    print()
    print(f"=== {mode_name.upper()} ===")
    print(f"{'Route':55} {'FCP':>6} {'LCP':>6} {'TBT':>5} {'DOM':>5} {'kB':>6} {'over':>4}")
    print("-" * 100)
    for route, m in results.items():
        if route.startswith("_"):
            continue
        if "error" in m:
            print(f"{route[:55]:55} ERROR  {m['error'][:40]}")
            continue
        t = m["timing"]
        fcp = f"{t['fcp']:.0f}" if t.get("fcp") else "-"
        lcp = f"{t['lcp']:.0f}" if t.get("lcp") else "-"
        tbt = t.get("tbtApprox", 0)
        dom = m["dom"]["totalNodes"]
        kb = (t.get("transferSize") or 0) / 1024
        over = m.get("oversizedCount", 0)
        print(f"{route[:55]:55} {fcp:>6} {lcp:>6} {tbt:>5} {dom:>5} {kb:>6.0f} {over:>4}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("--skip-viewer", action="store_true")
    ap.add_argument("--skip-vip", action="store_true")
    ap.add_argument("--warmup", action="store_true", help="HTTP pre-warm (dev mode only)")
    args = ap.parse_args()

    all_results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        if not args.skip_viewer:
            print("[viewer mode — unauthenticated]")
            # Warmup chỉ cần khi dev mode — prod build đã precompile. Ở prod,
            # skip để tiết kiệm ~30s per-route timeout mà không giúp gì thêm.
            if args.warmup:
                print("  pre-warming routes...")
                warmup(args.base, VIEWER_ROUTES)
            all_results["viewer"] = run_mode(browser, args.base, VIEWER_ROUTES, auth=None)
        if not args.skip_vip:
            # VIP routes đi qua middleware auth → HTTP GET không auth sẽ
            # redirect /login (không compile được route target). Bỏ warmup
            # HTTP, để Playwright tự chịu compile phí lần đầu.
            print("[vip mode — login]")
            all_results["vip"] = run_mode(browser, args.base, VIP_ROUTES, auth=(VIP_EMAIL, VIP_PASSWORD))
        browser.close()

    with open("perf-audit-multi.json", "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False, default=str)

    for mode, results in all_results.items():
        print_summary(mode, results)
    print()
    print("Full JSON -> perf-audit-multi.json")
