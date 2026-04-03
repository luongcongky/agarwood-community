import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileForm } from "./ProfileForm"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      bankAccountName: true,
      bankAccountNumber: true,
      bankName: true,
      role: true,
      contributionTotal: true,
      membershipExpires: true,
      displayPriority: true,
    },
  })
  if (!user) redirect("/login")

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-heading font-semibold text-brand-900">Hồ sơ cá nhân</h1>
      <ProfileForm
        user={{
          ...user,
          membershipExpires: user.membershipExpires?.toISOString() ?? null,
        }}
      />
    </div>
  )
}
