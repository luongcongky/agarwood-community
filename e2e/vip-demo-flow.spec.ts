// ============================================================
// VIP Demo Flow — E2E Test Suite (Video Recording)
//
// Muc dich: Quay video toan bo flow VIP de demo va luu tru
// huong dan su dung. Chay tuan tu, du lieu tao tu dau va dung
// xuyen suot.
//
// Video output: e2e/test-results/
// Chay: npx playwright test e2e/vip-demo-flow.spec.ts
// ============================================================

import { test, expect, type Page } from "@playwright/test"
import { execSync } from "child_process"

// ── Constants ───────────────────────────────────────────────────────────────

const VIP = { email: "binhnv@hoitramhuong.vn", password: "Demo@123" }
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

test.describe.serial("VIP Demo Flow — Full Platform Walkthrough", () => {

  // ================================================================
  // STEP 0: Seed fresh data
  // ================================================================
  test("00 — Seed du lieu demo moi", async ({ page }) => {
    // Trigger seed via CLI — Playwright runs in Node so we use the page
    // to verify the app is running, then seed via exec
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
  // STEP 1: VIP Login
  // ================================================================
  test("01 — VIP dang nhap he thong", async ({ page }) => {
    await page.goto("/login")
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    // Show login form
    await expect(page.locator("h1, h2").filter({ hasText: "Đăng nhập" })).toBeVisible()

    // Fill credentials slowly for video
    await page.fill("#email", VIP.email)
    await pause(page, 500)
    await page.fill("#password", VIP.password)
    await pause(page, 500)

    // Submit
    await page.click('button[type="submit"]')
    await page.waitForURL("**/tong-quan", { timeout: 15000 })
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Verify dashboard loaded
    await expect(page.locator("text=Membership")).toBeVisible()
  })

  // ================================================================
  // STEP 2: Dashboard Tong quan
  // ================================================================
  test("02 — Xem tong quan Dashboard VIP", async ({ page }) => {
    await login(page, VIP.email, VIP.password)
    await page.goto("/tong-quan")
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    // Greeting + name
    await expect(page.getByRole("heading", { name: /Trần Khánh Hòa/i })).toBeVisible()
    await pause(page, 500)

    // Stats cards
    await expect(page.locator("text=Membership")).toBeVisible()
    await expect(page.locator("text=Bài viết").first()).toBeVisible()
    await pause(page, 500)

    // Quick actions
    await expect(page.locator("text=Đăng bài").first()).toBeVisible()
    await pause(page, 1500)
  })

  // ================================================================
  // STEP 3: Cap nhat ho so ca nhan
  // ================================================================
  test("03 — Cap nhat ho so ca nhan", async ({ page }) => {
    await login(page, VIP.email, VIP.password)
    await page.goto("/ho-so")
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    // Tab "Thong tin ca nhan" is active by default
    await expect(page.locator("text=Thông tin cá nhân")).toBeVisible()
    await pause(page, 500)

    // Update phone number
    const phoneInput = page.locator('input[type="tel"]')
    await phoneInput.clear()
    await phoneInput.fill("0909 888 777")
    await pause(page, 500)

    // Save
    await page.click('button:has-text("Lưu thay đổi")')
    await pause(page, 1500)

    // Switch to Bank tab
    await page.click('button:has-text("Ngân hàng")')
    await pause(page, 800)

    // Fill bank info
    const bankSelect = page.locator("select").first()
    await bankSelect.selectOption({ label: "Vietcombank" })
    await pause(page, 400)

    const accountNumberInput = page.locator('input[placeholder="0123456789"]')
    if (await accountNumberInput.isVisible()) {
      await accountNumberInput.clear()
      await accountNumberInput.fill("0071009876543")
      await pause(page, 400)
    }

    const accountNameInput = page.locator('input[placeholder="NGUYEN VAN A"]')
    if (await accountNameInput.isVisible()) {
      await accountNameInput.clear()
      await accountNameInput.fill("TRAN KHANH HOA")
      await pause(page, 400)
    }

    // Save bank info
    await page.click('button:has-text("Lưu thông tin")')
    await pause(page, 1500)

    // Switch to Security tab
    await page.click('button:has-text("Bảo mật")')
    await pause(page, 800)
    await expect(page.locator("text=Đổi mật khẩu")).toBeVisible()
    await pause(page, 1000)

    // Switch to History tab
    await page.click('button:has-text("Lịch sử")')
    await pause(page, 800)
    await expect(page.locator("text=Tổng đóng góp")).toBeVisible()
    await pause(page, 1500)
  })

  // ================================================================
  // STEP 4: Quan ly profile doanh nghiep
  // ================================================================
  test("04 — Quan ly profile doanh nghiep", async ({ page }) => {
    await login(page, VIP.email, VIP.password)

    // Go to company profile (public view)
    await page.goto("/doanh-nghiep/tram-huong-khanh-hoa")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Verify owner sees edit button
    await expect(page.locator("text=Chỉnh sửa").first()).toBeVisible()
    await pause(page, 500)

    // Click edit
    await page.click('a:has-text("Chỉnh sửa")')
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    // Show company edit form
    await expect(page.locator("text=Thông tin cơ bản").first()).toBeVisible()
    await pause(page, 500)

    // Update description
    const descTextarea = page.locator("textarea").first()
    if (await descTextarea.isVisible()) {
      await descTextarea.clear()
      await descTextarea.fill(
        "Trầm Hương Khánh Hòa — Chuyên cung cấp trầm hương tự nhiên chất lượng cao từ vùng nguyên liệu Khánh Hòa. " +
        "Cam kết sản phẩm chính gốc, được kiểm nghiệm bởi Hội Trầm Hương Việt Nam."
      )
      await pause(page, 800)
    }

    // Save
    await page.click('button:has-text("Lưu thay đổi")')
    await pause(page, 2000)
  })

  // ================================================================
  // STEP 5: Quan ly san pham — Tao san pham moi
  // ================================================================
  test("05 — Tao san pham moi", async ({ page }) => {
    await login(page, VIP.email, VIP.password)

    await page.goto("/san-pham/tao-moi")
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    // Fill product form
    // Product name
    const nameInput = page.locator('input[type="text"]').first()
    await nameInput.fill("Trầm Hương Miếng Khánh Hòa Loại 1")
    await pause(page, 500)

    // Category
    const categorySelect = page.locator("select").first()
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 }) // first real option
      await pause(page, 400)
    }

    // Price
    const priceInput = page.locator('input[placeholder*="Liên hệ"]')
    if (await priceInput.isVisible()) {
      await priceInput.fill("2.000.000 - 5.000.000đ/kg")
      await pause(page, 400)
    }

    // Description
    const descTextarea = page.locator("textarea").first()
    if (await descTextarea.isVisible()) {
      await descTextarea.fill(
        "Trầm hương miếng tự nhiên 100% từ vùng nguyên liệu Khánh Hòa. " +
        "Hương thơm tự nhiên, dầu nhiều, màu nâu sẫm đặc trưng. " +
        "Phù hợp cho xông trầm, chế tác vòng tay, làm quà tặng cao cấp."
      )
      await pause(page, 500)
    }

    // Ensure published
    const publishCheckbox = page.locator('#isPublished')
    if (await publishCheckbox.isVisible()) {
      const checked = await publishCheckbox.isChecked()
      if (!checked) await publishCheckbox.check()
      await pause(page, 300)
    }

    // Submit
    await page.click('button:has-text("Tạo sản phẩm")')
    await pause(page, 2000)

    // Should redirect or show success
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)
  })

  // ================================================================
  // STEP 6: Doc Feed cong dong
  // ================================================================
  test("06 — Doc Feed cong dong", async ({ page }) => {
    await login(page, VIP.email, VIP.password)

    await page.goto("/feed")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Feed should show posts
    await expect(page.locator("text=Chia sẻ kiến thức")).toBeVisible()
    await pause(page, 500)

    // Scroll down to see more posts
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "smooth" }))
    await pause(page, 1500)

    // Scroll to see top contributors sidebar (if desktop)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }))
    await pause(page, 1000)
  })

  // ================================================================
  // STEP 7: Dang bai viet len Feed
  // ================================================================
  test("07 — Dang bai viet len Feed", async ({ page }) => {
    await login(page, VIP.email, VIP.password)

    await page.goto("/feed/tao-bai")
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    // Fill title
    const titleInput = page.locator('input[placeholder*="Tiêu đề"]')
    await titleInput.fill("Kinh nghiệm phân biệt trầm hương thật - giả")
    await pause(page, 500)

    // Fill content in TipTap editor
    const editor = page.locator(".tiptap, .ProseMirror")
    await editor.click()
    await pause(page, 300)

    await editor.pressSequentially(
      "Chia se kinh nghiem 20 nam trong nganh tram huong. Bai viet nay giup ban phan biet tram huong that va gia thong qua cac dac diem nhu: mau sac, huong thom, do cung, van go va cach dot thu. Moi nguoi co the tham khao de tranh mua phai hang kem chat luong.",
      { delay: 20 }
    )
    await pause(page, 1000)

    // Submit
    await page.click('button:has-text("Đăng bài")')
    await pause(page, 2000)

    // Wait for redirect to feed or success
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)
  })

  // ================================================================
  // STEP 8: Nop don chung nhan san pham
  // ================================================================
  test("08 — Nop don chung nhan san pham", async ({ page }) => {
    await login(page, VIP.email, VIP.password)

    await page.goto("/chung-nhan/nop-don")
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    // Step 1: Select product
    await expect(page.locator("text=Chọn sản phẩm").first()).toBeVisible()
    await pause(page, 500)

    // Select first available (enabled) product radio
    const productRadio = page.locator('input[name="product"]:enabled').first()
    if (await productRadio.isVisible()) {
      await productRadio.click()
      await pause(page, 800)

      // Next
      await page.click('button:has-text("Tiếp theo")')
      await pause(page, 1000)

      // Step 2: Documents & bank info
      await expect(page.locator("text=Hồ sơ").first()).toBeVisible()
      await pause(page, 500)

      // Fill note
      const noteTextarea = page.locator("textarea").first()
      if (await noteTextarea.isVisible()) {
        await noteTextarea.fill("Sản phẩm trầm hương miếng tự nhiên, nguồn gốc Khánh Hòa")
        await pause(page, 500)
      }

      // Select online review
      const onlineRadio = page.locator('text=Online').first()
      if (await onlineRadio.isVisible()) {
        await onlineRadio.click()
        await pause(page, 400)
      }

      // Fill bank info for refund
      const bankNameInput = page.locator('input[placeholder*="Vietcombank"]')
      if (await bankNameInput.isVisible()) {
        await bankNameInput.fill("Vietcombank")
        await pause(page, 300)
      }

      const bankAccountInput = page.locator('input[placeholder="0123456789"]')
      if (await bankAccountInput.isVisible()) {
        await bankAccountInput.fill("0071009876543")
        await pause(page, 300)
      }

      const bankHolderInput = page.locator('input[placeholder="NGUYEN VAN A"]')
      if (await bankHolderInput.isVisible()) {
        await bankHolderInput.fill("TRAN KHANH HOA")
        await pause(page, 300)
      }

      // Next to step 3
      await page.click('button:has-text("Tiếp theo")')
      await pause(page, 1000)

      // Step 3: Payment confirmation
      await expect(page.locator("text=Xác nhận").first()).toBeVisible()
      await pause(page, 500)

      // Show summary — wait and read
      await pause(page, 1500)

      // Submit certification request
      const submitBtn = page.locator('button:has-text("Gửi yêu cầu")')
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await pause(page, 2000)

        // Payment info should appear
        await page.waitForLoadState("networkidle")
        await pause(page, 1500)

        // Click "Toi da chuyen khoan"
        const transferDoneBtn = page.locator('button:has-text("Tôi đã chuyển khoản")')
        if (await transferDoneBtn.isVisible()) {
          await transferDoneBtn.click()
          await pause(page, 1500)
        }
      }
    } else {
      // No products available — show the page state
      await pause(page, 2000)
    }
  })

  // ================================================================
  // STEP 9: Gia han membership
  // ================================================================
  test("09 — Gia han membership", async ({ page }) => {
    await login(page, VIP.email, VIP.password)

    await page.goto("/gia-han")
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    // Membership status card
    await expect(page.locator("text=Membership của bạn")).toBeVisible()
    await pause(page, 800)

    // Show tier stars
    await expect(page.locator("text=★★★").first()).toBeVisible()
    await pause(page, 500)

    // Fee options visible
    await expect(page.locator("text=Được khuyến nghị")).toBeVisible()
    await pause(page, 500)

    // Select recommended fee (higher amount)
    const feeCards = page.locator('button:has-text("/năm")')
    if (await feeCards.count() > 1) {
      await feeCards.nth(1).click() // Second option = recommended
      await pause(page, 500)
    }

    // Show transfer instructions
    await page.click('button:has-text("Xem hướng dẫn chuyển khoản")')
    await pause(page, 2000)

    // Wait for bank info to load
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    // Show transfer info
    const bankInfoVisible = await page.locator("text=Thông tin chuyển khoản").isVisible()
    if (bankInfoVisible) {
      await pause(page, 1500)

      // Copy CK description
      const copyBtn = page.locator('button:has-text("Copy")')
      if (await copyBtn.isVisible()) {
        await copyBtn.click()
        await pause(page, 1000)
      }

      // Click "Toi da chuyen khoan"
      await page.click('button:has-text("Tôi đã chuyển khoản")')
      await pause(page, 1000)

      // Note step
      const noteTextarea = page.locator("textarea")
      if (await noteTextarea.isVisible()) {
        await noteTextarea.fill("Em đã chuyển khoản lúc 9h sáng ạ")
        await pause(page, 500)
      }

      await page.click('button:has-text("Gửi xác nhận")')
      await pause(page, 2000)
    }
  })

  // ================================================================
  // STEP 10: Xem lich su thanh toan
  // ================================================================
  test("10 — Xem lich su thanh toan", async ({ page }) => {
    await login(page, VIP.email, VIP.password)

    await page.goto("/thanh-toan/lich-su")
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    // Header
    await expect(page.locator("text=Lịch sử thanh toán")).toBeVisible()
    await pause(page, 800)

    // Should show recent payments (from seed + renewal just done)
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }))
    await pause(page, 1500)

    // Scroll back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }))
    await pause(page, 1000)
  })

  // ================================================================
  // STEP 11: Xem chung nhan lich su
  // ================================================================
  test("11 — Xem lich su chung nhan", async ({ page }) => {
    await login(page, VIP.email, VIP.password)

    await page.goto("/chung-nhan/lich-su")
    await page.waitForLoadState("networkidle")
    await pause(page, 1000)

    await expect(page.locator("text=Lịch sử chứng nhận")).toBeVisible()
    await pause(page, 500)

    // Show certification statuses
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }))
    await pause(page, 1500)
  })

  // ================================================================
  // STEP 12: Admin — Xac nhan chuyen khoan
  // ================================================================
  test("12 — Admin xac nhan chuyen khoan", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)

    await page.goto("/admin/thanh-toan")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Admin payment management page
    await expect(page.getByRole("heading", { name: /Chuyển khoản/i })).toBeVisible()
    await pause(page, 500)

    // Find pending payments buttons
    const confirmBtn = page.getByRole("button", { name: /Xác nhận/i }).first()
    if (await confirmBtn.isVisible()) {
      await pause(page, 1000)
      await confirmBtn.click()
      await pause(page, 2000)
      await page.waitForLoadState("networkidle")
      await pause(page, 1500)
    }
  })

  // ================================================================
  // STEP 13: Admin — Xet duyet chung nhan
  // ================================================================
  test("13 — Admin xet duyet chung nhan", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)

    await page.goto("/admin/chung-nhan")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Certification management page
    await expect(page.getByRole("heading", { name: /Chứng nhận/i }).first()).toBeVisible()
    await pause(page, 500)

    // Look for pending certifications and view detail
    const detailLink = page.locator('a:has-text("Chi tiết")').first()
    if (await detailLink.isVisible()) {
      await detailLink.click()
      await page.waitForLoadState("networkidle")
      await pause(page, 1500)

      // Approve certification
      const approveBtn = page.locator('button:has-text("Duyệt")').first()
      if (await approveBtn.isVisible()) {
        await approveBtn.click()
        await pause(page, 2000)
        await page.waitForLoadState("networkidle")
        await pause(page, 1500)
      }
    }
  })

  // ================================================================
  // STEP 14: Admin — Quan ly hoi vien
  // ================================================================
  test("14 — Admin quan ly hoi vien", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)

    await page.goto("/admin/hoi-vien")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // Member list
    await expect(page.getByRole("heading", { name: /Hội viên/i }).first()).toBeVisible()
    await pause(page, 500)

    // Browse tabs
    const tabs = ["Active", "Sắp hết hạn", "Hết hạn"]
    for (const tab of tabs) {
      const tabBtn = page.locator(`a:has-text("${tab}")`).first()
      if (await tabBtn.isVisible()) {
        await tabBtn.click()
        await page.waitForLoadState("networkidle")
        await pause(page, 800)
      }
    }

    // Back to all
    await page.locator('a:has-text("Tất cả")').first().click()
    await page.waitForLoadState("networkidle")
    await pause(page, 500)

    // Click on a member detail
    const detailLink = page.locator('a:has-text("Chi tiết")').first()
    if (await detailLink.isVisible()) {
      await detailLink.click()
      await page.waitForLoadState("networkidle")
      await pause(page, 2000)
    }
  })

  // ================================================================
  // STEP 15: Admin — Dashboard tong quan
  // ================================================================
  test("15 — Admin Dashboard tong quan", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)

    await page.goto("/admin")
    await page.waitForLoadState("networkidle")
    await pause(page, 1500)

    // KPI cards
    await expect(page.locator("text=Hội viên Active")).toBeVisible()
    await pause(page, 800)

    // Scroll to charts
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }))
    await pause(page, 1500)

    // Scroll to alerts
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }))
    await pause(page, 1500)

    // Back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }))
    await pause(page, 1000)
  })

})
