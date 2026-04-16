"use client"

import { useState } from "react"
import Image from "next/image"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { VipNavLinks } from "./MemberSidebar"

/**
 * Top bar + Sheet drawer dành cho khu vực quản lý Hội viên trên mobile (< md / 768px).
 * Ẩn hoàn toàn trên tablet/desktop — MemberSidebar đảm nhiệm thay.
 */
export function MemberMobileNav({
  accountType,
  role,
  membershipActive = true,
}: {
  accountType?: "BUSINESS" | "INDIVIDUAL" | null
  role?: "GUEST" | "VIP" | "ADMIN" | "INFINITE" | null
  membershipActive?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="inline-flex items-center justify-center rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label="Mở menu quản lý"
        >
          <Menu className="h-6 w-6" />
        </SheetTrigger>

        <SheetContent side="left" className="w-72 bg-sidebar border-sidebar-border p-0 flex flex-col">
          <SheetHeader className="px-5 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Hội Trầm Hương Việt Nam"
                width={40}
                height={40}
                className="h-10 w-10 shrink-0"
              />
              <div>
                <SheetTitle className="text-sidebar-primary font-semibold text-sm leading-tight text-left">
                  Hội Trầm Hương
                </SheetTitle>
                <p className="text-sidebar-foreground/60 text-xs">Khu vực hội viên</p>
              </div>
            </div>
          </SheetHeader>

          <VipNavLinks accountType={accountType} role={role} membershipActive={membershipActive} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <span className="text-sidebar-foreground font-semibold text-base">
        Khu vực quản lý
      </span>
    </header>
  )
}
