import { useState, useEffect } from 'react'
import type { TLetter } from '../lib/alphabet'

type TPath = `/alphabet/${TLetter}`
type TCache = { [key in TPath]?: Date }

const parse = {
  /**
   * Parse a cache entry (key => time string)
   */
  entry: ([path, time]: [string, string]) => [path, new Date(time)],

  /**
   * Parse a map object ({ [key]: time string })
   */
  map: (object: { [key in TPath]: string }): TCache =>
    Object.fromEntries(Object.entries(object).map(parse.entry)),
}

/**
 * Polling based load of cache meta information.
 */
const useCacheMeta = () => {
  const [cache, setCache] = useState<TCache>({})

  useEffect(() => {
    const interval = setInterval(
      () =>
        fetch('/api/cache-meta')
          .then((res) => res.json())
          .then(parse.map)
          .then(setCache),
      5000
    )

    return () => clearInterval(interval)
  })

  return cache
}

export type { TPath, TCache }

export { useCacheMeta }
