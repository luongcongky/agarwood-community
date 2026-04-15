import type { NextAuthConfig } from "next-auth"

/**
 * Edge-safe auth config — NO prisma imports, NO Node.js-only packages.
 * Used by proxy.ts (runs on Edge Runtime).
 * lib/auth.ts extends this with the PrismaAdapter and full callbacks.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 /* 30 days */ },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    // Intentionally permissive — fine-grained control lives in proxy.ts
    authorized() {
      return true
    },

    /**
     * Map JWT claims → session.user so proxy.ts can read role & membershipExpires.
     * Edge-safe: reads only from the JWT token, no DB access.
     */
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      if (token.role) session.user.role = token.role as "GUEST" | "VIP" | "ADMIN" | "INFINITE"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(session.user as any).membershipExpires = (token.membershipExpires as string | null) ?? null
      return session
    },
  },
}
