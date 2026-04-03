"use client"

import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { LogOut, User, Settings } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Role } from "@prisma/client"

interface UserMenuProps {
  name: string | null | undefined
  email: string | null | undefined
  image: string | null | undefined
  role: Role
}

const roleLabel: Record<Role, string> = {
  GUEST: "Khách",
  VIP: "Hội viên",
  ADMIN: "Quản trị",
}

const roleBadgeClass: Record<Role, string> = {
  GUEST: "bg-muted text-muted-foreground",
  VIP: "bg-secondary text-secondary-foreground",
  ADMIN: "bg-primary text-primary-foreground",
}

export function UserMenu({ name, email, image, role }: UserMenuProps) {
  const router = useRouter()
  const initials = name?.trim() 
    ? name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).slice(-2).join("").toUpperCase()
    : "?"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="h-8 w-8 border-2 border-brand-400">
          <AvatarImage src={image ?? undefined} alt={name ?? ""} />
          <AvatarFallback className="bg-brand-700 text-brand-100 text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden md:block text-sm font-medium text-brand-100 max-w-[120px] truncate">
          {name}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="font-semibold truncate">{name}</span>
          <span className="text-xs text-muted-foreground font-normal truncate">{email}</span>
          <Badge className={`w-fit text-xs mt-1 ${roleBadgeClass[role]}`}>
            {roleLabel[role]}
          </Badge>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/company")}>
          <User className="mr-2 h-4 w-4" />
          Hồ sơ doanh nghiệp
        </DropdownMenuItem>

        {role === "ADMIN" && (
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <Settings className="mr-2 h-4 w-4" />
            Trang quản trị
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
