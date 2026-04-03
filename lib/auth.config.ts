import type { NextAuthConfig } from "next-auth"

/**
 * Edge-safe auth config — NO prisma imports, NO Node.js-only packages.
 * Used by middleware.ts (runs on Edge Runtime).
 * lib/auth.ts extends this with the PrismaAdapter and full callbacks.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    // Intentionally permissive — fine-grained control lives in middleware.ts
    authorized() {
      return true
    },
  },
}
