import type { GetStaticProps, GetStaticPaths, NextPage } from 'next'
import Link from 'next/link'
import classnames from 'classnames'
import { alphabet } from '~/lib/alphabet'
import type { Letter } from '~/lib/alphabet'
import { cacheTags } from '~/lib/cache-tags'

type Props = {
  letters: [Letter | null, Letter | null, Letter | null]
}

const HomePage: NextPage<Props> = ({ letters }) => {
  const [previous, current, next] = letters

  const purgeLetter =
    (letter: Letter): React.MouseEventHandler =>
    (e) => {
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
        {alphabet.map((letter) => (
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

const getStaticProps: GetStaticProps<Props, { letter?: [Letter] }> = (ctx) => {
  const curr = (ctx.params?.letter?.[0]?.toUpperCase() ?? null) as Letter | null
  const prev = (curr && alphabet[alphabet.indexOf(curr) - 1]) ?? null
  const next = (curr && alphabet[alphabet.indexOf(curr) + 1]) ?? null

  // All letters relevant to this page
  const letters = [prev, curr, next] as Props['letters']

  // Path to current page. Next.js does not provide it anywhere.
  const path = `/${curr ?? ''}`
  const tags = letters.filter(Boolean).map((letter) => `letter:${letter}`)

  // Register tags for this page.
  cacheTags.register(path, tags)

  return { props: { letters: letters } }
}

/**
 * Empty implementation of getStaticPaths for on-demand only generation of static pages.
 */
const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})

export { getStaticProps, getStaticPaths }

export default HomePage
