const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const all = await prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, category: true, isPublished: true, createdAt: true }
  })

  console.log('Total news records:', all.length)

  const byCategory = all.reduce((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1
    return acc
  }, {})
  console.log('By category (all):', JSON.stringify(byCategory))

  const published = all.filter(n => n.isPublished)
  const byPublished = published.reduce((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1
    return acc
  }, {})
  console.log('By category (published only):', JSON.stringify(byPublished))

  console.log('\nAll records:')
  for (const n of all) {
    const status = n.isPublished ? 'PUB  ' : 'DRAFT'
    console.log(`  [${n.category.padEnd(8)}] ${status}  ${n.title.substring(0, 70)}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
