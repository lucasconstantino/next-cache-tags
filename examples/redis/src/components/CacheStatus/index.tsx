import { useAgeColor } from '~/hooks/useAgeColor'
import { useCacheAge } from '~/hooks/useCacheAge'
import type { TCache } from '~/hooks/useCacheMeta'
import { alphabet } from '~/lib/alphabet'

const CacheItem: React.FC<{ cacheKey: string; date?: Date }> = ({ cacheKey, date }) => {
  const age = useCacheAge(date)
  const color = useAgeColor(age)
  const style = { '--time-color': color, opacity: date ? 1 : 0.25 } as React.CSSProperties

  return (
    <div className="cache-status-item" style={style}>
      <strong>{cacheKey}:</strong> {date?.toISOString() ?? 'empty'}
    </div>
  )
}

const CacheStatus: React.FC<{ cache: TCache }> = ({ cache }) => (
  <section id="cache-status">
    <h3>Cache status</h3>
    <ul>
      {alphabet.map((letter) => (
        <li key={letter}>
          <CacheItem cacheKey={letter} date={cache[`/alphabet/${letter}`]} />
        </li>
      ))}
    </ul>
  </section>
)

export { CacheStatus }
