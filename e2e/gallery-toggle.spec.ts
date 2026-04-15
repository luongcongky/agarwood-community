import { test, expect, type Page } from "@playwright/test"
import { login, ADMIN } from "./helpers"

/**
 * Bug cũ: toggle Active → Inactive OK, nhưng Inactive → Active ảnh background
 * không hiện lại. Nguyên nhân: revalidatePath("/") chỉ revalidate page, không
 * revalidate layout; HeroBackdrop nằm ở (public)/layout.tsx nên cache stale.
 *
 * Fix: revalidatePath("/", "layout"). Test này verify cả 2 chiều hoạt động.
 *
 * Yêu cầu: local DB có ≥1 HeroImage.
 */

async function setActive(page: Page, targetActive: boolean) {
  const activeBtn = page.getByRole("button", { name: "Đang active" }).first()
  const hiddenBtn = page.getByRole("button", { name: "Đang ẩn" }).first()
  if (targetActive) {
    if (await hiddenBtn.isVisible().catch(() => false)) {
      await hiddenBtn.click()
      await expect(page.getByRole("button", { name: "Đang active" }).first()).toBeVisible({ timeout: 5000 })
    }
  } else {
    if (await activeBtn.isVisible().catch(() => false)) {
      await activeBtn.click()
      await expect(page.getByRole("button", { name: "Đang ẩn" }).first()).toBeVisible({ timeout: 5000 })
    }
  }
}

test("admin toggle gallery active/inactive phản ánh đúng trên homepage", async ({ page, context }) => {
  test.setTimeout(90000)

  await login(page, ADMIN.email, ADMIN.password)
  await page.goto("/admin/gallery")
  await expect(page.getByRole("heading", { name: /Gallery ảnh nền/i })).toBeVisible()

  // Đảm bảo starting state: active
  await setActive(page, true)

  const homePage = await context.newPage()

  // ── Step 1: trạng thái ban đầu active → backdrop hiện ───────────────
  await homePage.goto("/")
  await expect(homePage.getByTestId("hero-backdrop")).toBeVisible({ timeout: 5000 })
  const initialBg = await homePage
    .getByTestId("hero-backdrop")
    .evaluate((el) => (el as HTMLElement).style.backgroundImage)
  expect(initialBg).toMatch(/cloudinary/)

  // ── Step 2: toggle inactive → backdrop biến mất ─────────────────────
  await setActive(page, false)
  await homePage.reload()
  await expect(homePage.getByTestId("hero-backdrop")).toHaveCount(0, { timeout: 5000 })

  // ── Step 3: toggle lại active → backdrop phải quay lại (bug cũ fail ở đây)
  await setActive(page, true)
  await homePage.reload()
  await expect(homePage.getByTestId("hero-backdrop")).toBeVisible({ timeout: 5000 })
  const restoredBg = await homePage
    .getByTestId("hero-backdrop")
    .evaluate((el) => (el as HTMLElement).style.backgroundImage)
  expect(restoredBg).toMatch(/cloudinary/)

  await homePage.close()
})
