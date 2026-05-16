const { PrismaClient } = require('@prisma/client')
const logger = require('./logger')

if (process.env.NODE_ENV === 'production') {
  console.error('Não execute scripts em produção')
  process.exit(1)
}

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

  logger.info(JSON.stringify(rows, null, 2))
}

main()
  .catch((error) => {
    logger.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
