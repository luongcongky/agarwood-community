import { test, expect } from "@playwright/test"
import { login, ADMIN } from "./helpers"

test.describe("Admin Pages", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
  })

  test("TC-ADMIN-01: Dashboard /admin hien thi KPI cards", async ({ page }) => {
    await page.goto("/admin")
    await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible()
    await expect(page.locator("text=Hội viên Active").first()).toBeVisible()
    await expect(page.locator("text=Doanh thu tháng")).toBeVisible()
    await expect(page.locator("text=SP Chứng nhận")).toBeVisible()
    await expect(page.locator("text=Đơn Truyền thông").first()).toBeVisible()
  })

  test("TC-ADMIN-02: Dashboard hien thi activity feed", async ({ page }) => {
    await page.goto("/admin")
    await expect(page.locator("text=Hoạt động gần đây")).toBeVisible()
  })

  test("TC-ADMIN-03: Quan ly hoi vien /admin/hoi-vien", async ({ page }) => {
    await page.goto("/admin/hoi-vien")
    await expect(page.locator("text=Quản lý Hội viên")).toBeVisible()
    await expect(page.locator("text=slot")).toBeVisible()
    // Should show member table
    await expect(page.locator("text=Nguyễn Văn A")).toBeVisible()
  })

  test("TC-ADMIN-04: Hoi vien filter tabs hoat dong", async ({ page }) => {
    await page.goto("/admin/hoi-vien")
    // Click "Active" tab
    await page.click('a:has-text("Active")')
    await expect(page).toHaveURL(/status=active/)
  })

  test("TC-ADMIN-05: Xac nhan CK /admin/thanh-toan", async ({ page }) => {
    await page.goto("/admin/thanh-toan")
    await expect(page.locator("text=Xác nhận Chuyển khoản")).toBeVisible()
  })

  test("TC-ADMIN-06: Chung nhan /admin/chung-nhan", async ({ page }) => {
    await page.goto("/admin/chung-nhan")
    // Page should load with status tabs
    await expect(page.locator("text=Tất cả")).toBeVisible()
  })

  test("TC-ADMIN-07: Truyen thong /admin/truyen-thong co summary cards", async ({ page }) => {
    await page.goto("/admin/truyen-thong")
    await expect(page.locator("text=Quản lý Đơn Truyền thông")).toBeVisible()
    // Summary cards
    await expect(page.locator("text=Mới").first()).toBeVisible()
    await expect(page.locator("text=Đang làm").first()).toBeVisible()
    await expect(page.locator("text=Hoàn tất").first()).toBeVisible()
  })

  test("TC-ADMIN-08: Cai dat /admin/cai-dat 4 nhom", async ({ page }) => {
    await page.goto("/admin/cai-dat")
    await expect(page.locator("text=Cài đặt Hệ thống")).toBeVisible()
    await expect(page.locator("text=Thông tin Hội")).toBeVisible()
    await expect(page.locator("text=Phí & Giới hạn")).toBeVisible()
    await expect(page.locator("text=Thông tin Chuyển khoản")).toBeVisible()
    await expect(page.locator("text=Hạng hội viên")).toBeVisible()
  })

  test("TC-ADMIN-09: Chi tiet hoi vien /admin/hoi-vien/[id]", async ({ page }) => {
    await page.goto("/admin/hoi-vien")
    // Click first member detail
    await page.click('a:has-text("Chi tiết")')
    await page.waitForURL(/\/admin\/hoi-vien\//)
    // Should show member detail with tabs
    await expect(page.locator("text=Membership")).toBeVisible()
    await expect(page.locator("text=Thanh toán")).toBeVisible()
    await expect(page.locator("text=Thông tin")).toBeVisible()
  })

  test("TC-ADMIN-10: Tao hoi vien moi page load", async ({ page }) => {
    await page.goto("/admin/hoi-vien/tao-moi")
    await expect(page.locator("text=Tạo tài khoản VIP")).toBeVisible()
    await expect(page.locator("text=Tạo với mật khẩu")).toBeVisible()
    await expect(page.locator("text=Gửi email mời")).toBeVisible()
  })
})
