import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const all = await prisma.news.findMany({
  orderBy: { createdAt: 'desc' },
  select: { id: true, title: true, category: true, isPublished: true, createdAt: true }
})

console.log('Total news records:', all.length)

const byCategory = all.reduce((acc, n) => {
  acc[n.category] = (acc[n.category] || 0) + 1
  return acc
}, {})
console.log('By category (all):', byCategory)

const published = all.filter(n => n.isPublished)
const byPublished = published.reduce((acc, n) => {
  acc[n.category] = (acc[n.category] || 0) + 1
  return acc
}, {})
console.log('By category (published only):', byPublished)

console.log('\nAll records:')
for (const n of all) {
  console.log(`  [${n.category}] ${n.isPublished ? '✅ PUB' : '⬜ DRAFT'}  ${n.title.substring(0, 70)}`)
}

await prisma.$disconnect()
