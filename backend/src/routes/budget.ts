import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export default async function budgetRoutes(app: FastifyInstance) {
  app.get('/categories', async () => {
    return prisma.budgetCategory.findMany({ orderBy: { createdAt: 'asc' } })
  })

  app.post('/categories', async (req, reply) => {
    const { name, color, budget } = req.body as any
    const cat = await prisma.budgetCategory.create({ data: { name, color, budget } })
    return reply.code(201).send(cat)
  })

  app.put('/categories/:id', async (req) => {
    const { id } = req.params as any
    const { name, color, budget } = req.body as any
    return prisma.budgetCategory.update({ where: { id: parseInt(id) }, data: { name, color, budget } })
  })

  app.delete('/categories/:id', async (req, reply) => {
    const { id } = req.params as any
    await prisma.transaction.deleteMany({ where: { categoryId: parseInt(id) } })
    await prisma.budgetCategory.delete({ where: { id: parseInt(id) } })
    return reply.code(204).send()
  })

  app.get('/transactions', async (req) => {
    const { month } = req.query as any
    const where = month ? { date: { startsWith: month } } : {}
    return prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' }
    })
  })

  app.post('/transactions', async (req, reply) => {
    const { desc, amount, date, categoryId } = req.body as any
    const tx = await prisma.transaction.create({
      data: { desc, amount, date, categoryId },
      include: { category: true }
    })
    return reply.code(201).send(tx)
  })

  app.delete('/transactions/:id', async (req, reply) => {
    const { id } = req.params as any
    await prisma.transaction.delete({ where: { id: parseInt(id) } })
    return reply.code(204).send()
  })
}
