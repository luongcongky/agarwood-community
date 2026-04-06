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

export const ADMIN = { email: "admin@hoi-tram-huong.vn", password: "123456" }
export const VIP_A = { email: "nguyen.van.a@tramhuong-hn.vn", password: "123456" }
export const VIP_B = { email: "tran.thi.b@tramhuong-hcm.vn", password: "123456" }
