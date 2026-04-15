"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ChevronDown } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import type { MenuNode } from "@/lib/menu"
import { getActiveNodeIds } from "@/lib/menu-active"

interface NavMobileProps {
  menu: MenuNode[]
  isLoggedIn: boolean
}

export function NavMobile({ menu, isLoggedIn }: NavMobileProps) {
  const pathname = usePathname() ?? "/"
  const activeIds = getActiveNodeIds(menu, pathname)
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-brand-100 hover:bg-brand-700 transition-colors"
        aria-label="Mở menu"
      >
        <Menu className="h-6 w-6" />
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-xs bg-brand-900 border-brand-700 p-0">
        <SheetHeader className="px-6 py-5 border-b border-brand-700">
          <SheetTitle className="text-brand-400 text-lg text-left">
            Hội Trầm Hương VN
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
          {menu.map((node) => (
            <MobileNode
              key={node.id}
              node={node}
              isActive={activeIds.has(node.id)}
              onNavigate={() => setOpen(false)}
            />
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
                href="/dang-ky"
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

function MobileNode({
  node,
  isActive,
  onNavigate,
}: {
  node: MenuNode
  isActive: boolean
  onNavigate: () => void
}) {
  const hasChildren = node.children.length > 0
  const [expanded, setExpanded] = useState(isActive)

  if (node.comingSoon) {
    return (
      <span
        title="Sắp có"
        aria-disabled="true"
        className="px-4 py-3 rounded-md text-brand-400 text-base font-medium cursor-not-allowed flex items-center justify-between"
      >
        {node.label}
        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-700 text-brand-300">Sắp có</span>
      </span>
    )
  }

  const itemClass =
    "px-4 py-3 rounded-md transition-colors text-base font-medium flex items-center justify-between " +
    (isActive ? "bg-brand-700 text-brand-300" : "text-brand-100 hover:bg-brand-700 hover:text-brand-300")

  return (
    <div>
      <div className="flex items-stretch gap-1">
        <Link
          href={node.href}
          target={node.openInNewTab ? "_blank" : undefined}
          onClick={onNavigate}
          aria-current={isActive ? "page" : undefined}
          className={itemClass + " flex-1"}
        >
          <span className="inline-flex items-start">
            {node.label}
            {node.isNew && (
              <span style={{ fontSize: "9px", lineHeight: 1, color: "#ef4444" }} className="font-bold uppercase ml-0.5">
                Thử nghiệm
              </span>
            )}
          </span>
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Thu gọn submenu" : "Mở submenu"}
            className="px-3 rounded-md text-brand-200 hover:bg-brand-700"
          >
            <ChevronDown className={"h-4 w-4 transition-transform " + (expanded ? "rotate-180" : "")} />
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="ml-3 mt-1 border-l border-brand-700 pl-2 flex flex-col gap-0.5">
          {node.children.map((child) =>
            child.comingSoon ? (
              <span key={child.id} className="px-3 py-2 text-sm text-brand-400">{child.label}</span>
            ) : (
              <Link
                key={child.id}
                href={child.href}
                target={child.openInNewTab ? "_blank" : undefined}
                onClick={onNavigate}
                className="px-3 py-2 rounded-md text-sm text-brand-200 hover:bg-brand-700 hover:text-brand-100"
              >
                {child.label}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  )
}
