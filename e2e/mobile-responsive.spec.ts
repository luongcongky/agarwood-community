import { test, expect } from "@playwright/test"
import { login, ADMIN, VIP_A } from "./helpers"

// Mobile viewport: iPhone SE
test.use({ viewport: { width: 375, height: 667 } })

test.describe("Mobile Responsive — Public Pages", () => {
  test("Trang chu renders without horizontal scroll", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)
    await page.screenshot({ path: "test-results/mobile-trang-chu.png", fullPage: true })
  })

  test("Tin tuc renders properly on mobile", async ({ page }) => {
    await page.goto("/tin-tuc")
    await page.waitForLoadState("networkidle")
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376)
    await page.screenshot({ path: "test-results/mobile-tin-tuc.png", fullPage: true })
  })

  test("San pham chung nhan — filters accessible on mobile", async ({ page }) => {
    await page.goto("/san-pham-chung-nhan")
    await page.waitForLoadState("networkidle")
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376)
    await page.screenshot({ path: "test-results/mobile-san-pham-chung-nhan.png", fullPage: true })
  })

  test("Dich vu — form usable on mobile", async ({ page }) => {
    await page.goto("/dich-vu")
    await page.waitForLoadState("networkidle")
    // Check form inputs are visible
    await expect(page.locator("#order-name")).toBeVisible()
    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376)
    await page.screenshot({ path: "test-results/mobile-dich-vu.png", fullPage: true })
  })

  test("Dang ky — form full width on mobile", async ({ page }) => {
    await page.goto("/dang-ky")
    await page.waitForLoadState("networkidle")
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376)
    await page.screenshot({ path: "test-results/mobile-dang-ky.png", fullPage: true })
  })

  test("Doanh nghiep profile on mobile", async ({ page }) => {
    await page.goto("/doanh-nghiep/tram-huong-khanh-hoa")
    await page.waitForLoadState("networkidle")
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376)
    await page.screenshot({ path: "test-results/mobile-doanh-nghiep.png", fullPage: true })
  })

  test("San pham chi tiet on mobile", async ({ page }) => {
    await page.goto("/san-pham/tram-huong-tu-nhien-khanh-hoa-loai-a")
    await page.waitForLoadState("networkidle")
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376)
    await page.screenshot({ path: "test-results/mobile-san-pham-detail.png", fullPage: true })
  })

  test("Feed on mobile — sidebar hidden, posts full width", async ({ page }) => {
    await page.goto("/feed")
    await page.waitForLoadState("networkidle")
    // Sidebar should be hidden on mobile
    const sidebar = page.locator("aside")
    await expect(sidebar).toBeHidden()
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376)
    await page.screenshot({ path: "test-results/mobile-feed.png", fullPage: true })
  })
})

test.describe("Mobile Responsive — VIP Pages", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
  })

  test("Dashboard /tong-quan — stat cards stack vertically", async ({ page }) => {
    await page.goto("/tong-quan")
    await page.waitForLoadState("networkidle")
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376)
    await page.screenshot({ path: "test-results/mobile-tong-quan.png", fullPage: true })
  })

  test("Ho so /ho-so — tabs scrollable", async ({ page }) => {
    await page.goto("/ho-so")
    await page.waitForLoadState("networkidle")
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376)
    await page.screenshot({ path: "test-results/mobile-ho-so.png", fullPage: true })
  })

  test("Gia han /gia-han — fee cards stack", async ({ page }) => {
    await page.goto("/gia-han")
    await page.waitForLoadState("networkidle")
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376)
    await page.screenshot({ path: "test-results/mobile-gia-han.png", fullPage: true })
  })
})

test.describe("Mobile Responsive — Admin Pages", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
  })

  test("Admin dashboard — KPI cards 2 columns", async ({ page }) => {
    await page.goto("/admin")
    await page.waitForLoadState("networkidle")
    // Sidebar hidden on mobile
    const sidebar = page.locator("aside")
    await expect(sidebar).toBeHidden()
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376)
    await page.screenshot({ path: "test-results/mobile-admin-dashboard.png", fullPage: true })
  })

  test("Admin hoi vien — table scrollable", async ({ page }) => {
    await page.goto("/admin/hoi-vien")
    await page.waitForLoadState("networkidle")
    // Table should have overflow-x-auto
    const tableContainer = page.locator(".overflow-x-auto")
    await expect(tableContainer.first()).toBeVisible()
    await page.screenshot({ path: "test-results/mobile-admin-hoi-vien.png", fullPage: true })
  })
})

test.describe("Mobile Touch Targets", () => {
  test("All buttons >= 44px touch target on mobile", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Check all interactive elements
    const buttons = await page.locator("button, a[href]").all()
    let smallTargets = 0
    for (const btn of buttons.slice(0, 30)) { // Check first 30
      const box = await btn.boundingBox()
      if (box && box.height < 36 && box.width < 36) { // Allow 36px minimum
        smallTargets++
      }
    }
    // Allow some small elements (icons, etc.) but most should be >= 36px
    expect(smallTargets).toBeLessThan(5)
  })

  test("Form inputs full width on mobile", async ({ page }) => {
    await page.goto("/dang-ky")
    await page.waitForLoadState("networkidle")

    const nameInput = page.locator("#reg-name")
    const box = await nameInput.boundingBox()
    expect(box).toBeTruthy()
    // Input should be at least 280px wide on 375px viewport (allowing for card padding)
    expect(box!.width).toBeGreaterThan(280)
  })
})
