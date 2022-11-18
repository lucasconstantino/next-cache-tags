import { useAgeColor } from '~/hooks/useAgeColor'
import { useCacheAge } from '~/hooks/useCacheAge'
import type { TCache } from '~/hooks/useCacheMeta'

const CacheItem: React.FC<{ cacheKey: string; date: Date }> = ({ cacheKey, date }) => {
  const age = useCacheAge(date)
  const color = useAgeColor(age)
  const style = { '--time-color': color } as React.CSSProperties

  return (
    <div className="cache-status-item" style={style}>
      <strong>{cacheKey}:</strong> {date.toISOString()}
    </div>
  )
}

const CacheStatus: React.FC<{ cache: TCache }> = ({ cache }) => {
  const pairs = Object.entries(cache).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

  return (
    <section id="cache-status">
      <h3>Cache status</h3>
      <ul>
        {pairs.map(([cacheKey, date]) => (
          <li key={cacheKey}>
            <CacheItem cacheKey={cacheKey} date={date} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export { CacheStatus }
