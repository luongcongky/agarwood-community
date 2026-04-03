import type { DefaultSession } from "next-auth"
import type { Role } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      /** ISO date string — kept as string so JWT serialises cleanly */
      membershipExpires: string | null
    } & DefaultSession["user"]
  }

  /** Shape of the user object returned by the Credentials `authorize()` callback */
  interface User {
    role?: Role
    membershipExpires?: Date | null
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role
    membershipExpires?: string | null
  }
}
