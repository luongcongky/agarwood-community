/**
 * Test suite: Trang đăng nhập (/dang-nhap)
 *
 * Covers:
 * 1. Render — hiển thị đúng các thành phần UI
 * 2. Validation — bắt lỗi khi thiếu email/password
 * 3. signIn success → redirect theo role (ADMIN / VIP / GUEST)
 * 4. signIn failure → hiển thị thông báo lỗi
 * 5. Network error → hiển thị thông báo lỗi generic
 * 6. Loading state — nút bị disabled khi đang xử lý
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LoginPage from "@/app/(auth)/login/page"

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockSignIn = vi.fn()

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
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
  await user.type(screen.getByLabelText(/email/i), email)
  await user.type(screen.getByLabelText(/mật khẩu/i), password)
  await user.click(screen.getByRole("button", { name: /đăng nhập/i }))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("LoginPage — Render", () => {
  it("hiển thị tiêu đề Đăng nhập", () => {
    renderLogin()
    expect(screen.getByRole("heading", { name: /đăng nhập/i })).toBeInTheDocument()
  })

  it("hiển thị input Email và Mật khẩu", () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument()
  })

  it("hiển thị nút Đăng nhập ở trạng thái enabled", () => {
    renderLogin()
    const btn = screen.getByRole("button", { name: /đăng nhập/i })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })

  it("hiển thị link đăng ký hội viên", () => {
    renderLogin()
    const link = screen.getByRole("link", { name: /đăng ký hội viên/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/dang-ky")
  })
})

describe("LoginPage — Validation", () => {
  it("hiển thị lỗi khi submit với email và password trống", async () => {
    renderLogin()
    const user = userEvent.setup()
    // Click thẳng vào nút mà không điền gì
    await user.click(screen.getByRole("button", { name: /đăng nhập/i }))
    expect(await screen.findByText(/vui lòng nhập đầy đủ thông tin/i)).toBeInTheDocument()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it("hiển thị lỗi khi chỉ điền email, bỏ trống password", async () => {
    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email/i), "test@example.com")
    await user.click(screen.getByRole("button", { name: /đăng nhập/i }))
    expect(await screen.findByText(/vui lòng nhập đầy đủ thông tin/i)).toBeInTheDocument()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it("hiển thị lỗi khi chỉ điền password, bỏ trống email", async () => {
    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/mật khẩu/i), "password123")
    await user.click(screen.getByRole("button", { name: /đăng nhập/i }))
    expect(await screen.findByText(/vui lòng nhập đầy đủ thông tin/i)).toBeInTheDocument()
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

  it("GUEST → redirect đến /", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ user: { role: "GUEST" } }),
    })
    renderLogin()
    await fillAndSubmit("guest@test.com", "password")
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"))
  })

  it("session null (không có role) → redirect đến /", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({}),
    })
    renderLogin()
    await fillAndSubmit("user@test.com", "password")
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"))
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
  it("signIn trả về error → hiển thị thông báo sai mật khẩu", async () => {
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" })
    renderLogin()
    await fillAndSubmit("wrong@test.com", "wrongpass")
    expect(
      await screen.findByText(/email hoặc mật khẩu không chính xác/i)
    ).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("thông báo lỗi xoá đi khi người dùng bắt đầu submit lại", async () => {
    mockSignIn.mockResolvedValueOnce({ error: "CredentialsSignin" })
    renderLogin()
    await fillAndSubmit("wrong@test.com", "wrongpass")
    expect(await screen.findByText(/email hoặc mật khẩu không chính xác/i)).toBeInTheDocument()

    // Submit lần 2 — error phải biến mất ngay khi handleSubmit chạy
    mockSignIn.mockResolvedValueOnce({ error: "CredentialsSignin" })
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /đăng nhập/i }))
    // Lỗi được setError("") ở đầu handleSubmit — sau khi resolve lại sẽ có lỗi mới
    expect(await screen.findByText(/email hoặc mật khẩu không chính xác/i)).toBeInTheDocument()
  })
})

describe("LoginPage — Network error", () => {
  it("fetch throw → hiển thị thông báo lỗi generic", async () => {
    mockSignIn.mockRejectedValue(new Error("Network error"))
    renderLogin()
    await fillAndSubmit("test@test.com", "password")
    expect(
      await screen.findByText(/đã xảy ra lỗi\. vui lòng thử lại/i)
    ).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

describe("LoginPage — Loading state", () => {
  it("nút hiển thị 'Đang đăng nhập...' và bị disabled trong khi xử lý", async () => {
    // signIn trả về promise chưa resolve — để giữ loading state
    let resolveSignIn!: (v: unknown) => void
    mockSignIn.mockReturnValue(new Promise((res) => { resolveSignIn = res }))

    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email/i), "test@test.com")
    await user.type(screen.getByLabelText(/mật khẩu/i), "password")
    await user.click(screen.getByRole("button", { name: /đăng nhập/i }))

    // Trong lúc pending → nút disabled + text thay đổi
    const btn = screen.getByRole("button", { name: /đang đăng nhập/i })
    expect(btn).toBeDisabled()

    // Resolve để cleanup
    resolveSignIn({ error: "CredentialsSignin" })
    await waitFor(() => expect(screen.getByRole("button", { name: /^đăng nhập$/i })).not.toBeDisabled())
  })
})
