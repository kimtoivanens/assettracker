import 'dotenv/config'
import Fastify from 'fastify'
import assetRoutes from './routes/assets'
import snapshotRoutes from './routes/snapshots'

const app = Fastify({ logger: true })

app.get('/health', async () => ({ status: 'ok' }))
app.register(assetRoutes, { prefix: '/api' })
app.register(snapshotRoutes, { prefix: '/api' })

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
