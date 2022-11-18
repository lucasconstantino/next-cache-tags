const path = require('path')
const dotenv = require('dotenv')
const { createClient } = require('redis')

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const redis = createClient({ url: process.env.CACHE_TAGS_REDIS_URL })

const run = async () => {
  await redis.connect()
  await redis.FLUSHDB()
  await redis.disconnect()
}

run().catch(console.error)
