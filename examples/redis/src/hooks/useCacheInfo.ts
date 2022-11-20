import { useCallback, useMemo, useState } from 'react'
import type { TLetter } from '../lib/alphabet'

type TCacheKey = `/alphabet/${TLetter}`
type TCacheTag = `letter:${string}`
type TCacheMap = { [key in TCacheKey]?: Date }

const parse = {
  /**
   * Parse a cache entry (key => time string)
   */
  entry: ([path, time]: [string, string]) => [path, new Date(time)],

  /**
   * Parse a map object ({ [key]: time string })
   */
  map: (object: { [key in TCacheKey]: string }): TCacheMap =>
    Object.fromEntries(Object.entries(object).map(parse.entry)),
}

/**
 * Resolves a cache-tag given a letter.
 */
const createCacheTag = (letter: TLetter | null): TCacheTag => `letter:${letter}`

/**
 * Cache status and invalidation connector.
 */
const useCacheInfo = () => {
  const [cache, setCache] = useState<TCacheMap>({})
  const [updating, setUpdating] = useState(false)

  /**
   * Performs a cache info update.
   */
  const update = useCallback(async () => {
    setUpdating(true)

    await fetch('/api/cache-info')
      .then((res) => res.json())
      .then(parse.map)
      .then(setCache)

    setUpdating(false)
  }, [setUpdating, setCache])

  /**
   * Performs an invalidation of a letter cache-tag.
   */
  const invalidate = useCallback(
    async (letter: TLetter) => {
      setUpdating(true)
      await fetch(`/api/invalidate?tag=${createCacheTag(letter)}`)
      await update()
    },
    [setUpdating, update]
  )

  return useMemo(
    () => ({ cache, update, updating, invalidate }),
    [cache, update, updating, invalidate]
  )
}

type TCacheInfo = ReturnType<typeof useCacheInfo>

export type { TCacheKey, TCacheMap, TCacheInfo }

export { useCacheInfo, createCacheTag }
