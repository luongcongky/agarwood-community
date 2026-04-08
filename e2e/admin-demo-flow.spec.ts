// ============================================================
// Admin Demo Flow — E2E Test Suite (Video Recording)
//
// Muc dich: Quay video toan bo flow Admin de demo va luu tru
// huong dan su dung. Chay tuan tu, du lieu tao tu dau va dung
// xuyen suot.
//
// Video output: e2e/test-results/
// Chay: npx playwright test e2e/admin-demo-flow.spec.ts
// ============================================================

import { test, expect, type Page } from "@playwright/test"
import { execSync } from "child_process"

// ── Constants ───────────────────────────────────────────────────────────────

const ADMIN = { email: "admin@hoitramhuong.vn", password: "Demo@123" }
const PAUSE = 800 // ms — cho video de doc

// ── Helpers ─────────────────────────────────────────────────────────────────

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.waitForLoadState("networkidle")
  await page.fill("#email", email)
  await page.waitForTimeout(300)
  await page.fill("#password", password)
  await page.waitForTimeout(300)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 })
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(PAUSE)
}

async function pause(page: Page, ms = PAUSE) {
  await page.waitForTimeout(ms)
}

// ── Sequential test suite ───────────────────────────────────────────────────

test.describe.serial("Admin Demo Flow — Full Platform Walkthrough", () => {

  // ================================================================
  // STEP 0: Seed fresh data
  // ================================================================
  test("00 — Seed du lieu demo moi", async ({ page }) => {
    execSync("npx prisma db seed", {
      cwd: process.cwd(),
      stdio: "pipe",
      timeout: 120000,
    })

    // Verify app is alive
    await page.goto("/")
    await expect(page).toHaveTitle(/Trầm Hương/)
    await pause(page, 1500)
  })

  // ================================================================
  // STEP 1: Admin Login
  // ================================================================
  test("01 — Admin dang nhap he thong", async ({ page }) => {
    await page.goto("/login")
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    await expect(page.locator("h1, h2").filter({ hasText: "Đăng nhập" })).toBeVisible()

    // Fill credentials slowly for video
    await page.fill("#email", ADMIN.email)
    await pause(page, 500)
    await page.fill("#password", ADMIN.password)
    await pause(page, 500)

    // Submit — Admin redirects to /admin
    await page.click('button[type="submit"]')
    await page.waitForURL("**/admin", { timeout: 15000 })
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Verify admin dashboard loaded
    await expect(page.locator("text=Tổng quan").first()).toBeVisible()
  })

  // ================================================================
  // STEP 2: Dashboard tong quan
  // ================================================================
  test("02 — Dashboard tong quan — KPI, alerts, bieu do", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.goto("/admin")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // KPI cards
    await expect(page.locator("text=Hội viên Active")).toBeVisible()
    await pause(page, 500)
    await expect(page.locator("text=Doanh thu tháng")).toBeVisible()
    await pause(page, 500)

    // Check for alert panels
    const alertSection = page.locator("text=Cần xử lý").first()
    if (await alertSection.isVisible()) {
      await pause(page, 1000)
    }

    // Scroll to charts area
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }))
    await pause(page, 1500)

    // Scroll to activity feed
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: "smooth" }))
    await pause(page, 1500)

    // Back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }))
    await pause(page, 1000)
  })

  // ================================================================
  // STEP 3: Xac nhan chuyen khoan
  // ================================================================
  test("03 — Xac nhan chuyen khoan — confirm va reject", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.goto("/admin/thanh-toan")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Page heading
    await expect(page.getByRole("heading", { name: /Chuyển khoản/i })).toBeVisible()
    await pause(page, 500)

    // Show pending payments count
    const pendingText = page.locator("text=chờ xử lý").first()
    if (await pendingText.isVisible()) {
      await pause(page, 800)
    }

    // Browse filter tabs
    const membershipTab = page.locator('a:has-text("Membership")').first()
    if (await membershipTab.isVisible()) {
      await membershipTab.click()
      await page.waitForLoadState("networkidle")
      await pause(page, 800)
    }

    // Back to all
    const allTab = page.locator('a:has-text("Tất cả")').first()
    if (await allTab.isVisible()) {
      await allTab.click()
      await page.waitForLoadState("networkidle")
      await pause(page, 800)
    }

    // Confirm first pending payment
    const confirmBtn = page.getByRole("button", { name: /Xác nhận/i }).first()
    if (await confirmBtn.isVisible()) {
      await pause(page, 500)
      await confirmBtn.click()
      await pause(page, 2000)
      await page.waitForLoadState("networkidle")

      // Verify success state
      const successText = page.locator("text=Đã xác nhận").first()
      if (await successText.isVisible()) {
        await pause(page, 1000)
      }
    }

    // Scroll to processed payments table
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }))
    await pause(page, 1500)
  })

  // ================================================================
  // STEP 4: Xet duyet chung nhan SP
  // ================================================================
  test("04 — Xet duyet chung nhan SP — review 2 cot", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.goto("/admin/chung-nhan")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Page heading
    await expect(page.getByRole("heading", { name: /Chứng nhận/i }).first()).toBeVisible()
    await pause(page, 500)

    // Browse status tabs
    const tabs = ["Chờ duyệt", "Đã duyệt", "Từ chối", "Tất cả"]
    for (const tab of tabs) {
      const tabLink = page.locator(`a:has-text("${tab}")`).first()
      if (await tabLink.isVisible()) {
        await tabLink.click()
        await page.waitForLoadState("networkidle")
        await pause(page, 800)
      }
    }

    // Click "Xem xet" on first certification
    const reviewLink = page.locator('a:has-text("Xem xét")').first()
    if (await reviewLink.isVisible()) {
      await reviewLink.click()
      await page.waitForLoadState("networkidle")
      await pause(page, 1500)

      // Detail page — product info
      await expect(page.locator("text=Thông tin sản phẩm").first()).toBeVisible()
      await pause(page, 800)

      // Scroll to see documents
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }))
      await pause(page, 1000)

      // Scroll to applicant info
      await page.evaluate(() => window.scrollTo({ top: 700, behavior: "smooth" }))
      await pause(page, 1000)

      // Approve certification
      const approveBtn = page.getByRole("button", { name: /Duyệt/i }).first()
      if (await approveBtn.isVisible()) {
        await approveBtn.click()
        await pause(page, 2000)
        await page.waitForLoadState("networkidle")
        await pause(page, 1500)
      }
    }
  })

  // ================================================================
  // STEP 5: Quan ly hoi vien — danh sach
  // ================================================================
  test("05 — Quan ly hoi vien — danh sach va tab", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.goto("/admin/hoi-vien")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Heading + slot info
    await expect(page.getByRole("heading", { name: /Hội viên/i }).first()).toBeVisible()
    await pause(page, 500)

    // Browse tabs
    const tabs = ["Active", "Sắp hết hạn", "Hết hạn", "Chờ kích hoạt", "Tất cả"]
    for (const tab of tabs) {
      const tabLink = page.locator(`a:has-text("${tab}")`).first()
      if (await tabLink.isVisible()) {
        await tabLink.click()
        await page.waitForLoadState("networkidle")
        await pause(page, 800)
      }
    }

    // Search for a member
    const searchInput = page.locator('input[placeholder*="Tìm"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill("Trần Khánh")
      await pause(page, 500)
      await page.keyboard.press("Enter")
      await page.waitForLoadState("networkidle")
      await pause(page, 1000)

      // Clear search
      await searchInput.clear()
      await page.keyboard.press("Enter")
      await page.waitForLoadState("networkidle")
      await pause(page, 500)
    }

    // View member detail
    const detailLink = page.locator('a:has-text("Chi tiết")').first()
    if (await detailLink.isVisible()) {
      await detailLink.click()
      await page.waitForLoadState("networkidle")
      await pause(page, 1500)

      // Member detail page — scroll through info
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }))
      await pause(page, 1000)

      await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }))
      await pause(page, 1000)

      // Back to list
      await page.goBack()
      await page.waitForLoadState("networkidle")
      await pause(page, 1000)
    }
  })

  // ================================================================
  // STEP 6: Tao hoi vien moi
  // ================================================================
  test("06 — Tao hoi vien VIP moi", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.goto("/admin/hoi-vien/tao-moi")
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    // Page title
    await expect(page.getByRole("heading", { name: /Tạo tài khoản/i })).toBeVisible()
    await pause(page, 500)

    // Select mode "Tao voi mat khau"
    const passwordMode = page.getByRole("button", { name: /Tạo với mật khẩu/i })
    if (await passwordMode.isVisible()) {
      await passwordMode.click()
      await pause(page, 500)
    }

    // Fill form
    const nameLabel = page.locator('label:has-text("Họ và tên")')
    const nameInput = nameLabel.locator(".. >> input").first()
    // Alternative: find by order
    const formInputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]')

    // Name
    const nameField = formInputs.nth(0)
    await nameField.fill("Phạm Văn Demo")
    await pause(page, 400)

    // Email
    const emailField = formInputs.nth(1)
    await emailField.fill("phamvandemo@example.com")
    await pause(page, 400)

    // Phone
    const phoneField = formInputs.nth(2)
    await phoneField.fill("0901234999")
    await pause(page, 400)

    // Password
    const passwordField = page.locator('input[type="password"]').first()
    if (await passwordField.isVisible()) {
      await passwordField.fill("Demo@123")
      await pause(page, 400)
    }

    await pause(page, 1000)

    // Submit
    const submitBtn = page.getByRole("button", { name: /Tạo tài khoản/i })
    await submitBtn.click()
    await pause(page, 2000)
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Check for success or error message
    const successMsg = page.locator("text=Đã tạo tài khoản")
    if (await successMsg.isVisible()) {
      await pause(page, 1500)
    }
  })

  // ================================================================
  // STEP 7: Dang tin tuc & thong bao
  // ================================================================
  test("07 — Quan ly tin tuc — xem danh sach", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.goto("/admin/tin-tuc")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Page heading
    await expect(page.getByRole("heading", { name: /Tin tức/i }).first()).toBeVisible()
    await pause(page, 500)

    // Show news list with published/draft badges
    const publishedBadge = page.locator("text=Đã xuất bản").first()
    if (await publishedBadge.isVisible()) {
      await pause(page, 800)
    }

    const draftBadge = page.locator("text=Nháp").first()
    if (await draftBadge.isVisible()) {
      await pause(page, 800)
    }

    // Scroll through list
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }))
    await pause(page, 1000)

    // Click edit on first news
    const editLink = page.locator('a:has-text("Chỉnh sửa")').first()
    if (await editLink.isVisible()) {
      await editLink.click()
      await page.waitForLoadState("networkidle")
      await pause(page, 1500)

      // Show news edit form
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }))
      await pause(page, 1000)

      // Go back
      await page.goBack()
      await page.waitForLoadState("networkidle")
      await pause(page, 1000)
    }
  })

  // ================================================================
  // STEP 8: Xu ly bao cao vi pham
  // ================================================================
  test("08 — Xu ly bao cao vi pham", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.goto("/admin/bao-cao")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Page heading
    await expect(page.getByRole("heading", { name: /Báo cáo/i }).first()).toBeVisible()
    await pause(page, 500)

    // Pending count badge
    const pendingBadge = page.locator("text=chờ xử lý").first()
    if (await pendingBadge.isVisible()) {
      await pause(page, 800)
    }

    // Show report cards with post content preview
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }))
    await pause(page, 1000)

    // Lock a reported post (if available)
    const lockBtn = page.getByRole("button", { name: /Khoá bài/i }).first()
    if (await lockBtn.isVisible()) {
      await pause(page, 500)
      await lockBtn.click()
      await pause(page, 2000)
      await page.waitForLoadState("networkidle")
      await pause(page, 1000)
    }

    // Dismiss another report (if available)
    const dismissBtn = page.getByRole("button", { name: /Bỏ qua/i }).first()
    if (await dismissBtn.isVisible()) {
      await pause(page, 500)
      await dismissBtn.click()
      await pause(page, 2000)
      await page.waitForLoadState("networkidle")
      await pause(page, 1000)
    }
  })

  // ================================================================
  // STEP 9: Quan ly don truyen thong (CRM)
  // ================================================================
  test("09 — Quan ly don truyen thong — CRM noi bo", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.goto("/admin/truyen-thong")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Page heading
    await expect(page.getByRole("heading", { name: /Truyền thông/i }).first()).toBeVisible()
    await pause(page, 500)

    // Summary cards (Moi, Dang lam, Cho duyet, Hoan tat, Huy)
    await pause(page, 1000)

    // Browse status tabs
    const tabs = ["Mới", "Đang làm", "Hoàn tất", "Tất cả"]
    for (const tab of tabs) {
      const tabLink = page.locator(`a:has-text("${tab}")`).first()
      if (await tabLink.isVisible()) {
        await tabLink.click()
        await page.waitForLoadState("networkidle")
        await pause(page, 800)
      }
    }

    // View order detail
    const detailLink = page.locator('a:has-text("Chi tiết")').first()
    if (await detailLink.isVisible()) {
      await detailLink.click()
      await page.waitForLoadState("networkidle")
      await pause(page, 1500)

      // Show order detail
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }))
      await pause(page, 1000)

      // Go back
      await page.goBack()
      await page.waitForLoadState("networkidle")
      await pause(page, 1000)
    }
  })

  // ================================================================
  // STEP 10: Cai dat he thong
  // ================================================================
  test("10 — Cai dat he thong — phi, ngan hang, hang hoi vien", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.goto("/admin/cai-dat")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Section: Thong tin Hoi
    await expect(page.locator("text=Thông tin Hội").first()).toBeVisible()
    await pause(page, 800)

    // Scroll to Phi & Gioi han
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }))
    await pause(page, 1000)

    // Scroll to Thong tin Chuyen khoan
    await page.evaluate(() => window.scrollTo({ top: 700, behavior: "smooth" }))
    await pause(page, 1000)

    // Scroll to Phi Ca nhan
    await page.evaluate(() => window.scrollTo({ top: 1000, behavior: "smooth" }))
    await pause(page, 1000)

    // Scroll to Hang hoi vien DN
    await page.evaluate(() => window.scrollTo({ top: 1300, behavior: "smooth" }))
    await pause(page, 1000)

    // Update a setting value for demo
    const feeInput = page.locator('label:has-text("Phí membership tối thiểu")').locator(".. >> input")
    if (await feeInput.isVisible()) {
      await feeInput.clear()
      await feeInput.fill("5000000")
      await pause(page, 500)
    }

    // Scroll to save button
    await page.evaluate(() => window.scrollTo({ top: 9999, behavior: "smooth" }))
    await pause(page, 800)

    // Save settings
    const saveBtn = page.getByRole("button", { name: /Lưu cài đặt/i })
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await pause(page, 2000)
      await page.waitForLoadState("networkidle")

      // Check success message
      const successMsg = page.locator("text=Đã lưu cài đặt thành công")
      if (await successMsg.isVisible()) {
        await pause(page, 1500)
      }
    }
  })

  // ================================================================
  // STEP 11: Tong ket — quay lai Dashboard
  // ================================================================
  test("11 — Tong ket — Dashboard sau khi xu ly", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.goto("/admin")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // KPI should reflect changes (new member, confirmed payment, etc.)
    await expect(page.locator("text=Hội viên Active")).toBeVisible()
    await pause(page, 1000)

    // Scroll through dashboard one final time
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }))
    await pause(page, 1500)

    await page.evaluate(() => window.scrollTo({ top: 1000, behavior: "smooth" }))
    await pause(page, 1500)

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }))
    await pause(page, 2000)
  })

})
