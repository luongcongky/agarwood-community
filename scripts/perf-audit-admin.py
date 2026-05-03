"""
Performance audit cho khu admin — đăng nhập 1 lần rồi duyệt nhiều route.
Đo Core Web Vitals + các chỉ số theo `documents/performance-checklist.md`.

Usage:
  python scripts/perf-audit-admin.py [base-url] [email] [password]
  python scripts/perf-audit-admin.py http://localhost:3000 admin@hoitramhuong.vn Demo@123

Output:
  perf-audit-admin.json   — dict { route: metrics }
  perf-audit-admin-*.png  — screenshot mỗi route
"""
import json
import sys
import time
from playwright.sync_api import sync_playwright


ROUTES = [
    "/admin",
    "/admin/tin-tuc",
    "/admin/hoi-vien",
    "/admin/chung-nhan",
    "/admin/bai-viet/cho-duyet",
    "/admin/san-pham/dai-hoi-bau-cu-nhiem-ky-iv/sua",  # Nếu slug này không có, bỏ qua
]


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
            duration: Math.round(r.duration),
        }))

        const images = Array.from(document.querySelectorAll('img')).map(img => ({
            src: (img.currentSrc || img.src || '').slice(0,160),
            loading: img.loading, fetchPriority: img.fetchPriority,
            naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
            displayWidth: Math.round(img.getBoundingClientRect().width),
            displayHeight: Math.round(img.getBoundingClientRect().height),
        }))

        return {
            timing: {
                fcp: paint.find(x => x.name === 'first-contentful-paint')?.startTime ?? null,
                lcp: lcp ? (lcp.renderTime || lcp.loadTime || lcp.startTime) : null,
                lcpSrc: lcp ? lcp.src : null,
                lcpTag: lcp ? lcp.tag : null,
                lcpSize: lcp ? lcp.size : null,
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
            resources: {
                total: resources.length,
                byType: (() => {
                    const g = {}
                    for (const r of resources) {
                        if (!g[r.type]) g[r.type] = { count: 0, bytes: 0 }
                        g[r.type].count++
                        g[r.type].bytes += r.transferSize || 0
                    }
                    return g
                })(),
            },
            images,
            top5Resources: resources.sort((a,b) => (b.transferSize||0)-(a.transferSize||0)).slice(0,5),
            longTaskCount: longTasks.length,
            longTaskMaxMs: Math.max(0, ...longTasks.map(t => t.duration)),
        }
    }""")


def login(page, base_url, email, password):
    """Login qua form /login (NextAuth credentials provider)."""
    page.goto(f"{base_url}/login", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(1000)
    # Fill credentials form — inspect thực tế có thể dùng type=email/password
    page.fill('input[type="email"], input[name="email"]', email)
    page.fill('input[type="password"], input[name="password"]', password)
    with page.expect_navigation(timeout=30000):
        page.click('button[type="submit"]')
    # Kiểm tra có cookie auth
    cookies = page.context.cookies()
    has_session = any("next-auth" in c["name"].lower() or "authjs" in c["name"].lower() for c in cookies)
    return has_session


def audit_route(page, base_url, route):
    """Audit 1 route — nav + wait + collect metrics + screenshot."""
    t0 = time.time()
    url = f"{base_url}{route}"
    try:
        page.goto(url, wait_until="load", timeout=60000)
    except Exception as e:
        return {"error": f"navigation failed: {e}"}
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass
    page.wait_for_timeout(2000)
    # Scroll để trigger lazy image
    page.evaluate("window.scrollTo(0, Math.min(document.body.scrollHeight, 2000))")
    page.wait_for_timeout(1000)
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(500)

    metrics = collect_metrics(page)
    metrics["navTotalMs"] = round((time.time() - t0) * 1000)

    # Screenshot
    safe_name = route.replace("/", "_").strip("_") or "root"
    page.screenshot(path=f"perf-audit-admin-{safe_name}.png", full_page=False)
    return metrics


def audit(base_url: str, email: str, password: str):
    results: dict = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
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
        page = ctx.new_page()

        client = page.context.new_cdp_session(page)
        client.send("Network.emulateNetworkConditions", {
            "offline": False,
            "downloadThroughput": 1.6 * 1024 * 1024 / 8,
            "uploadThroughput": 750 * 1024 / 8,
            "latency": 150,
        })
        client.send("Emulation.setCPUThrottlingRate", {"rate": 4})

        print(f"[login] {email} → {base_url}/login")
        ok = login(page, base_url, email, password)
        print(f"[login] session cookie present: {ok}")
        if not ok:
            results["_login_error"] = "no auth cookie after login"
            return results

        for route in ROUTES:
            print(f"[audit] {route} ...")
            try:
                results[route] = audit_route(page, base_url, route)
            except Exception as e:
                results[route] = {"error": str(e)}
            # Reset buffers between routes — clear the perf observer store
            # so each route's LCP/CLS/longtasks refer to that route's nav only.
            page.evaluate("window.__perf = { lcp: [], cls: [], longtasks: [] }")

        browser.close()
    return results


if __name__ == "__main__":
    base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
    email = sys.argv[2] if len(sys.argv) > 2 else "admin@hoitramhuong.vn"
    password = sys.argv[3] if len(sys.argv) > 3 else "Demo@123"

    results = audit(base, email, password)
    with open("perf-audit-admin.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)

    # Summary
    print()
    print(f"{'Route':45} {'FCP':>7} {'LCP':>7} {'TBT':>6} {'DOM':>5} {'scr':>4} {'kB':>7}")
    print("-" * 90)
    for route, m in results.items():
        if route.startswith("_"):
            continue
        if "error" in m:
            print(f"{route:45} ERROR {m['error'][:40]}")
            continue
        t = m["timing"]
        d = m["dom"]
        fcp = f"{t['fcp']:.0f}" if t.get("fcp") else "-"
        lcp = f"{t['lcp']:.0f}" if t.get("lcp") else "-"
        tbt = t.get("tbtApprox", 0)
        dom = d.get("totalNodes", 0)
        scr = d.get("scripts", 0)
        kb = (t.get("transferSize") or 0) / 1024
        print(f"{route:45} {fcp:>7} {lcp:>7} {tbt:>6} {dom:>5} {scr:>4} {kb:>7.0f}")
