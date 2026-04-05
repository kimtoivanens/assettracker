import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export default async function snapshotRoutes(app: FastifyInstance) {
  app.get('/snapshots', async () => {
    return prisma.snapshot.findMany({ orderBy: { month: 'desc' } })
  })

  app.post('/snapshots', async (req, reply) => {
    const { month, netValue, stocks, bank, property, loans } = req.body as any
    const snapshot = await prisma.snapshot.upsert({
      where: { month },
      update: { netValue, stocks, bank, property, loans },
      create: { month, netValue, stocks, bank, property, loans }
    })
    return reply.code(201).send(snapshot)
  })
}
