import { useCallback, useMemo, useState } from 'react'
import type { TLetter } from '../lib/alphabet'

type TCacheKey = `/alphabet/${TLetter}`
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
 * Cache information state resolver.
 */
const useCacheInfo = () => {
  const [cache, setCache] = useState<TCacheMap>({})
  const [updating, setUpdating] = useState(false)

  const update = useCallback(async () => {
    setUpdating(true)

    await fetch('/api/cache-info')
      .then((res) => res.json())
      .then(parse.map)
      .then(setCache)

    setUpdating(false)
  }, [setCache])

  return useMemo(() => ({ cache, update, updating }), [cache, update, updating])
}

type TCacheInfo = ReturnType<typeof useCacheInfo>

export type { TCacheKey, TCacheMap, TCacheInfo }

export { useCacheInfo }
