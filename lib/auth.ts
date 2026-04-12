import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { authConfig } from "./auth.config"
import type { Role } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,

    /**
     * Control whether a sign-in is allowed.
     * For OAuth (Google): allow sign-in, handle new users in jwt callback.
     * For Credentials: handled in authorize().
     */
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        // Check if user exists
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, isActive: true, role: true },
        })

        if (dbUser) {
          if (!dbUser.isActive) {
            // VIP/ADMIN inactive = admin chủ động disable → block
            if (dbUser.role !== "GUEST") return false
            // GUEST inactive = legacy pre-Phase 2 (chờ duyệt) → auto-activate
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { isActive: true },
            })
          }

          // Link Google account to existing user if not already linked
          const existingAccount = await prisma.account.findFirst({
            where: { userId: dbUser.id, provider: "google" },
          })
          if (!existingAccount && account.providerAccountId) {
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            })
          }
          return true
        }

        // Phase 2: tạo user kích hoạt ngay (free tier — post được nhưng quota thấp).
        const newUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.name ?? user.email.split("@")[0],
            avatarUrl: user.image ?? null,
            role: "GUEST",
            accountType: "BUSINESS",
            isActive: true,
            accounts: {
              create: {
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            },
          },
        })

        // Notify admin
        try {
          const { Resend } = await import("resend")
          const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")
          const adminEmail = (await prisma.siteConfig.findUnique({ where: { key: "association_email" } }))?.value ?? "admin@hoitramhuong.vn"
          await resend.emails.send({
            from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
            to: adminEmail,
            subject: `[Đăng ký mới qua Google] ${user.name ?? user.email}`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;">
                <h3>Đơn đăng ký hội viên mới (Google)</h3>
                <p><strong>Họ tên:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Avatar:</strong> <img src="${user.image}" width="40" height="40" style="border-radius:50%;" /></p>
                <p style="color:#888;">Người dùng đăng ký qua Google OAuth. Cần duyệt tại trang quản lý hội viên.</p>
                <p><a href="${process.env.NEXTAUTH_URL}/admin/hoi-vien?status=registration" style="display:inline-block;background:#1a5632;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Xem đơn đăng ký</a></p>
              </div>
            `,
          })
        } catch (err) {
          console.error("Failed to send Google registration notification:", err)
        }

        // Override user.id so NextAuth links to our DB user, not create a new one
        user.id = newUser.id
        return true
      }

      return true // Credentials handled in authorize()
    },

    /**
     * Runs server-side on sign-in and on JWT refresh.
     * Embeds role + membershipExpires into the JWT so middleware
     * can check them without a DB round-trip (Edge-safe).
     */
    async jwt({ token, user, account }) {
      // On first sign-in (user is present)
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, membershipExpires: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.membershipExpires = dbUser.membershipExpires?.toISOString() ?? null
        }
      }

      // For Google OAuth new users, ensure we use the DB user id
      if (account?.provider === "google" && user?.email && !user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, membershipExpires: true },
        })
        if (dbUser) {
          token.sub = dbUser.id
          token.role = dbUser.role
          token.membershipExpires = dbUser.membershipExpires?.toISOString() ?? null
        }
      }

      return token
    },

    /**
     * Shapes the session object exposed to the app via `auth()` / `useSession()`.
     * Reads from JWT — no DB query.
     */
    async session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as Role
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(session.user as any).membershipExpires = (token.membershipExpires as string | null) ?? null
      return session
    },
  },

  providers: [
    ...authConfig.providers,

    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            passwordHash: true,
            isActive: true,
            role: true,
          },
        })

        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null

        // Phase 2: auto-activate legacy GUEST users (pre-Phase 2 inactive state)
        if (!user.isActive) {
          if (user.role !== "GUEST") return null // VIP/ADMIN inactive = admin disabled
          await prisma.user.update({
            where: { id: user.id },
            data: { isActive: true },
          })
        }

        return { id: user.id, name: user.name, email: user.email, image: user.avatarUrl }
      },
    }),
  ],
})
