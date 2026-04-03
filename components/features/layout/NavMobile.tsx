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
        <Menu className="h-5 w-5" />
      </SheetTrigger>

      <SheetContent side="right" className="w-72 bg-brand-900 border-brand-700 p-0">
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
              className="px-3 py-2.5 rounded-md text-brand-100 hover:bg-brand-700 hover:text-brand-300 transition-colors text-sm font-medium"
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
                className="px-3 py-2.5 rounded-md text-brand-200 hover:bg-brand-700 transition-colors text-sm"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="mt-1 px-3 py-2.5 rounded-md bg-secondary text-secondary-foreground hover:bg-brand-300 transition-colors text-sm font-semibold text-center"
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
