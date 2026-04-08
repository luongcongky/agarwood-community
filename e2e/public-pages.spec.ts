import { test, expect } from "@playwright/test"

test.describe("Public Pages", () => {
  test("TC-PUB-01: Trang chu / load dung", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=Hội Trầm Hương").first()).toBeVisible()
  })

  test("TC-PUB-02: Tin tuc /tin-tuc load dung", async ({ page }) => {
    await page.goto("/tin-tuc")
    await expect(page.locator("text=Tin tức").first()).toBeVisible()
  })

  test("TC-PUB-03: San pham chung nhan /san-pham-chung-nhan", async ({ page }) => {
    await page.goto("/san-pham-chung-nhan")
    await expect(page.locator("text=Sản phẩm Chứng nhận")).toBeVisible()
  })

  test("TC-PUB-04: Dich vu /dich-vu co form dat hang", async ({ page }) => {
    await page.goto("/dich-vu")
    await expect(page.locator("text=Dịch vụ Truyền thông")).toBeVisible()
    await expect(page.locator("text=Đặt dịch vụ ngay")).toBeVisible()
    // Form fields present
    await expect(page.locator("#order-name")).toBeVisible()
    await expect(page.locator("#order-email")).toBeVisible()
  })

  test("TC-PUB-05: Doanh nghiep profile /doanh-nghiep/[slug]", async ({ page }) => {
    await page.goto("/doanh-nghiep/tram-huong-khanh-hoa")
    await expect(page.getByRole("heading", { name: "Trầm Hương Khánh Hòa" })).toBeVisible()
    // Tabs visible
    await expect(page.locator("text=Giới thiệu").first()).toBeVisible()
    await expect(page.locator("text=/Sản phẩm/").first()).toBeVisible()
  })

  test("TC-PUB-06: San pham chi tiet /san-pham/[slug]", async ({ page }) => {
    await page.goto("/san-pham/tram-huong-tu-nhien-khanh-hoa-loai-a")
    await expect(page.getByRole("heading", { name: /Trầm Hương Tự Nhiên Khánh Hòa/ })).toBeVisible()
    // Breadcrumb
    await expect(page.getByRole("main").locator("text=Trang chủ")).toBeVisible()
    // CTA for guest
    await expect(page.locator("text=Liên hệ doanh nghiệp")).toBeVisible()
  })

  test("TC-PUB-07: Verify chung nhan /verify/[code] — SP duoc duyet", async ({ page }) => {
    await page.goto("/verify/tram-huong-tu-nhien-khanh-hoa-loai-a")
    await expect(page.locator("text=Sản phẩm đã được chứng nhận")).toBeVisible()
  })

  test("TC-PUB-08: Verify chung nhan — ma khong ton tai", async ({ page }) => {
    await page.goto("/verify/ma-khong-ton-tai-xyz")
    await expect(page.locator("text=Mã chứng nhận không hợp lệ")).toBeVisible()
  })

  test("TC-PUB-09: Guest xem feed — blur tu bai 4", async ({ page }) => {
    await page.goto("/feed")
    // Feed loads for guest
    await expect(page).toHaveURL(/\/feed/)
    // Login CTA visible in sidebar or blur overlay
    const loginLink = page.locator('a:has-text("Đăng nhập")')
    await expect(loginLink.first()).toBeVisible()
  })

  test("TC-PUB-10: Sitemap.xml co noi dung", async ({ page }) => {
    const response = await page.goto("/sitemap.xml")
    expect(response?.status()).toBe(200)
    const text = await response?.text()
    expect(text).toContain("<urlset")
    expect(text).toContain("<url>")
  })

  test("TC-PUB-11: Dich vu form validation", async ({ page }) => {
    await page.goto("/dich-vu")
    // Submit empty form
    await page.click('button:has-text("Gửi đơn hàng")')
    // Validation errors should appear
    await expect(page.locator("text=Vui lòng nhập họ và tên")).toBeVisible()
  })
})
