import { RedisCacheTagsRegistry, CacheTags, defaultGenerateHash } from 'next-cache-tags'

if (!process.env.CACHE_TAGS_REDIS_URL) {
  throw new Error('Missing CACHE_TAGS_REDIS_URL environment variable')
}

const debugging = Boolean(process.env.CACHE_TAGS_DEBUG)

const cacheTags = new CacheTags({
  registry: new RedisCacheTagsRegistry({
    url: process.env.CACHE_TAGS_REDIS_URL,
    socket: { connectTimeout: 50000 },
  }),
  generateHash: debugging ? false : defaultGenerateHash,
  log: debugging,
})

export { cacheTags }
