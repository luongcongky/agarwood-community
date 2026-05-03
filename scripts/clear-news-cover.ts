import { prisma } from "../lib/prisma"
async function main() {
  const r = await prisma.news.updateMany({
    where: { sourceUrl: { contains: "hoitramhuongvietnam.org" } },
    data: { coverImageUrl: null },
  })
  console.log("updated:", r.count)
  await prisma.$disconnect()
}
main()
