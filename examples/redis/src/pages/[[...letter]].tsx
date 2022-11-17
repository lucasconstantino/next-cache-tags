import Link from 'next/link'
import { useRouter } from 'next/router'
import classnames from 'classnames'
import { alphabet } from '~/lib/alphabet'

type Letter = typeof alphabet[number]

/**
 * Get the letters related to the current page.
 */
const usePageLetters = () => {
  const letter = useRouter().query.letter
  const current = (letter?.[0].toUpperCase() as Letter) ?? null
  const previous = alphabet[alphabet.indexOf(current) - 1] ?? null
  const next = alphabet[alphabet.indexOf(current) + 1] ?? null

  return [previous, current, next]
}

const HomePage = () => {
  const [previous, current, next] = usePageLetters()

  const purgeLetter = (letter: Letter): React.MouseEventHandler => e => {
    // Cmd/Ctrl is pressed
    if (e.metaKey) {
      e.preventDefault()
    }
  }

  return (
    <div>
      <h1>Cache Tags Alphabet</h1>

      <p>
        Every letter has a page. Every page depends on the letter, and it's
        sibling letters.
      </p>

      <p>
        <strong>
          1) Click a letter to navigate to it's page (shows underlined)
        </strong>
        <br />
        <strong>
          2) Cmd+click a letter to renew the cache of all related letter pages.
        </strong>
        <br />
        <strong>3) Click on the current letter to navigate to home</strong>
      </p>

      <ul id="alphabet" className={classnames({ hasCurrent: !!current })}>
        {alphabet.map(letter => (
          <li
            key={letter}
            tabIndex={1}
            className={classnames({
              highlighted: [previous, current, next].includes(letter),
              current: current === letter,
            })}
          >
            <Link
              href={current === letter ? '/' : `/${letter}`}
              onClick={purgeLetter(letter)}
            >
              {letter}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default HomePage
