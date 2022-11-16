import Link from 'next/link'
import { useRouter } from 'next/router'
import { alphabet } from '~/lib/alphabet'

const usePageLetter = () => useRouter().query.letter?.[0].toUpperCase() ?? null

const HomePage = () => {
  const current = usePageLetter()

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
      </p>

      <ul id="alphabet">
        {alphabet.map(letter => (
          <li
            key={letter}
            tabIndex={1}
            className={current === letter ? 'current' : ''}
          >
            <Link href={`/${letter}`}>{letter}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default HomePage
