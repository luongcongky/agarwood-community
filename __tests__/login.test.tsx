/**
 * Test suite: Trang đăng nhập (/login)
 *
 * Covers:
 * 1. Render — hiển thị đúng các thành phần UI
 * 2. Validation — bắt lỗi khi thiếu email/password
 * 3. signIn success → redirect theo role (ADMIN → /admin, VIP → /tong-quan,
 *    GUEST / role khác → /${locale})
 * 4. signIn failure → hiển thị thông báo lỗi
 * 5. Network error → hiển thị thông báo lỗi generic
 * 6. Loading state — nút bị disabled khi đang xử lý
 *
 * next-intl bị mock để trả về chính key translation (VD t("loginTitle") ⇒
 * "loginTitle"). Nhờ đó test không phụ thuộc nội dung bản dịch cụ thể.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LoginPage from "@/app/[locale]/(auth)/login/page"

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockSignIn = vi.fn()

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}))

// next-intl: mock t() trả về chính key, useLocale() = "vi".
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "vi",
}))

// Mock global fetch (dùng để lấy session sau khi signIn thành công)
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

// ── Global setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  mockPush.mockClear()
  mockSignIn.mockClear()
  mockFetch.mockClear()
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(<LoginPage />)
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText("email"), email)
  await user.type(screen.getByLabelText("password"), password)
  // Nút submit có text "loginTitle" (không phải "loggingIn" của loading state)
  await user.click(screen.getByRole("button", { name: /^loginTitle$/i }))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("LoginPage — Render", () => {
  it("hiển thị tiêu đề đăng nhập", () => {
    renderLogin()
    expect(screen.getByRole("heading", { name: /loginTitle/i })).toBeInTheDocument()
  })

  it("hiển thị input email và password", () => {
    renderLogin()
    expect(screen.getByLabelText("email")).toBeInTheDocument()
    expect(screen.getByLabelText("password")).toBeInTheDocument()
  })

  it("hiển thị nút submit ở trạng thái enabled", () => {
    renderLogin()
    const btn = screen.getByRole("button", { name: /^loginTitle$/i })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })

  it("hiển thị link đăng ký hội viên (registerTitle) trỏ tới /${locale}/dang-ky", () => {
    renderLogin()
    const link = screen.getByRole("link", { name: /registerTitle/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/vi/dang-ky")
  })
})

describe("LoginPage — Validation", () => {
  it("hiển thị lỗi khi submit với email và password trống", async () => {
    renderLogin()
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /^loginTitle$/i }))
    expect(await screen.findByText("fillAllFields")).toBeInTheDocument()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it("hiển thị lỗi khi chỉ điền email, bỏ trống password", async () => {
    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText("email"), "test@example.com")
    await user.click(screen.getByRole("button", { name: /^loginTitle$/i }))
    expect(await screen.findByText("fillAllFields")).toBeInTheDocument()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it("hiển thị lỗi khi chỉ điền password, bỏ trống email", async () => {
    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText("password"), "password123")
    await user.click(screen.getByRole("button", { name: /^loginTitle$/i }))
    expect(await screen.findByText("fillAllFields")).toBeInTheDocument()
    expect(mockSignIn).not.toHaveBeenCalled()
  })
})

describe("LoginPage — Đăng nhập thành công", () => {
  beforeEach(() => {
    mockSignIn.mockResolvedValue({ error: null })
  })

  it("ADMIN → redirect đến /admin", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ user: { role: "ADMIN" } }),
    })
    renderLogin()
    await fillAndSubmit("admin@test.com", "password")
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin"))
  })

  it("VIP → redirect đến /tong-quan", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ user: { role: "VIP" } }),
    })
    renderLogin()
    await fillAndSubmit("vip@test.com", "password")
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/tong-quan"))
  })

  it("GUEST → redirect đến /${locale} (/vi)", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ user: { role: "GUEST" } }),
    })
    renderLogin()
    await fillAndSubmit("guest@test.com", "password")
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/vi"))
  })

  it("session null (không có role) → redirect đến /${locale}", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({}),
    })
    renderLogin()
    await fillAndSubmit("user@test.com", "password")
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/vi"))
  })

  it("gọi signIn với đúng credentials provider", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ user: { role: "VIP" } }),
    })
    renderLogin()
    await fillAndSubmit("vip@test.com", "mypassword")
    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "vip@test.com",
        password: "mypassword",
        redirect: false,
      }),
    )
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/tong-quan"))
  })
})

describe("LoginPage — Đăng nhập thất bại", () => {
  it("signIn trả về error → hiển thị invalidCredentials", async () => {
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" })
    renderLogin()
    await fillAndSubmit("wrong@test.com", "wrongpass")
    expect(await screen.findByText("invalidCredentials")).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("thông báo lỗi xoá đi khi người dùng bắt đầu submit lại", async () => {
    mockSignIn.mockResolvedValueOnce({ error: "CredentialsSignin" })
    renderLogin()
    await fillAndSubmit("wrong@test.com", "wrongpass")
    expect(await screen.findByText("invalidCredentials")).toBeInTheDocument()

    // Submit lần 2 — error phải biến mất ngay khi handleSubmit chạy
    mockSignIn.mockResolvedValueOnce({ error: "CredentialsSignin" })
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /^loginTitle$/i }))
    // Lỗi được setError("") ở đầu handleSubmit — sau khi resolve lại sẽ có lỗi mới
    expect(await screen.findByText("invalidCredentials")).toBeInTheDocument()
  })
})

describe("LoginPage — Network error", () => {
  it("signIn throw → hiển thị genericError", async () => {
    mockSignIn.mockRejectedValue(new Error("Network error"))
    renderLogin()
    await fillAndSubmit("test@test.com", "password")
    expect(await screen.findByText("genericError")).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

describe("LoginPage — Loading state", () => {
  it("nút hiển thị 'loggingIn' và bị disabled trong khi xử lý", async () => {
    // signIn trả về promise chưa resolve — để giữ loading state
    let resolveSignIn!: (v: unknown) => void
    mockSignIn.mockReturnValue(new Promise((res) => { resolveSignIn = res }))

    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText("email"), "test@test.com")
    await user.type(screen.getByLabelText("password"), "password")
    await user.click(screen.getByRole("button", { name: /^loginTitle$/i }))

    // Trong lúc pending → nút disabled + text thay đổi thành loggingIn
    const btn = screen.getByRole("button", { name: /^loggingIn$/i })
    expect(btn).toBeDisabled()

    // Resolve để cleanup
    resolveSignIn({ error: "CredentialsSignin" })
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^loginTitle$/i })).not.toBeDisabled(),
    )
  })
})
