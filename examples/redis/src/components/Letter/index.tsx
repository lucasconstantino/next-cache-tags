import { memo } from 'react'
import Link from 'next/link'
import classnames from 'classnames'

import type { TLetter } from '~/lib/alphabet'
import { useCacheAge } from '~/hooks/useCacheAge'
import { useAgeColor } from '~/hooks/useAgeColor'
import type { TCacheInfo, TCacheKey } from '~/hooks/useCacheInfo'

type TProps = {
  letter: TLetter
  isCurrent: boolean
  isPrevious: boolean
  isNext: boolean
  cacheInfo: TCacheInfo
}

const Letter: React.FC<TProps> = ({ letter, isCurrent, isPrevious, isNext, cacheInfo }) => {
  const url: TCacheKey = `/alphabet/${letter}`

  const age = useCacheAge(cacheInfo.cache[url])
  const color = useAgeColor(age)

  // Navigate to home if current letter is clicked.
  const href = `/alphabet/${isCurrent ? '' : letter}`
  const style = { '--time-color': color } as React.CSSProperties

  /**
   * Invalidate (instead of navigate) if cmd/ctrl is pressed upon clicking.
   */
  const handleOnClick = async (e: React.MouseEvent) => {
    if (e.metaKey) {
      e.preventDefault()
      cacheInfo.invalidate(letter)
    }
  }

  return (
    <Link href={href} passHref>
      <a
        onClick={handleOnClick}
        style={style}
        className={classnames('letter', {
          current: isCurrent,
          highlighted: isCurrent || isPrevious || isNext,
        })}
      >
        {letter}
        <small className="age">{age ? `${age}s` : 'empty'}</small>
        <small className="invalidate">invalidate</small>
      </a>
    </Link>
  )
}

const MemoizedLetter = memo(Letter)

export { MemoizedLetter as Letter }
