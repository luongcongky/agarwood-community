/**
 * Seed `MenuItem.label_ar` — bản dịch tiếng Ả Rập cho navbar.
 * Match theo `key` (ổn định) nếu có, fallback qua `label` (tiếng Việt).
 * Idempotent: chỉ update item đang có label_ar trống hoặc khớp fallback cũ.
 */
import { readFileSync, existsSync } from "fs"

function loadEnvLocal(): void {
  if (!existsSync(".env.local")) return
  for (const line of readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue
    const eq = t.indexOf("="); if (eq === -1) continue
    const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!(k in process.env)) process.env[k] = v
  }
}
loadEnvLocal()
/* eslint-disable @typescript-eslint/no-require-imports */
const { prisma } = require("../lib/prisma") as typeof import("../lib/prisma")
/* eslint-enable @typescript-eslint/no-require-imports */

/** Bản dịch theo key (stable). Các item không có key mà chưa match sẽ
 *  log ra console để admin biết. */
const LABEL_AR_BY_KEY: Record<string, string> = {
  home: "الرئيسية",
  about: "من نحن",
  leadership: "القيادة",
  news: "الأخبار",
  research: "الأبحاث",
  feed: "المجتمع",
  companies: "الشركات",
  members: "الأعضاء",
  marketplace: "المنتجات",
  cert_products: "المنتجات المعتمدة",
  certified_products: "المنتجات المعتمدة",
  services: "الخدمات",
  register: "التسجيل",
  contact: "اتصل بنا",
  charter: "النظام الأساسي",
  dieu_le: "النظام الأساسي",
  legal_docs: "الوثائق القانونية",
  phap_ly: "الوثائق القانونية",
  surveys: "الاستبيانات",
  banner: "الإعلانات",
  partners: "الشركاء",
  verify: "التحقق",
}

/** Fallback: nếu key không match, dùng label (VI) để suy Arabic. */
const LABEL_AR_BY_VI: Record<string, string> = {
  "Trang chủ": "الرئيسية",
  "Giới thiệu": "من نحن",
  "Về chúng tôi": "من نحن",
  "Ban lãnh đạo": "القيادة",
  "Tin tức": "الأخبار",
  "Nghiên cứu": "الأبحاث",
  "Cộng đồng": "المجتمع",
  "Diễn đàn": "المجتمع",
  "Doanh nghiệp": "الشركات",
  "Hội viên": "الأعضاء",
  "Thành viên": "الأعضاء",
  "Sản phẩm": "المنتجات",
  "Sản phẩm chứng nhận": "المنتجات المعتمدة",
  "Sản phẩm tiêu biểu": "المنتجات المميزة",
  "Dịch vụ": "الخدمات",
  "Đăng ký": "التسجيل",
  "Liên hệ": "اتصل بنا",
  "Điều lệ": "النظام الأساسي",
  "Pháp lý": "الوثائق القانونية",
  "Khảo sát": "الاستبيانات",
  "Quảng cáo": "الإعلانات",
  "Đối tác": "الشركاء",
  "Xác thực": "التحقق",
  "Xác minh": "التحقق",
  "MXH Trầm Hương": "منصة العود الاجتماعية",
  "Tổng quan": "نظرة عامة",
  "Điều lệ Hội": "النظام الأساسي للجمعية",
  "Bảng tin": "اللوحة الإخبارية",
  "Tin tức ngành": "أخبار القطاع",
  "Trang giới thiệu": "من نحن",
  "Danh sách hội viên": "دليل الأعضاء",
  "Sản phẩm doanh nghiệp": "منتجات الشركات",
}

async function main() {
  const items = await prisma.menuItem.findMany({
    select: { id: true, menuKey: true, label: true, label_ar: true },
  })

  let updated = 0
  const unmatched: string[] = []

  for (const item of items) {
    if (item.label_ar && item.label_ar.trim()) continue // đã có Arabic — bỏ qua

    const byKey = item.menuKey ? LABEL_AR_BY_KEY[item.menuKey] : undefined
    const byVi = LABEL_AR_BY_VI[item.label]
    const ar = byKey ?? byVi

    if (!ar) {
      unmatched.push(`${item.menuKey ?? "(no key)"} | ${item.label}`)
      continue
    }

    await prisma.menuItem.update({ where: { id: item.id }, data: { label_ar: ar } })
    updated++
    console.log(`✓ ${(item.menuKey ?? item.label).padEnd(30)} → ${ar}`)
  }

  console.log(`\nSeeded ${updated}/${items.length} menu items.`)
  if (unmatched.length) {
    console.log(`\n⚠ Unmatched items (admin cần điền thủ công):`)
    unmatched.forEach((l) => console.log(`  ${l}`))
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
