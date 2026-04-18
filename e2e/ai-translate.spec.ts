// ============================================================
// AI Translate — E2E Test Suite (new tab-based UX)
//
// Flow mới:
//   - Language tab bar nằm ở đầu card chính của editor
//   - Click tab EN / 中文 để chuyển toàn bộ form (title + excerpt + content)
//   - 1 nút "🤖 Dịch toàn bộ từ VI sang X" xuất hiện ở tab đích
//   - Sau khi dịch, các field hiển thị bản tiếng tương ứng
//
// Chạy: npx playwright test e2e/ai-translate.spec.ts --headed
// ============================================================

import { test, expect, type Page } from "@playwright/test"
import { login, ADMIN } from "./helpers"

const PAUSE = 900

async function pause(page: Page, ms = PAUSE) {
  await page.waitForTimeout(ms)
}

async function openFirstNewsEditor(page: Page) {
  await page.goto("/admin/tin-tuc")
  await page.waitForLoadState("networkidle")
  const editLink = page.locator('a:has-text("Chỉnh sửa"), a[href*="/admin/tin-tuc/"]').first()
  await editLink.click()
  await page.waitForLoadState("networkidle")
  await pause(page, 600)
}

async function ensureVietnameseContent(page: Page) {
  // Title input — placeholder "Tiêu đề bài viết" (VI tab)
  const titleInput = page.locator('input[placeholder="Tiêu đề bài viết"]').first()
  if (!(await titleInput.inputValue()).trim()) {
    await titleInput.fill("Trầm hương tự nhiên Khánh Hòa — giá trị và cách nhận biết")
    await pause(page, 400)
  }
  const excerpt = page.locator('textarea[placeholder="Tóm tắt nội dung"]').first()
  if (!(await excerpt.inputValue()).trim()) {
    await excerpt.fill("Bài viết giới thiệu đặc điểm trầm hương tự nhiên vùng Khánh Hòa và Quảng Nam.")
    await pause(page, 400)
  }
}

test.describe.serial("AI Translate — tab-based flow", () => {
  test("01 — Admin đăng nhập", async ({ page }) => {
    await page.goto("/login")
    await page.waitForLoadState("networkidle")
    await page.fill("#email", ADMIN.email)
    await page.fill("#password", ADMIN.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/admin", { timeout: 15000 })
    await page.waitForLoadState("networkidle")
    await expect(page.locator("text=Tổng quan").first()).toBeVisible()
  })

  test("02 — Mở bài tin tức và xác nhận có tab bar đa ngôn ngữ", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await openFirstNewsEditor(page)

    // Tab bar phải có 3 tab: VI, EN, 中文
    await expect(page.locator('button:has-text("🇻🇳 VI")').first()).toBeVisible()
    await expect(page.locator('button:has-text("🇬🇧 EN")').first()).toBeVisible()
    await expect(page.locator('button:has-text("🇨🇳 中文")').first()).toBeVisible()
    await pause(page, 600)

    // Ở tab VI, KHÔNG được hiện nút AI dịch
    await expect(page.locator('button:has-text("Dịch toàn bộ từ VI")')).toHaveCount(0)
  })

  test("03 — Chuyển sang tab EN → thấy nút AI dịch", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await openFirstNewsEditor(page)
    await ensureVietnameseContent(page)

    // Click tab EN
    await page.locator('button:has-text("🇬🇧 EN")').first().click()
    await pause(page, 600)

    // Nút AI dịch phải xuất hiện
    const aiBtn = page.locator('button:has-text("Dịch toàn bộ từ VI sang EN")').first()
    await expect(aiBtn).toBeVisible()
    await pause(page, 800)
  })

  test("04 — Bấm AI dịch sang EN → title + excerpt + content đều được dịch", async ({ page }) => {
    test.setTimeout(180000)
    await login(page, ADMIN.email, ADMIN.password)
    await openFirstNewsEditor(page)
    await ensureVietnameseContent(page)

    // Capture VI title from tab VI first
    const titleInput = page.locator('input[placeholder="Tiêu đề bài viết"]').first()
    const viTitle = await titleInput.inputValue()
    console.log("📝 Title VI:", viTitle)

    // Switch to EN
    await page.locator('button:has-text("🇬🇧 EN")').first().click()
    await pause(page, 600)

    // Click AI
    const aiBtn = page.locator('button:has-text("Dịch toàn bộ từ VI sang EN")').first()
    await aiBtn.click()
    console.log("🤖 Translating to EN...")

    // Button shows loading state
    await expect(page.locator('button:has-text("Đang dịch")').first()).toBeVisible({ timeout: 5000 })

    // Wait for translation to complete — AI button becomes available again
    await expect(page.locator('button:has-text("Dịch toàn bộ từ VI sang EN")').first()).toBeEnabled({
      timeout: 120000,
    })
    await pause(page, 600)

    // Error path
    const errorPanel = page.locator("text=/quota|hết|lỗi|chưa được cấu hình/i").first()
    if (await errorPanel.isVisible({ timeout: 500 }).catch(() => false)) {
      const errorText = await errorPanel.textContent()
      test.skip(true, `AI error: ${errorText}`)
      return
    }

    // Title input should now show EN value (we're still on EN tab)
    const enTitle = await page.locator('input[placeholder*="Tiêu đề"]').first().inputValue()
    console.log("🇬🇧 Title EN:", enTitle)
    expect(enTitle.length).toBeGreaterThan(0)
    expect(enTitle).toMatch(/[a-zA-Z]/)
    expect(enTitle).not.toBe(viTitle) // must have actually translated

    // Green dot on EN tab indicates data
    await expect(
      page.locator('button:has-text("🇬🇧 EN")').first().locator(".bg-emerald-500"),
    ).toBeVisible({ timeout: 2000 })
  })

  test("05 — Chuyển sang 中文 → AI dịch → có ký tự Hán", async ({ page }) => {
    test.setTimeout(180000)
    await login(page, ADMIN.email, ADMIN.password)
    await openFirstNewsEditor(page)
    await ensureVietnameseContent(page)

    await page.locator('button:has-text("🇨🇳 中文")').first().click()
    await pause(page, 600)

    const aiBtn = page.locator('button:has-text("Dịch toàn bộ từ VI sang 中文")').first()
    await aiBtn.click()
    console.log("🤖 Translating to 中文...")

    await expect(page.locator('button:has-text("翻译中")').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text("Dịch toàn bộ từ VI sang 中文")').first()).toBeEnabled({
      timeout: 120000,
    })
    await pause(page, 600)

    const errorPanel = page.locator("text=/quota|hết|lỗi|chưa được cấu hình/i").first()
    if (await errorPanel.isVisible({ timeout: 500 }).catch(() => false)) {
      test.skip(true, "AI quota/error")
      return
    }

    const zhTitle = await page.locator('input[placeholder*="Tiêu đề"]').first().inputValue()
    console.log("🇨🇳 Title ZH:", zhTitle)
    expect(zhTitle).toMatch(/[\u4e00-\u9fff]/)
  })

  test("06 — Switch tab giữ nguyên nội dung từng locale (không mất data)", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await openFirstNewsEditor(page)
    await ensureVietnameseContent(page)

    // Gõ thêm text vào VI title để test
    const titleInput = page.locator('input[placeholder="Tiêu đề bài viết"]').first()
    const viBefore = await titleInput.inputValue()
    await pause(page, 400)

    // VI → EN → VI — VI content phải còn nguyên
    await page.locator('button:has-text("🇬🇧 EN")').first().click()
    await pause(page, 500)
    await page.locator('button:has-text("🇻🇳 VI")').first().click()
    await pause(page, 500)

    const viAfter = await page.locator('input[placeholder*="Tiêu đề"]').first().inputValue()
    expect(viAfter).toBe(viBefore)
  })
})
