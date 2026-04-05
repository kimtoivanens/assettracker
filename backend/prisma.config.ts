import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import * as pg from 'pg'

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    adapter: () => {
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
      })
      return new PrismaPg(pool)
    },
  },
})