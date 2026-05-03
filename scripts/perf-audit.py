"""
Performance audit tool — reproduce PageSpeed-like conditions với Playwright.

Usage:
  python scripts/perf-audit.py <url>
  python scripts/perf-audit.py https://www.hoitramhuong.vn/

Output:
  perf-audit-result.json  — full metrics dump
  perf-audit.png          — full-page mobile screenshot
  perf-audit-console.txt  — captured console logs (warnings, errors)

Emulate Lighthouse mobile:
  - Viewport 390x844 (iPhone 13), DPR 3, touch, mobile UA
  - Network: Slow 4G (1.6 Mbps down / 750 Kbps up, 150ms RTT)
  - CPU: 4x slowdown

Metrics captured:
  - Core Web Vitals: FCP, LCP, CLS, TBT (approx via long-task observer)
  - Resource list với transferSize, type, thirdParty flag
  - DOM size, scripts (async/defer), stylesheets
  - Images: natural vs display size, lazy loading, format, fetchpriority
  - Fonts: preloaded, count
  - JS/CSS coverage (unused bytes)
"""
import json
import sys
import time
from playwright.sync_api import sync_playwright


def is_third_party(host: str, target_hosts: list[str]) -> bool:
    return not any(host.endswith(h) for h in target_hosts)


def audit(url: str) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 "
                "Mobile/15E148 Safari/604.1"
            ),
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
        )
        # Install perf observers BEFORE navigation — getEntriesByType chỉ
        # trả về entries mà observer đã "buffered:true" hoặc observed live.
        # Ghi vào window.__perf để evaluate() đọc sau.
        ctx.add_init_script(r"""
        (() => {
            window.__perf = { lcp: [], cls: [], longtasks: [], fid: null }
            try {
                new PerformanceObserver((list) => {
                    for (const e of list.getEntries()) {
                        window.__perf.lcp.push({
                            startTime: e.startTime,
                            renderTime: e.renderTime,
                            loadTime: e.loadTime,
                            size: e.size,
                            url: e.url || null,
                            tag: e.element ? e.element.tagName : null,
                            id: e.element ? e.element.id : null,
                            className: e.element ? String(e.element.className || '').slice(0,200) : null,
                            src: e.element && e.element.currentSrc ? e.element.currentSrc.slice(0,200) : null,
                        })
                    }
                }).observe({ type: 'largest-contentful-paint', buffered: true })
            } catch (_) {}
            try {
                new PerformanceObserver((list) => {
                    for (const e of list.getEntries()) {
                        if (!e.hadRecentInput) window.__perf.cls.push(e.value)
                    }
                }).observe({ type: 'layout-shift', buffered: true })
            } catch (_) {}
            try {
                new PerformanceObserver((list) => {
                    for (const e of list.getEntries()) {
                        window.__perf.longtasks.push({
                            startTime: e.startTime,
                            duration: e.duration,
                        })
                    }
                }).observe({ type: 'longtask', buffered: true })
            } catch (_) {}
        })()
        """)

        page = ctx.new_page()

        # Log console + failed requests
        console_logs: list[str] = []
        failed: list[str] = []
        page.on("console", lambda m: console_logs.append(f"[{m.type}] {m.text}"))
        page.on("requestfailed", lambda r: failed.append(f"{r.method} {r.url} — {r.failure}"))

        # CDP throttling — Slow 4G + 4x CPU
        client = page.context.new_cdp_session(page)
        client.send("Network.emulateNetworkConditions", {
            "offline": False,
            "downloadThroughput": 1.6 * 1024 * 1024 / 8,
            "uploadThroughput": 750 * 1024 / 8,
            "latency": 150,
        })
        client.send("Emulation.setCPUThrottlingRate", {"rate": 4})

        # Coverage via CDP (Playwright Python sync API không có page.coverage).
        client.send("Profiler.enable")
        client.send("Profiler.startPreciseCoverage", {
            "callCount": False,
            "detailed": True,
        })
        client.send("DOM.enable")
        client.send("CSS.enable")
        client.send("CSS.startRuleUsageTracking")

        target_host = url.split("/")[2]
        target_hosts = [target_host.lstrip("www.")]

        # Navigate, wait for load + buffered LCP entries to settle
        nav_start = time.time()
        try:
            page.goto(url, wait_until="load", timeout=90000)
        except Exception as e:
            print(f"navigation error: {e}", file=sys.stderr)
        # On throttled mobile, LCP often lands 6-10s after nav start. Wait
        # until either networkidle or a hard cap, whichever comes first.
        try:
            page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            pass
        page.wait_for_timeout(2000)
        nav_total_ms = (time.time() - nav_start) * 1000

        # Scroll to trigger lazy images so we can also audit those
        page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
        page.wait_for_timeout(1500)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(500)

        metrics = page.evaluate(r"""() => {
            const paint = performance.getEntriesByType('paint')
            const nav = performance.getEntriesByType('navigation')[0] || {}

            // LCP from init-script observer (PerformanceObserver register trước
            // navigation) — cuối mảng = last LCP before user interaction
            const perfData = window.__perf || { lcp: [], cls: [], longtasks: [] }
            const lcp = perfData.lcp.length ? perfData.lcp[perfData.lcp.length - 1] : null

            // CLS cộng dồn
            const cls = perfData.cls.reduce((sum, v) => sum + v, 0)

            // Long tasks — TBT = sum(max(0, duration - 50ms)) cho mỗi task
            const longTasks = perfData.longtasks
            const tbt = longTasks.reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0)

            const resources = performance.getEntriesByType('resource').map(r => ({
                url: r.name,
                type: r.initiatorType,
                transferSize: r.transferSize,
                encodedSize: r.encodedBodySize,
                decodedSize: r.decodedBodySize,
                duration: Math.round(r.duration),
                startTime: Math.round(r.startTime),
                responseEnd: Math.round(r.responseEnd),
                protocol: r.nextHopProtocol,
            }))

            const images = Array.from(document.querySelectorAll('img')).map(img => ({
                src: (img.currentSrc || img.src || '').slice(0, 200),
                alt: img.alt,
                loading: img.loading,
                fetchPriority: img.fetchPriority,
                decoding: img.decoding,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                displayWidth: Math.round(img.getBoundingClientRect().width),
                displayHeight: Math.round(img.getBoundingClientRect().height),
                inViewportInitial: img.getBoundingClientRect().top < 844,
            }))

            const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => ({
                src: s.src.slice(0, 200),
                async: s.async,
                defer: s.defer,
                module: s.type === 'module',
            }))

            const stylesheets = Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(s => ({
                href: s.href.slice(0, 200),
                media: s.media,
            }))

            const preloads = Array.from(document.querySelectorAll('link[rel=preload], link[rel=preconnect], link[rel=dns-prefetch]')).map(l => ({
                rel: l.rel, href: l.href.slice(0, 200), as: l.as,
            }))

            const fonts = Array.from(document.fonts).map(f => ({
                family: f.family,
                weight: f.weight,
                style: f.style,
                display: f.display,
                status: f.status,
            }))

            return {
                timing: {
                    fp: paint.find(p => p.name === 'first-paint')?.startTime ?? null,
                    fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime ?? null,
                    lcp: lcp ? (lcp.renderTime || lcp.loadTime || lcp.startTime) : null,
                    lcpElement: lcp ? {
                        url: lcp.url,
                        src: lcp.src,
                        size: lcp.size,
                        tag: lcp.tag,
                        id: lcp.id,
                        className: lcp.className,
                    } : null,
                    cls,
                    tbtApprox: Math.round(tbt),
                    domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
                    loadEvent: Math.round(nav.loadEventEnd || 0),
                    transferSize: nav.transferSize,
                    encodedBodySize: nav.encodedBodySize,
                    decodedBodySize: nav.decodedBodySize,
                },
                dom: {
                    totalNodes: document.querySelectorAll('*').length,
                    depth: (function maxDepth(n) {
                        if (!n.children || !n.children.length) return 1
                        return 1 + Math.max(...[...n.children].map(maxDepth))
                    })(document.body),
                    images: images.length,
                    scripts: scripts.length,
                    stylesheets: stylesheets.length,
                    fonts: fonts.length,
                },
                images,
                scripts,
                stylesheets,
                preloads,
                fonts,
                resources,
                longTaskCount: longTasks.length,
                longTaskMaxMs: Math.max(0, ...longTasks.map(t => t.duration)),
            }
        }""")

        # CSS coverage — takeCoverageDelta returns per-stylesheet usage.
        try:
            css_result = client.send("CSS.takeCoverageDelta")
            css_entries = css_result.get("coverage", [])
            css_total = sum(e["endOffset"] - e["startOffset"] for e in css_entries)
            css_used = sum(
                e["endOffset"] - e["startOffset"] for e in css_entries if e.get("used")
            )
            css_summary = {
                "entryCount": len(css_entries),
                "totalBytes": css_total,
                "usedBytes": css_used,
                "unusedBytes": max(0, css_total - css_used),
            }
        except Exception as e:
            css_summary = {"error": str(e)}

        # JS coverage — Profiler.takePreciseCoverage per-script function ranges.
        try:
            js_result = client.send("Profiler.takePreciseCoverage")
            js_total = 0
            js_used = 0
            js_per_file = []
            for script in js_result.get("result", []):
                url = script.get("url") or ""
                if not url or url.startswith("chrome-extension:"):
                    continue
                file_total = 0
                file_used = 0
                for fn in script.get("functions", []):
                    for rng in fn.get("ranges", []):
                        size = rng.get("endOffset", 0) - rng.get("startOffset", 0)
                        file_total = max(file_total, rng.get("endOffset", 0))
                        if rng.get("count", 0) > 0:
                            file_used += size
                # file_total = max end offset seen — approximates script size
                js_total += file_total
                js_used += min(file_used, file_total)
                unused = max(0, file_total - min(file_used, file_total))
                if file_total > 10_000:  # skip tiny scripts
                    js_per_file.append({
                        "url": url[:200],
                        "totalBytes": file_total,
                        "unusedBytes": unused,
                        "pctUnused": round(unused / file_total * 100, 1) if file_total else 0,
                    })
            js_per_file.sort(key=lambda x: x["unusedBytes"], reverse=True)
            js_summary = {
                "totalBytes": js_total,
                "usedBytes": js_used,
                "unusedBytes": max(0, js_total - js_used),
                "fileCount": len(js_per_file),
            }
        except Exception as e:
            js_summary = {"error": str(e)}
            js_per_file = []

        coverage = {"js": js_summary, "css": css_summary}

        # Classify third-party resources
        resources = metrics["resources"]
        third_party_hosts: dict[str, int] = {}
        for r in resources:
            try:
                host = r["url"].split("/")[2]
            except IndexError:
                continue
            if is_third_party(host, target_hosts):
                third_party_hosts[host] = third_party_hosts.get(host, 0) + (r["transferSize"] or 0)

        # Resource size buckets
        size_by_type: dict[str, dict] = {}
        for r in resources:
            t = r["type"]
            if t not in size_by_type:
                size_by_type[t] = {"count": 0, "bytes": 0}
            size_by_type[t]["count"] += 1
            size_by_type[t]["bytes"] += r["transferSize"] or 0

        # Top 15 largest resources overall
        top_resources = sorted(resources, key=lambda r: r["transferSize"] or 0, reverse=True)[:15]

        # Image efficiency — display vs natural (oversized = wasted bytes)
        oversized = []
        for img in metrics["images"]:
            nw, nh = img["naturalWidth"], img["naturalHeight"]
            dw, dh = img["displayWidth"], img["displayHeight"]
            if nw and dw and nw > dw * 2 and dh > 0:  # served 2x+ larger than displayed
                oversized.append({
                    "src": img["src"],
                    "natural": f"{nw}x{nh}",
                    "display": f"{dw}x{dh}",
                    "waste": round((1 - (dw * dh) / (nw * nh)) * 100, 1),
                })

        page.screenshot(path="perf-audit.png", full_page=True)

        browser.close()

        return {
            "url": url,
            "navTotalMs": round(nav_total_ms),
            **metrics,
            "thirdPartyHosts": sorted(third_party_hosts.items(), key=lambda x: -x[1]),
            "resourceSizeByType": size_by_type,
            "topResources": top_resources,
            "coverage": coverage,
            "jsPerFileTopUnused": js_per_file[:15],
            "oversizedImages": oversized,
            "consoleLogs": console_logs[:50],
            "failedRequests": failed,
        }


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "https://www.hoitramhuong.vn/"
    print(f"Auditing {target} ...")
    result = audit(target)
    with open("perf-audit-result.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False, default=str)
    def fmt(v):
        return f"{v:.0f}" if isinstance(v, (int, float)) else str(v)
    print(f"FCP: {fmt(result['timing']['fcp'])} ms")
    print(f"LCP: {fmt(result['timing']['lcp'])} ms  element: {result['timing']['lcpElement']}")
    print(f"CLS: {result['timing']['cls']}")
    print(f"TBT (approx): {result['timing']['tbtApprox']} ms")
    print(f"DOM nodes: {result['dom']['totalNodes']}")
    print(f"Transfer: {result['timing']['transferSize']} bytes")
    js = result['coverage'].get('js', {})
    if 'unusedBytes' in js:
        print(f"JS unused: {js['unusedBytes']} / {js['totalBytes']} bytes ({js['fileCount']} files)")
    print(f"Third parties: {len(result['thirdPartyHosts'])}")
    print(f"Oversized images: {len(result['oversizedImages'])}")
    print("\nFull result -> perf-audit-result.json")
    print("Screenshot   -> perf-audit.png")
