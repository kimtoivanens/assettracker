import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import * as pg from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL as string

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    url: connectionString,
  },
  migrate: {
    adapter: () => {
      const pool = new pg.Pool({ connectionString })
      return new PrismaPg(pool)
    },
  },
})
