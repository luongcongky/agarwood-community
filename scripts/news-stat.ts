import { prisma } from "../lib/prisma"
async function main() {
  const r = await prisma.news.groupBy({ by: ["category", "isPublished"], _count: { _all: true } })
  console.log(JSON.stringify(r, null, 2))
  const total = await prisma.news.count()
  console.log("TOTAL:", total)
  await prisma.$disconnect()
}
main()
