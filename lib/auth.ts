import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
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
     * Runs server-side on sign-in and on JWT refresh.
     * Embeds role + membershipExpires into the JWT so middleware
     * can check them without a DB round-trip (Edge-safe).
     */
    async jwt({ token, user }) {
      // `user` is only present on the first sign-in
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
          },
        })

        if (!user?.passwordHash || !user.isActive) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, image: user.avatarUrl }
      },
    }),
  ],
})
