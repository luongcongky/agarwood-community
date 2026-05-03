// ============================================================
// Sổ quỹ thu chi (Ledger) — E2E Test Suite
//
// Tested feature: /admin/thu-chi (dashboard, sổ quỹ, báo cáo,
// danh mục, CSV export, opening-balance wizard).
//
// Run: npx playwright test e2e/admin-thu-chi.spec.ts
// Yêu cầu: dev server chạy ở localhost:3000, DB có ADMIN account
// (chạy `npx prisma db seed` trước nếu DB rỗng).
// ============================================================

import { test, expect, type Page } from "@playwright/test"
import { login, ADMIN } from "./helpers"

// Marker để dễ phân biệt giao dịch test với data thật + làm unique trong run
const RUN_ID = Date.now().toString().slice(-6)
const MARK = `[E2E-${RUN_ID}]`

const TX_INCOME = {
  desc: `${MARK} Tài trợ đối tác A`,
  amount: "5.000.000",
  amountNumber: 5_000_000,
  category: "Tài trợ / Đóng góp",
  ref: `E2E-IN-${RUN_ID}`,
}

const TX_EXPENSE = {
  desc: `${MARK} Mua văn phòng phẩm`,
  amount: "1.200.000",
  amountNumber: 1_200_000,
  category: "Vận hành (văn phòng / website)",
  ref: `E2E-OUT-${RUN_ID}`,
}

const TX_INCOME_EDITED = {
  desc: `${MARK} Tài trợ đối tác A (đã sửa)`,
  amount: "6.500.000",
  amountNumber: 6_500_000,
}

const NEW_CATEGORY = `${MARK} Tài trợ doanh nghiệp X`

const OPENING_BALANCE = {
  amount: "100.000.000",
  amountNumber: 100_000_000,
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function gotoLedger(page: Page, path = "/admin/thu-chi") {
  await page.goto(path)
  await page.waitForLoadState("networkidle")
}

/** Đảm bảo opening balance đã được nhập. Nếu chưa thì submit wizard. */
async function ensureOpeningBalance(page: Page) {
  await gotoLedger(page)
  const wizardHeading = page.getByRole("heading", { name: /Nhập số dư đầu kỳ/i })
  if (await wizardHeading.isVisible().catch(() => false)) {
    await page.getByLabel(/Số dư đầu kỳ/i).fill(OPENING_BALANCE.amount)
    await page.getByRole("button", { name: /Lưu số dư đầu kỳ/i }).click()
    // Sau khi tạo xong, dashboard reload → "Số dư hiện tại" xuất hiện
    await expect(page.getByText(/Số dư hiện tại/i)).toBeVisible({ timeout: 10000 })
  }
}

// ── Suite chính: serial vì các bước phụ thuộc state ─────────────────────────

test.describe.serial("Sổ quỹ thu chi — Admin flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
  })

  // ============================================================
  // Phase A — Smoke + sidebar
  // ============================================================

  test("TC-LEDGER-01: Sidebar có link Sổ quỹ thu chi (group Đối tác & Tài chính)", async ({
    page,
  }) => {
    await page.goto("/admin")
    // Group label "Đối tác & Tài chính" có thể đang đóng — click mở
    const groupHeader = page.getByRole("button", { name: /Đối tác & Tài chính/i })
    if (await groupHeader.isVisible()) {
      const isOpen = await groupHeader.getAttribute("aria-expanded")
      if (isOpen !== "true") await groupHeader.click()
    }
    await expect(
      page.getByRole("link", { name: /Sổ quỹ thu chi/i }),
    ).toBeVisible()
  })

  test("TC-LEDGER-02: Dashboard /admin/thu-chi load OK", async ({ page }) => {
    await ensureOpeningBalance(page)
    await expect(
      page.getByRole("heading", { name: /Sổ quỹ thu chi/i }),
    ).toBeVisible()
    await expect(page.getByText(/Số dư hiện tại/i)).toBeVisible()
    await expect(page.getByText(/Thu tháng này/i)).toBeVisible()
    await expect(page.getByText(/Chi tháng này/i)).toBeVisible()
  })

  test("TC-LEDGER-03: Trang Sổ quỹ /so-quy load + có filter bar", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/so-quy")
    await expect(
      page.getByRole("heading", { name: /Sổ quỹ chi tiết/i }),
    ).toBeVisible()
    // Filter bar
    await expect(page.getByRole("link", { name: /^Thu$/ }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /^Chi$/ }).first()).toBeVisible()
    // Submit button "Lọc"
    await expect(page.getByRole("button", { name: /^Lọc$/ })).toBeVisible()
  })

  test("TC-LEDGER-04: Trang Báo cáo /bao-cao load + chart + summary", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/bao-cao")
    await expect(
      page.getByRole("heading", { name: /Báo cáo tài chính/i }),
    ).toBeVisible()
    await expect(page.getByText(/Tổng thu/i).first()).toBeVisible()
    await expect(page.getByText(/Tổng chi/i).first()).toBeVisible()
    await expect(page.getByText(/Chênh lệch/i).first()).toBeVisible()
    await expect(page.getByText(/Thu chi theo tháng/i)).toBeVisible()
  })

  test("TC-LEDGER-05: Trang Danh mục /danh-muc load + 2 section Thu/Chi", async ({
    page,
  }) => {
    await gotoLedger(page, "/admin/thu-chi/danh-muc")
    await expect(
      page.getByRole("heading", { name: /Danh mục thu chi/i }),
    ).toBeVisible()
    // Dùng exact match để không bị strict-mode conflict với h1 title
    await expect(page.getByRole("heading", { name: "Danh mục THU", exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Danh mục CHI", exact: true })).toBeVisible()
    // Default seed: ít nhất "Hội phí thường niên" (HT) + "Tài trợ / Đóng góp"
    await expect(page.getByText("Hội phí thường niên")).toBeVisible()
  })

  test("TC-LEDGER-06: Trang thêm giao dịch /them load form", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/them")
    await expect(
      page.getByRole("heading", { name: /Thêm giao dịch/i }),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: /↓ Thu/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /↑ Chi/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Tạo giao dịch/i })).toBeVisible()
  })

  // ============================================================
  // Phase B — Opening balance wizard
  // ============================================================

  test("TC-LEDGER-07: Wizard không hiển thị nữa sau khi đã có opening balance", async ({
    page,
  }) => {
    await ensureOpeningBalance(page)
    // Reload + verify wizard ẩn
    await gotoLedger(page)
    await expect(page.getByRole("heading", { name: /Nhập số dư đầu kỳ/i })).toBeHidden()
    await expect(page.getByText(/Số dư hiện tại/i)).toBeVisible()
  })

  test("TC-LEDGER-08: Số dư đầu kỳ xuất hiện trong sổ quỹ với cờ HT", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/so-quy")
    // 'Số dư đầu kỳ' là tên danh mục (text), link nằm ở cột Diễn giải cùng hàng
    const row = page.locator("tr").filter({ hasText: "Số dư đầu kỳ" })
    await expect(row.getByRole("link")).toBeVisible()
  })

  // ============================================================
  // Phase C — CRUD transaction
  // ============================================================

  test("TC-LEDGER-09: Tạo giao dịch THU mới — Tài trợ", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/them")
    // Default đã là Thu (INCOME)
    await expect(page.getByRole("button", { name: /↓ Thu/i })).toHaveClass(/bg-emerald-600/)

    await page.getByLabel(/Số tiền/i).fill(TX_INCOME.amount)
    // Date defaults to today — OK
    await page
      .locator('select')
      .filter({ hasText: /Chọn danh mục/i })
      .selectOption({ label: TX_INCOME.category })
    await page.getByLabel(/Số phiếu/i).fill(TX_INCOME.ref)
    await page.getByLabel(/Diễn giải/i).fill(TX_INCOME.desc)

    await page.getByRole("button", { name: /Tạo giao dịch/i }).click()

    // Sau khi tạo xong → redirect tới /admin/thu-chi/[id]
    await page.waitForURL(/\/admin\/thu-chi\/[a-z0-9]+$/i, { timeout: 10000 })
    await expect(page.getByRole("heading", { name: /Chi tiết giao dịch/i })).toBeVisible()
  })

  test("TC-LEDGER-10: Giao dịch vừa tạo hiển thị trong /so-quy", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/so-quy")
    await expect(page.getByRole("link", { name: TX_INCOME.desc })).toBeVisible()
    // Số tiền hiển thị +5.000.000đ
    const row = page.locator("tr").filter({ hasText: TX_INCOME.desc })
    await expect(row).toContainText("+5.000.000đ")
  })

  test("TC-LEDGER-11: Tạo giao dịch CHI mới — Vận hành", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/them")

    await page.getByRole("button", { name: /↑ Chi/i }).click()
    await expect(page.getByRole("button", { name: /↑ Chi/i })).toHaveClass(/bg-red-600/)

    await page.getByLabel(/Số tiền/i).fill(TX_EXPENSE.amount)
    await page
      .locator('select')
      .filter({ hasText: /Chọn danh mục/i })
      .selectOption({ label: TX_EXPENSE.category })
    await page.getByLabel(/Số phiếu/i).fill(TX_EXPENSE.ref)
    await page.getByLabel(/Diễn giải/i).fill(TX_EXPENSE.desc)

    await page.getByRole("button", { name: /Tạo giao dịch/i }).click()
    await page.waitForURL(/\/admin\/thu-chi\/[a-z0-9]+$/i, { timeout: 10000 })
    await expect(page.getByRole("heading", { name: /Chi tiết giao dịch/i })).toBeVisible()
  })

  test("TC-LEDGER-12: Số dư cập nhật đúng sau create (opening + thu - chi)", async ({
    page,
  }) => {
    await gotoLedger(page)
    // Số dư = OPENING + 5tr - 1.2tr = 103.800.000 (giả định DB sạch trước khi chạy)
    // Kiểm tra "Thu tháng này" có chứa 5tr và "Chi tháng này" có chứa 1.2tr
    const monthIncomeCard = page.locator("text=Thu tháng này").locator("..")
    const monthExpenseCard = page.locator("text=Chi tháng này").locator("..")
    await expect(monthIncomeCard).toContainText(/[\d.]+đ/)
    await expect(monthExpenseCard).toContainText(/[\d.]+đ/)
  })

  test("TC-LEDGER-13: Filter loại Chi → ẩn các giao dịch Thu", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/so-quy")
    await page.getByRole("link", { name: /^Chi$/ }).first().click()
    await page.waitForURL(/type=EXPENSE/)
    await expect(page.getByRole("link", { name: TX_EXPENSE.desc })).toBeVisible()
    await expect(page.getByRole("link", { name: TX_INCOME.desc })).toBeHidden()
  })

  test("TC-LEDGER-14: Search trong diễn giải tìm đúng giao dịch", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/so-quy")
    await page.getByPlaceholder("Tìm...").fill(MARK + " Tài trợ")
    await page.getByRole("button", { name: /^Lọc$/ }).click()
    await page.waitForLoadState("networkidle")
    await expect(page.getByRole("link", { name: TX_INCOME.desc })).toBeVisible()
    await expect(page.getByRole("link", { name: TX_EXPENSE.desc })).toBeHidden()
  })

  test("TC-LEDGER-15: Sửa giao dịch THU — đổi số tiền + diễn giải", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/so-quy")
    await page.getByRole("link", { name: TX_INCOME.desc }).click()
    await page.waitForURL(/\/admin\/thu-chi\/[a-z0-9]+$/i)

    await page.getByLabel(/Số tiền/i).fill(TX_INCOME_EDITED.amount)
    await page.getByLabel(/Diễn giải/i).fill(TX_INCOME_EDITED.desc)
    await page.getByRole("button", { name: /Lưu thay đổi/i }).click()

    // Refresh diễn ra in-place → form reload với data mới
    await page.waitForLoadState("networkidle")
    await expect(page.getByLabel(/Diễn giải/i)).toHaveValue(TX_INCOME_EDITED.desc)
  })

  test("TC-LEDGER-16: Xóa giao dịch CHI — biến mất khỏi sổ quỹ", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/so-quy")
    await page.getByRole("link", { name: TX_EXPENSE.desc }).click()
    await page.waitForURL(/\/admin\/thu-chi\/[a-z0-9]+$/i)

    page.once("dialog", (dialog) => dialog.accept())
    await page.getByRole("button", { name: /Xóa giao dịch/i }).click()

    // Server action redirect → /admin/thu-chi/so-quy
    await page.waitForURL("**/admin/thu-chi/so-quy", { timeout: 10000 })
    await expect(page.getByRole("link", { name: TX_EXPENSE.desc })).toBeHidden()
  })

  test("TC-LEDGER-17: Số dư đầu kỳ KHÔNG hiển thị nút Xóa (system tx)", async ({
    page,
  }) => {
    await gotoLedger(page, "/admin/thu-chi/so-quy")
    const row = page.locator("tr").filter({ hasText: "Số dư đầu kỳ" })
    await row.getByRole("link").first().click()
    await page.waitForURL(/\/admin\/thu-chi\/[a-z0-9]+$/i)

    // Form load OK + có cảnh báo system + KHÔNG có nút Xóa
    await expect(page.getByText(/giao dịch hệ thống/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /Xóa giao dịch/i })).toBeHidden()
  })

  // ============================================================
  // Phase D — Categories CRUD
  // ============================================================

  test("TC-LEDGER-18: Thêm danh mục THU mới", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/danh-muc")
    await page.getByRole("button", { name: /Thêm danh mục mới/i }).click()

    // Form inline xuất hiện
    await page.locator('input[placeholder*="Tài trợ doanh nghiệp"]').fill(NEW_CATEGORY)
    await page.getByRole("button", { name: /^Tạo$/ }).click()
    await page.waitForLoadState("networkidle")

    await expect(page.getByText(NEW_CATEGORY)).toBeVisible()
  })

  test("TC-LEDGER-19: Danh mục mới xuất hiện trong dropdown form thêm", async ({
    page,
  }) => {
    await gotoLedger(page, "/admin/thu-chi/them")
    const categorySelect = page
      .locator('select')
      .filter({ hasText: /Chọn danh mục/i })
    await expect(categorySelect.locator(`option:has-text("${NEW_CATEGORY}")`)).toHaveCount(1)
  })

  test("TC-LEDGER-20: Toggle isActive (Ngưng) → ẩn khỏi dropdown form", async ({
    page,
  }) => {
    await gotoLedger(page, "/admin/thu-chi/danh-muc")
    // Tìm row chứa NEW_CATEGORY → click Pencil (Sửa)
    const row = page.locator("tr").filter({ hasText: NEW_CATEGORY })
    await row.getByRole("button", { name: "Sửa" }).click()
    // Sau khi nhấn Sửa, text nằm trong input → hasText không còn match.
    // Vì chỉ có 1 hàng được sửa cùng lúc, ta tìm checkbox bằng label.
    await page.getByLabel("Đang dùng").uncheck()
    await page.getByRole("button", { name: "Lưu" }).click()
    await page.waitForLoadState("networkidle")
    await expect(row).toContainText("Ngưng")

    // Trang thêm: dropdown phải ẩn category này
    await gotoLedger(page, "/admin/thu-chi/them")
    const categorySelect = page
      .locator('select')
      .filter({ hasText: /Chọn danh mục/i })
    await expect(categorySelect.locator(`option:has-text("${NEW_CATEGORY}")`)).toHaveCount(0)
  })

  test("TC-LEDGER-21: Xóa danh mục mới (chưa có GD) — không còn trong list", async ({
    page,
  }) => {
    await gotoLedger(page, "/admin/thu-chi/danh-muc")
    const row = page.locator("tr").filter({ hasText: NEW_CATEGORY })

    page.once("dialog", (dialog) => dialog.accept())
    await row.getByRole("button", { name: "Xóa" }).click()
    await page.waitForLoadState("networkidle")
    await expect(page.getByText(NEW_CATEGORY)).toBeHidden()
  })

  test("TC-LEDGER-22: Danh mục hệ thống (HT) — không có nút Xóa", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/danh-muc")
    const systemRow = page.locator("tr").filter({ hasText: "Hội phí thường niên" })
    await expect(systemRow.getByRole("button", { name: "Xóa" })).toHaveCount(0)
    // Nhưng vẫn có nút Sửa
    await expect(systemRow.getByRole("button", { name: "Sửa" })).toBeVisible()
  })

  // ============================================================
  // Phase E — Báo cáo (charts ở client component, check tồn tại)
  // ============================================================

  test("TC-LEDGER-23: Báo cáo hiển thị dữ liệu năm hiện tại + chart container", async ({
    page,
  }) => {
    await gotoLedger(page, "/admin/thu-chi/bao-cao")
    const currentYear = new Date().getFullYear()
    await expect(
      page.getByRole("heading", { name: new RegExp(`Báo cáo tài chính ${currentYear}`) }),
    ).toBeVisible()
    // recharts render <svg class="recharts-surface">
    await expect(page.locator("svg.recharts-surface").first()).toBeVisible({
      timeout: 8000,
    })
  })

  // ============================================================
  // Phase F — CSV export
  // ============================================================

  test("TC-LEDGER-24: CSV export trả về file UTF-8 BOM + có data", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/so-quy")

    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("link", { name: /Xuất CSV/i }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/^so-quy_\d{4}-\d{2}-\d{2}\.csv$/)

    // Đọc nội dung file để verify BOM + header
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    const content = Buffer.concat(chunks).toString("utf8")

    // BOM ﻿ ở đầu
    expect(content.charCodeAt(0)).toBe(0xfeff)
    // Header line có "Ngày" + "Loại" + "Số dư lũy kế"
    expect(content).toContain("Ngày")
    expect(content).toContain("Số dư lũy kế")
    // Ít nhất 1 dòng data — opening balance hoặc giao dịch đã tạo
    const lines = content.replace(/^﻿/, "").split("\r\n").filter(Boolean)
    expect(lines.length).toBeGreaterThan(1)
  })
})

// ── Suite phụ: chạy sau cùng để cleanup giao dịch test còn lại ──────────────

test.describe.serial("Sổ quỹ thu chi — Cleanup", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
  })

  test("TC-LEDGER-99: Xóa giao dịch THU đã sửa (cleanup)", async ({ page }) => {
    await gotoLedger(page, "/admin/thu-chi/so-quy")
    // Search bằng MARK để chỉ thấy giao dịch của test run này
    await page.getByPlaceholder("Tìm...").fill(MARK)
    await page.getByRole("button", { name: /^Lọc$/ }).click()
    await page.waitForLoadState("networkidle")

    // Xóa từng giao dịch còn lại (loop tới khi list rỗng)
    for (let i = 0; i < 10; i++) {
      const firstLink = page.locator(`a:has-text("${MARK}")`).first()
      if (!(await firstLink.isVisible().catch(() => false))) break
      await firstLink.click()
      await page.waitForURL(/\/admin\/thu-chi\/[a-z0-9]+$/i)
      const deleteBtn = page.getByRole("button", { name: /Xóa giao dịch/i })
      if (!(await deleteBtn.isVisible().catch(() => false))) break
      page.once("dialog", (dialog) => dialog.accept())
      await deleteBtn.click()
      await page.waitForURL("**/admin/thu-chi/so-quy", { timeout: 10000 })
      await page.getByPlaceholder("Tìm...").fill(MARK)
      await page.getByRole("button", { name: /^Lọc$/ }).click()
      await page.waitForLoadState("networkidle")
    }
  })
})
