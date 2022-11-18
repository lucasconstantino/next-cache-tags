import { useEffect, useState } from 'react'

/**
 * Calculates and updates the age of a given cache in seconds.
 */
const useCacheAge = (cache: Date | undefined) => {
  const [seconds, setSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (cache) {
      const calculate = () =>
        setSeconds(Math.floor((new Date().getTime() - cache.getTime()) / 1000))

      // Initial calculation,
      calculate()

      // Refresh every second to come.
      const interval = setInterval(calculate, 1000)

      return () => clearInterval(interval)
    }
  }, [cache])

  return seconds
}

export { useCacheAge }
