// Check current company state in DB
import { readFileSync, existsSync } from "fs"

function loadEnvLocal(): void {
  if (!existsSync(".env.local")) return
  const content = readFileSync(".env.local", "utf-8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvLocal()

/* eslint-disable @typescript-eslint/no-require-imports */
const { prisma } = require("../lib/prisma") as typeof import("../lib/prisma")
/* eslint-enable @typescript-eslint/no-require-imports */

async function main() {
  const companies = await prisma.company.findMany({
    select: {
      name: true,
      slug: true,
      website: true,
      logoUrl: true,
      owner: {
        select: {
          contributionTotal: true,
          role: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  console.log(`\nTổng số company: ${companies.length}\n`)
  console.log("─".repeat(100))
  for (const c of companies) {
    const contrib = c.owner.contributionTotal
    const tier = contrib >= 20_000_000 ? "Vàng" : contrib >= 10_000_000 ? "Bạc " : "Cơ bản"
    const logoSource = c.logoUrl?.includes("cloudinary") ? "Cloudinary" : c.logoUrl ? "External" : "None"
    console.log(`${tier} | ${c.name.padEnd(50)} | ${c.website || "(no website)"}`.slice(0, 100))
    console.log(`     logo: ${logoSource} — ${c.logoUrl ?? "null"}`)
  }
  console.log("─".repeat(100))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    const { prisma } = require("../lib/prisma") as typeof import("../lib/prisma")
    await prisma.$disconnect()
  })
