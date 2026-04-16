const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.categoria.groupBy({
    by: ['nome'],
    _count: { _all: true },
    having: {
      nome: {
        _count: {
          gt: 1
        }
      }
    }
  })

  console.log(JSON.stringify(rows, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
