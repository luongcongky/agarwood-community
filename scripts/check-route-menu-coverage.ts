/**
 * Scan thư mục app/(public)/ → liệt kê route nào CHƯA có trong route-menu-map.
 * Exit code != 0 nếu phát hiện route chưa khai báo (tiện cho CI/git hook).
 *
 * Run: npx tsx scripts/check-route-menu-coverage.ts
 */
import { readdirSync, statSync } from "fs"
import { join, relative } from "path"
import { lookupMenuKey } from "../lib/route-menu-map"

const PUBLIC_DIR = "app/(public)"

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...walk(full))
    else if (name === "page.tsx" || name === "page.ts") out.push(full)
  }
  return out
}

function fileToRoute(file: string): string {
  const rel = relative(PUBLIC_DIR, file).replace(/\\/g, "/")
  const noPage = rel.replace(/\/page\.tsx?$/, "")
  if (noPage === "page.tsx" || noPage === "page.ts" || noPage === "") return "/"
  // Bỏ route group (...) trong path
  const cleaned = "/" + noPage.split("/").filter((s) => !(s.startsWith("(") && s.endsWith(")"))).join("/")
  // Thay [param] bằng :param để dễ nhìn (nhưng giữ nguyên cho lookup test)
  return cleaned
}

function representativePath(routePattern: string): string {
  // Thay [slug] / [id] / [...rest] bằng giá trị mẫu để gọi lookupMenuKey
  return routePattern
    .replace(/\[\.\.\..+?\]/g, "sample")
    .replace(/\[.+?\]/g, "sample")
}

function main() {
  const files = walk(PUBLIC_DIR)
  const unmapped: string[] = []
  const mapped: { route: string; menuKey: string | null }[] = []

  for (const f of files) {
    const route = fileToRoute(f)
    const probe = representativePath(route)
    const key = lookupMenuKey(probe)
    if (key === undefined) unmapped.push(route)
    else mapped.push({ route, menuKey: key })
  }

  console.log(`Đã quét ${files.length} route public.`)
  console.log(`✓ Đã map: ${mapped.length}`)
  console.log(`✗ Chưa map: ${unmapped.length}`)

  if (unmapped.length) {
    console.log("\nRoute chưa có trong lib/route-menu-map.ts:")
    for (const r of unmapped) console.log("  •", r)
    console.log("\n→ Bổ sung entry tương ứng vào ROUTE_MENU_MAP, hoặc đặt menuKey: null nếu cố tình không highlight.")
    process.exit(1)
  }
  console.log("\nAll routes covered.")
}

main()
