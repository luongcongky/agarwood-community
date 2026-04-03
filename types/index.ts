import type { Role, MembershipStatus, PostStatus, CertStatus, MediaOrderStatus, MediaServiceType, PaymentStatus, PaymentType } from "@prisma/client"

// Re-export Prisma enums for use across the app
export type { Role, MembershipStatus, PostStatus, CertStatus, MediaOrderStatus, MediaServiceType, PaymentStatus, PaymentType }

// Session user — augments NextAuth's built-in User type
export interface SessionUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role: Role
  membershipExpires: Date | null
}

// Shared API response wrapper
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
