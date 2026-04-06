import { test, expect } from "@playwright/test"

test.describe("Performance Checks", () => {
  test("TC-PERF-01: Trang chu load < 3s", async ({ page }) => {
    const start = Date.now()
    await page.goto("/", { waitUntil: "domcontentloaded" })
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(3000)
  })

  test("TC-PERF-02: Feed load < 3s", async ({ page }) => {
    const start = Date.now()
    await page.goto("/feed", { waitUntil: "domcontentloaded" })
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(3000)
  })

  test("TC-PERF-03: San pham listing load < 3s", async ({ page }) => {
    const start = Date.now()
    await page.goto("/san-pham-chung-nhan", { waitUntil: "domcontentloaded" })
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(3000)
  })

  test("TC-PERF-04: Recharts khong load tren trang chu", async ({ page }) => {
    const jsRequests: string[] = []
    page.on("response", (res) => {
      if (res.url().includes(".js") && res.url().includes("recharts")) {
        jsRequests.push(res.url())
      }
    })
    await page.goto("/", { waitUntil: "networkidle" })
    expect(jsRequests.length).toBe(0)
  })

  test("TC-PERF-05: Khong co layout shift (CLS check)", async ({ page }) => {
    await page.goto("/")
    // Wait for full render
    await page.waitForTimeout(2000)
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // @ts-ignore
            if (!entry.hadRecentInput) clsValue += entry.value
          }
        })
        observer.observe({ type: "layout-shift", buffered: true })
        setTimeout(() => { observer.disconnect(); resolve(clsValue) }, 1000)
      })
    })
    expect(cls).toBeLessThan(0.1)
  })

  test("TC-PERF-06: No broken images on trang chu", async ({ page }) => {
    const brokenImages: string[] = []
    page.on("response", (res) => {
      if (res.request().resourceType() === "image" && res.status() >= 400) {
        brokenImages.push(res.url())
      }
    })
    await page.goto("/", { waitUntil: "networkidle" })
    expect(brokenImages).toEqual([])
  })

  test("TC-PERF-07: No console errors on key pages", async ({ page }) => {
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })

    await page.goto("/")
    await page.goto("/feed")
    await page.goto("/tin-tuc")
    await page.goto("/san-pham-chung-nhan")
    await page.goto("/dich-vu")

    // Filter out known benign errors (hydration, etc)
    const realErrors = errors.filter((e) =>
      !e.includes("hydrat") && !e.includes("404") && !e.includes("favicon")
    )
    expect(realErrors.length).toBe(0)
  })

  test("TC-PERF-08: API /api/posts responds < 1s", async ({ page }) => {
    const start = Date.now()
    const response = await page.request.get("/api/posts")
    const elapsed = Date.now() - start
    expect(response.status()).toBe(200)
    expect(elapsed).toBeLessThan(1000)
  })
})
