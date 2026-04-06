import { test, expect } from "@playwright/test"
import { login, ADMIN, VIP_A } from "./helpers"

test.describe("Auth & Routing", () => {
  test("TC-AUTH-01: Guest truy cap /tong-quan -> redirect /login", async ({ page }) => {
    await page.goto("/tong-quan")
    await expect(page).toHaveURL(/\/login/)
  })

  test("TC-AUTH-02: Guest truy cap /admin -> redirect /login", async ({ page }) => {
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/login/)
  })

  test("TC-AUTH-03: VIP truy cap /admin -> redirect ve /", async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
    await page.goto("/admin")
    await page.waitForURL((url) => !url.pathname.startsWith("/admin"), { timeout: 5000 })
    expect(page.url()).not.toContain("/admin")
  })

  test("TC-AUTH-04: Admin login -> redirect /admin", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await expect(page).toHaveURL(/\/admin/)
  })

  test("TC-AUTH-05: VIP login -> redirect /tong-quan", async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
    await expect(page).toHaveURL(/\/tong-quan/)
  })

  test("TC-AUTH-06: Admin da login -> /login redirect ve /admin", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password)
    await page.goto("/login")
    await expect(page).toHaveURL(/\/admin/)
  })

  test("TC-AUTH-07: VIP da login -> /login redirect ve /tong-quan", async ({ page }) => {
    await login(page, VIP_A.email, VIP_A.password)
    await page.goto("/login")
    await expect(page).toHaveURL(/\/tong-quan/)
  })

  test("TC-AUTH-08: Login sai mat khau -> hien loi", async ({ page }) => {
    await page.goto("/login")
    await page.fill("#email", VIP_A.email)
    await page.fill("#password", "wrong-password")
    await page.click('button[type="submit"]')
    await expect(page.locator("text=Email hoặc mật khẩu không chính xác")).toBeVisible({ timeout: 5000 })
  })

  test("TC-AUTH-09: Guest xem /feed -> trang load binh thuong", async ({ page }) => {
    await page.goto("/feed")
    // Feed should load (not redirect) — it's public
    await expect(page).toHaveURL(/\/feed/)
  })

  test("TC-AUTH-10: Guest /feed/tao-bai -> redirect /login", async ({ page }) => {
    await page.goto("/feed/tao-bai")
    await expect(page).toHaveURL(/\/login/)
  })
})
