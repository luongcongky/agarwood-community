import { test, expect } from "@playwright/test"
import { login, VIP_A, VIP_B } from "./helpers"

test.describe("VIP Pages", () => {
  test("TC-VIP-01: Dashboard /tong-quan hien thi dung", async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
    await page.goto("/tong-quan")
    // Should show greeting + name
    await expect(page.getByRole("heading", { name: /Nguyễn Văn A/ })).toBeVisible()
    // Should show stat cards
    await expect(page.locator("text=Membership")).toBeVisible()
    await expect(page.locator("text=Bài viết").first()).toBeVisible()
  })

  test("TC-VIP-02: Ho so /ho-so hien thi 4 tabs", async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
    await page.goto("/ho-so")
    await expect(page.locator("text=Thông tin cá nhân")).toBeVisible()
    await expect(page.locator("text=Ngân hàng")).toBeVisible()
    await expect(page.locator("text=Bảo mật")).toBeVisible()
    await expect(page.locator("text=Lịch sử")).toBeVisible()
  })

  test("TC-VIP-03: Gia han /gia-han hien thi muc phi", async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
    await page.goto("/gia-han")
    await expect(page.locator("text=Membership của bạn")).toBeVisible()
    // Fee options should show (from SiteConfig)
    await expect(page.locator("text=/năm/").first()).toBeVisible()
    await expect(page.locator("text=Được khuyến nghị")).toBeVisible()
  })

  test("TC-VIP-04: Thanh toan lich su /thanh-toan/lich-su", async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
    await page.goto("/thanh-toan/lich-su")
    await expect(page.locator("text=Lịch sử thanh toán")).toBeVisible()
  })

  test("TC-VIP-05: Doanh nghiep cua minh co nut Chinh sua", async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
    await page.goto("/doanh-nghiep/tram-huong-ha-noi")
    await expect(page.locator("text=Chỉnh sửa")).toBeVisible()
  })

  test("TC-VIP-06: Doanh nghiep cua nguoi khac KHONG co nut Chinh sua", async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
    await page.goto("/doanh-nghiep/tram-huong-sai-gon")
    // Page should load but no edit button in header
    await expect(page.locator("text=Trầm Hương Sài Gòn")).toBeVisible()
    const editButtons = page.locator('a:has-text("Chỉnh sửa")').filter({ hasText: "Chỉnh sửa" })
    await expect(editButtons).toHaveCount(0)
  })

  test("TC-VIP-07: Feed hien thi bai viet + nut dang bai", async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
    await page.goto("/feed")
    // Quick post box visible for VIP
    await expect(page.locator("text=Chia sẻ kiến thức")).toBeVisible()
    // Top contributors sidebar (desktop)
    await expect(page.locator("text=Hội viên tiêu biểu")).toBeVisible()
  })

  test("TC-VIP-08: Chung nhan lich su /chung-nhan/lich-su", async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
    await page.goto("/chung-nhan/lich-su")
    await expect(page.locator("text=Lịch sử chứng nhận")).toBeVisible()
  })
})
