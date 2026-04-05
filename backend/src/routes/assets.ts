import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export default async function assetRoutes(app: FastifyInstance) {
  app.get('/assets', async () => {
    return prisma.asset.findMany({ orderBy: { createdAt: 'desc' } })
  })

  app.post('/assets', async (req, reply) => {
    const { name, category, value } = req.body as any
    const asset = await prisma.asset.create({ data: { name, category, value } })
    return reply.code(201).send(asset)
  })

  app.put('/assets/:id', async (req, reply) => {
    const { id } = req.params as any
    const { name, category, value } = req.body as any
    const asset = await prisma.asset.update({ where: { id: parseInt(id) }, data: { name, category, value } })
    return asset
  })

  app.delete('/assets/:id', async (req, reply) => {
    const { id } = req.params as any
    await prisma.asset.delete({ where: { id: parseInt(id) } })
    return reply.code(204).send()
  })
}
