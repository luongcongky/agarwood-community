import { prisma } from "./prisma"

export type MenuNode = {
  id: string
  menuKey: string | null
  label: string
  href: string
  isNew: boolean
  comingSoon: boolean
  openInNewTab: boolean
  matchPrefixes: string[]
  children: MenuNode[]
}

let cache: { ts: number; tree: MenuNode[] } | null = null
const TTL = 60_000 // 60s — menu rất ít đổi, có thể tăng

export function clearMenuCache() {
  cache = null
}

/**
 * Lấy menu tree (chỉ items isVisible=true), sort theo sortOrder.
 * Cache 60s. Chỉ render menu cha + 1 cấp con.
 */
export async function getMenuTree(): Promise<MenuNode[]> {
  if (cache && Date.now() - cache.ts < TTL) return cache.tree

  const items = await prisma.menuItem.findMany({
    where: { isVisible: true },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  })

  const byParent = new Map<string | null, typeof items>()
  for (const it of items) {
    const k = it.parentId
    if (!byParent.has(k)) byParent.set(k, [])
    byParent.get(k)!.push(it)
  }

  function build(parentId: string | null): MenuNode[] {
    return (byParent.get(parentId) ?? []).map((it) => ({
      id: it.id,
      menuKey: it.menuKey,
      label: it.label,
      href: it.href,
      isNew: it.isNew,
      comingSoon: it.comingSoon,
      openInNewTab: it.openInNewTab,
      matchPrefixes: it.matchPrefixes,
      children: build(it.id),
    }))
  }

  const tree = build(null)
  cache = { ts: Date.now(), tree }
  return tree
}

/**
 * Tìm id của top-level menu cần highlight cho pathname hiện tại.
 * Match thứ tự: exact href → bất kỳ matchPrefix nào của node hoặc các con.
 * Trả về id của top-level node.
 */
export function getActiveMenuId(tree: MenuNode[], pathname: string): string | null {
  for (const top of tree) {
    if (matches(top, pathname)) return top.id
    for (const child of top.children) {
      if (matches(child, pathname)) return top.id
    }
  }
  return null
}

function matches(node: MenuNode, pathname: string): boolean {
  if (node.href === pathname) return true
  if (node.href !== "/" && pathname.startsWith(node.href + "/")) return true
  for (const p of node.matchPrefixes) {
    if (!p) continue
    if (pathname === p || pathname.startsWith(p + "/")) return true
  }
  return false
}
