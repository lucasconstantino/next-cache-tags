import Link from 'next/link'
import classnames from 'classnames'

import type { TLetter } from '~/lib/alphabet'
import React from 'react'
import { useCacheAge } from '~/hooks/useCacheAge'

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

  return (
    <Link
      // Navigate to home if current letter is clicked.
      href={`/alphabet/${isCurrent ? '' : letter}`}
      // Invalidate (instead of navigate) if cmd/ctrl is pressed upon clicking.
      onClick={(e: React.MouseEvent) => e.metaKey && (e.preventDefault(), invalidate(letter))}
      className={classnames('letter', {
        current: isCurrent,
        highlighted: isCurrent || isPrevious || isNext,
      })}
    >
      {letter}
      <small>{age ? `${age}s` : 'empty'}</small>
    </Link>
  )
}

export { Letter }
