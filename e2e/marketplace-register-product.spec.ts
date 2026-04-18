// ============================================================
// Marketplace "+ List a product" button — E2E walkthrough
//
// Verifies what actually happens when a visitor clicks the
// "+ Đăng sản phẩm" / "+ List a product" button on
// /en/san-pham-doanh-nghiep. Runs headed by default so the
// customer can watch the redirect chain live.
//
// Chạy: npx playwright test e2e/marketplace-register-product.spec.ts --headed
// ============================================================

import { test, expect, type Page } from "@playwright/test"
import { login, VIP_A } from "./helpers"

const PAUSE = 800

async function pause(page: Page, ms = PAUSE) {
  await page.waitForTimeout(ms)
}

test.describe.serial("Marketplace — Register product button", () => {

  test("01 — Guest sees NO register button; footer shows Sign in CTA", async ({ page }) => {
    await page.goto("/en/san-pham-doanh-nghiep")
    await page.waitForLoadState("networkidle")
    await pause(page, 800)

    // Hero banner register button must NOT exist for guests (any href that
    // points to the product-create flow)
    const registerLink = page.locator('a[href*="feed/tao-bai"], a[href*="san-pham/tao-moi"]')
    const count = await registerLink.count()
    console.log(`Guest: register button count = ${count}`)
    expect(count).toBe(0)

    // Footer CTA should show "Sign in" link to /login (guest variant)
    const loginLink = page.locator('a[href="/login"]').first()
    await expect(loginLink).toBeVisible()
    await pause(page, 600)
  })

  test("02 — Logged-in VIP: button → redirects to composer with PRODUCT category", async ({ page }) => {
    test.setTimeout(60000)

    await login(page, VIP_A.email, VIP_A.password)
    await pause(page, 600)

    await page.goto("/en/san-pham-doanh-nghiep")
    await page.waitForLoadState("networkidle")
    await pause(page, 800)

    // Hero "+ List a product" button must be visible
    const registerLink = page.locator('a[href*="feed/tao-bai"]').first()
    await expect(registerLink).toBeVisible()
    console.log("URL before click:", page.url())
    await pause(page, 600)

    // Click and trace the redirect chain
    await registerLink.click()

    // The page goes through: /san-pham/tao-moi → /feed/tao-bai?category=PRODUCT
    // next-intl may inject a locale prefix on the way. Wait until we land on
    // the final composer URL.
    await page.waitForURL(/\/feed\/tao-bai/, { timeout: 15000 })
    await page.waitForLoadState("networkidle")
    await pause(page, 800)

    const finalUrl = page.url()
    console.log("URL after click:", finalUrl)

    // Must include the PRODUCT category query param
    expect(finalUrl).toContain("category=PRODUCT")

    // Composer should have rendered the product sidecar. Its heading is the
    // translated "Product info" in EN (`productInfoTitle` in messages/en.json).
    const productInfoHeading = page.locator('h3:has-text("Product info")')
    await expect(productInfoHeading).toBeVisible({ timeout: 10000 })
    await pause(page, 1200)

    // Verify the PRODUCT category button is the active one (bg-brand-700 class
    // applied only to the selected option).
    const productTab = page.getByRole("button", { name: /^Product$/ }).first()
    await expect(productTab).toHaveClass(/bg-brand-700/)
    await pause(page, 800)
  })

})
