import { type Page } from "@playwright/test"

/**
 * Login via the /login page and wait for redirect.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.fill("#email", email)
  await page.fill("#password", password)
  await page.click('button[type="submit"]')
  // Wait for navigation away from /login
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 })
}

export const ADMIN = { email: "admin@hoitramhuong.vn", password: "Demo@123" }
export const VIP_A = { email: "trankhanh@tramhuongkhanhhoa.vn", password: "Demo@123" }
export const VIP_B = { email: "levanminh@tramhuongquangnam.vn", password: "Demo@123" }
