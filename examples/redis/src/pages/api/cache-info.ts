import type { NextApiHandler } from 'next'
import { cacheTags } from '~/lib/cache-tags'

/**
 * Load current cache info from Redis.
 */
const handler: NextApiHandler = async (_req, res) =>
  await cacheTags.registry.act(async (client) => {
    const tags = await client.KEYS('*')
    const paths: Record<string, string> = {}
    const transaction = client.multi()

    for (const tag of tags) {
      transaction.HGETALL(tag)
    }

    const result = (await transaction.exec()) as unknown[] as Record<string, string>[]

    for (const hashes of result) {
      for (const path in hashes) {
        paths[path] = paths[path] > hashes[path] ? paths[path] : hashes[path]
      }
    }

    res.json(paths)
  })

export default handler
