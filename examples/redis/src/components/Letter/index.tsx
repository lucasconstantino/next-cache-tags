import Link from 'next/link'
import classnames from 'classnames'

import type { TLetter } from '~/lib/alphabet'
import { memo } from 'react'
import { useCacheAge } from '~/hooks/useCacheAge'
import { useAgeColor } from '~/hooks/useAgeColor'

type TProps = {
  letter: TLetter
  isCurrent: boolean
  isPrevious: boolean
  isNext: boolean
  cache: Date | undefined
}

/**
 * Performs an invalidation of a letter cache-tag.
 */
const invalidate = (letter: TLetter) => navigator.sendBeacon(`/api/invalidate?tag=letter:${letter}`)

const Letter: React.FC<TProps> = ({ letter, isCurrent, isPrevious, isNext, cache }) => {
  const age = useCacheAge(cache)
  const color = useAgeColor(age)
  const style = { '--time-color': color } as React.CSSProperties

  return (
    <Link
      // Navigate to home if current letter is clicked.
      href={`/alphabet/${isCurrent ? '' : letter}`}
      // Invalidate (instead of navigate) if cmd/ctrl is pressed upon clicking.
      onClick={(e: React.MouseEvent) => e.metaKey && (e.preventDefault(), invalidate(letter))}
      style={style}
      className={classnames('letter', {
        current: isCurrent,
        highlighted: isCurrent || isPrevious || isNext,
      })}
    >
      {letter}
      <small className="age">{age ? `${age}s` : 'empty'}</small>
      <small className="invalidate">invalidate</small>
    </Link>
  )
}

const MemoizedLetter = memo(Letter)

export { MemoizedLetter as Letter }
