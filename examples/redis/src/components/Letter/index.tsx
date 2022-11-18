import Link from 'next/link'
import classnames from 'classnames'

import type { TLetter } from '~/lib/alphabet'

type TProps = {
  letter: TLetter
  isCurrent: boolean
  isPrevious: boolean
  isNext: boolean
}

const handleLetterClick =
  (letter: TLetter): React.MouseEventHandler =>
  (e) => {
    // Cmd/Ctrl is pressed
    if (e.metaKey) {
      e.preventDefault()
    }
  }

const Letter: React.FC<TProps> = ({ letter, isCurrent, isPrevious, isNext }) => (
  <Link
    href={`/alphabet/${isCurrent ? '' : letter}`}
    onClick={handleLetterClick(letter)}
    className={classnames('letter', {
      current: isCurrent,
      highlighted: isCurrent || isPrevious || isNext,
    })}
  >
    {letter}
  </Link>
)

export { Letter }
