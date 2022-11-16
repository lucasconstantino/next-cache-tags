import { alphabet } from '~/lib/alphabet'

const HomePage = () => (
  <div>
    <h1>Cache Tags Alphabet</h1>

    <p>
      Every letter represents a cached page. Every page depends on the letter,
      and it's sibling letters. <br />
      <strong>Click a letter to renew the cache of all related letters.</strong>
    </p>

    <ul id="alphabet">
      {alphabet.map(letter => (
        <li key={letter} tabIndex={1}>
          {letter}
        </li>
      ))}
    </ul>
  </div>
)

export default HomePage
