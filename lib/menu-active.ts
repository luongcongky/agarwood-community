import type { MenuNode } from "./menu"
import { lookupMenuKey } from "./route-menu-map"

/**
 * Resolve tập id node đang active cho pathname — tính 1 lần trên cả cây.
 *
 * Ưu tiên (admin-first, mutually exclusive):
 *  - Registry khai báo `null` cho pathname → không highlight gì.
 *  - Có ít nhất 1 node match qua admin config (href/matchPrefixes) → chỉ
 *    các node đó active. Registry bị bỏ qua hoàn toàn để tránh double-highlight.
 *  - Không có node nào match admin → fallback registry: node có menuKey
 *    trùng registry key được active.
 */
export function getActiveNodeIds(tree: MenuNode[], pathname: string): Set<string> {
  const active = new Set<string>()
  const registryKey = lookupMenuKey(pathname)
  if (registryKey === null) return active

  // Pass 1: admin config
  for (const top of tree) {
    if (matchSingle(top, pathname)) { active.add(top.id); continue }
    for (const child of top.children) {
      if (matchSingle(child, pathname)) { active.add(top.id); break }
    }
  }
  if (active.size > 0) return active

  // Pass 2: registry fallback
  if (registryKey !== undefined) {
    for (const top of tree) {
      if (top.menuKey === registryKey) active.add(top.id)
    }
  }
  return active
}

/** @deprecated — dùng getActiveNodeIds để tránh double-highlight giữa admin và registry */
export function isNodeActive(node: MenuNode, pathname: string): boolean {
  return getActiveNodeIds([node], pathname).has(node.id)
}

const LOCALE_ROOTS = new Set(["/vi", "/en", "/zh"])

function matchSingle(node: MenuNode, pathname: string): boolean {
  if (node.href === pathname) return true
  // Don't let locale root (e.g. "/en") prefix-match all pages like "/en/gioi-thieu"
  if (node.href !== "/" && !LOCALE_ROOTS.has(node.href) && pathname.startsWith(node.href + "/")) return true
  for (const p of node.matchPrefixes) {
    if (!p) continue
    if (pathname === p || pathname.startsWith(p + "/")) return true
  }
  return false
}
