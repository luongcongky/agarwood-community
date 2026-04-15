"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import type { MenuNode } from "@/lib/menu"
import { getActiveNodeIds } from "@/lib/menu-active"

export function NavDesktopMenu({ tree }: { tree: MenuNode[] }) {
  const pathname = usePathname() ?? "/"
  const activeIds = getActiveNodeIds(tree, pathname)
  return (
    <>
      {tree.map((node) => (
        <NavDesktopItem key={node.id} node={node} isActive={activeIds.has(node.id)} />
      ))}
    </>
  )
}

function NavDesktopItem({ node, isActive }: { node: MenuNode; isActive: boolean }) {
  const [open, setOpen] = useState(false)
  const hasChildren = node.children.length > 0

  if (node.comingSoon) {
    return (
      <span
        title="Sắp có"
        aria-disabled="true"
        className="px-3 py-2 rounded-md text-sm font-medium text-brand-400 cursor-not-allowed inline-flex items-center gap-1.5"
      >
        {node.label}
        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-700 text-brand-300">
          Sắp có
        </span>
      </span>
    )
  }

  const linkClass =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1 " +
    (isActive
      ? "bg-brand-700 text-brand-100"
      : "text-brand-200 hover:bg-brand-700 hover:text-brand-300")

  if (!hasChildren) {
    return (
      <Link
        href={node.href}
        target={node.openInNewTab ? "_blank" : undefined}
        aria-current={isActive ? "page" : undefined}
        className={linkClass}
      >
        {node.label}
        {node.isNew && <NewBadge />}
      </Link>
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={node.href}
        target={node.openInNewTab ? "_blank" : undefined}
        aria-current={isActive ? "page" : undefined}
        aria-haspopup="true"
        aria-expanded={open}
        className={linkClass}
      >
        {node.label}
        {node.isNew && <NewBadge />}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </Link>

      {open && (
        <div role="menu" className="absolute left-0 top-full pt-1 min-w-[200px] z-50">
          <div className="rounded-lg bg-brand-800 border border-brand-700 shadow-lg py-1.5">
            {node.children.map((child) =>
              child.comingSoon ? (
                <span
                  key={child.id}
                  title="Sắp có"
                  className="block px-4 py-2 text-sm text-brand-400 cursor-not-allowed"
                >
                  {child.label}
                </span>
              ) : (
                <Link
                  key={child.id}
                  href={child.href}
                  target={child.openInNewTab ? "_blank" : undefined}
                  className="block px-4 py-2 text-sm text-brand-200 hover:bg-brand-700 hover:text-brand-100 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {child.label}
                  {child.isNew && <NewBadge />}
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NewBadge() {
  return (
    <span
      style={{ fontSize: "8px", lineHeight: 1, color: "#ef4444" }}
      className="font-bold uppercase ml-0.5"
    >
      Thử nghiệm
    </span>
  )
}
