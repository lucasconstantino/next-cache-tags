import { useAgeColor } from '~/hooks/useAgeColor'
import { useCacheAge } from '~/hooks/useCacheAge'
import type { TCacheInfo } from '~/hooks/useCacheInfo'
import { alphabet } from '~/lib/alphabet'
import type { TLetter } from '~/lib/alphabet'

const CacheItem: React.FC<{ letter: TLetter; date?: Date }> = ({ letter, date }) => {
  const age = useCacheAge(date)
  const color = useAgeColor(age)
  const style = { '--time-color': color, opacity: date ? 1 : 0.25 } as React.CSSProperties

  return (
    <div className="cache-status-item" style={style}>
      <strong>{letter}:</strong> {date?.toISOString() ?? 'empty'}
    </div>
  )
}

const CacheStatus: React.FC<{ cacheInfo: TCacheInfo }> = ({ cacheInfo }) => (
  <section id="cache-status">
    <h3>Cache status</h3>
    <ul>
      {alphabet.map((letter) => (
        <li key={letter}>
          <CacheItem letter={letter} date={cacheInfo.cache[`/alphabet/${letter}`]} />
        </li>
      ))}
    </ul>
  </section>
)

export { CacheStatus }
