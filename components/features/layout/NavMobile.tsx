"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

export interface NavLink {
  label: string
  href: string
}

interface NavMobileProps {
  links: NavLink[]
  isLoggedIn: boolean
}

export function NavMobile({ links, isLoggedIn }: NavMobileProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-brand-100 hover:bg-brand-700 transition-colors"
        aria-label="Mở menu"
      >
        <Menu className="h-6 w-6" />
      </SheetTrigger>

      {/* w-full max-w-xs: full-width trên màn rất nhỏ, giới hạn 320px trở lên */}
      <SheetContent side="right" className="w-full max-w-xs bg-brand-900 border-brand-700 p-0">
        <SheetHeader className="px-6 py-5 border-b border-brand-700">
          <SheetTitle className="text-brand-400 font-heading text-lg text-left">
            Hội Trầm Hương VN
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              /* text-base = 16px — đúng chuẩn mobile tối thiểu */
              className="px-4 py-3 rounded-md text-brand-100 hover:bg-brand-700 hover:text-brand-300 transition-colors text-base font-medium"
            >
              {link.label}
            </Link>
          ))}

          {!isLoggedIn && (
            <>
              <Separator className="my-3 bg-brand-700" />
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-md text-brand-200 hover:bg-brand-700 transition-colors text-base"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="mt-1 px-4 py-3 rounded-md bg-secondary text-secondary-foreground hover:bg-brand-300 transition-colors text-base font-semibold text-center"
              >
                Đăng ký hội viên
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
