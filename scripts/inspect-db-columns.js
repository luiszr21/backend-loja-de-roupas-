const { PrismaClient } = require('@prisma/client')
const logger = require('./logger')

if (process.env.NODE_ENV === 'production') {
  console.error('Não execute scripts em produção')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    select table_name, column_name, data_type, udt_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('Categoria', 'Produto', 'Proposta')
    order by table_name, ordinal_position
  `)

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
