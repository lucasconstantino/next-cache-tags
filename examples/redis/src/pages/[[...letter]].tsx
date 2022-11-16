import Link from 'next/link'
import { alphabet } from '~/lib/alphabet'

const HomePage = () => (
  <div>
    <h1>Cache Tags Alphabet</h1>

    <p>
      Every letter has a page. Every page depends on the letter, and it's
      sibling letters. <br />
      <strong>
        Cmd+click a letter to renew the cache of all related letter pages.
      </strong>
    </p>

    <ul id="alphabet">
      {alphabet.map(letter => (
        <li key={letter} tabIndex={1}>
          <Link href={`/${letter}`}>{letter}</Link>
        </li>
      ))}
    </ul>
  </div>
)

export default HomePage
