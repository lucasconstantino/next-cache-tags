import type { GetStaticProps, GetStaticPaths, NextPage } from 'next'
import classnames from 'classnames'

import { alphabet } from '~/lib/alphabet'
import type { TLetter } from '~/lib/alphabet'
import { cacheTags } from '~/lib/cache-tags'
import { useCacheInfo, createCacheTag } from '~/hooks/useCacheInfo'
import { CacheStatus } from '~/components/CacheStatus'
import { CacheUpdater } from '~/components/CacheUpdater'
import { Letter } from '~/components/Letter'
import { useCmdPressed } from '~/hooks/useCmdPressed'

type TProps = {
  letters: [TLetter | null, TLetter | null, TLetter | null]
}

const AlphabetPage: NextPage<TProps> = ({ letters }) => {
  const cacheInfo = useCacheInfo()
  const isCmdPressed = useCmdPressed()
  const [previous, current, next] = letters

  return (
    <div id="page">
      <aside>
        <CacheStatus cacheInfo={cacheInfo} />
      </aside>

      <main>
        <h1>Cache Tags Alphabet</h1>

        <p>Every letter has a page. Every page depends on the letter and it's sibling letters.</p>

        <p>
          <strong>1) Click a letter to navigate to it's page (shows underlined)</strong>
          <br />
          <strong>2) Cmd+click a letter to renew the cache of all related letter pages.</strong>
          <br />
          <strong>3) Click on the current letter to navigate to home</strong>
        </p>

        <ul id="alphabet" className={classnames({ hasCurrent: !!current, isCmdPressed })}>
          {alphabet.map((letter) => (
            <li key={letter}>
              <Letter
                letter={letter}
                cacheInfo={cacheInfo}
                isCurrent={letter === current}
                isPrevious={letter === previous}
                isNext={letter === next}
              />
            </li>
          ))}
        </ul>
      </main>

      <aside>
        <CacheUpdater cacheInfo={cacheInfo} frequency={5000} />
      </aside>

      <aside id="cover">
        <p>
          <span className="icon">🤦</span> <br />
          Sorry, this isn't mobile friendly!
        </p>
        <p>Please, open it in a bigger screen.</p>
      </aside>
    </div>
  )
}

const getStaticProps: GetStaticProps<TProps, { letter?: [TLetter] }> = (ctx) => {
  const curr = (ctx.params?.letter?.[0]?.toUpperCase() ?? null) as TLetter | null
  const prev = (curr && alphabet[alphabet.indexOf(curr) - 1]) ?? null
  const next = (curr && alphabet[alphabet.indexOf(curr) + 1]) ?? null

  // All letters relevant to this page
  const letters = [prev, curr, next] as TProps['letters']
  const tags = letters.filter(Boolean).map(createCacheTag)

  // Register tags for this page.
  cacheTags.register(ctx, tags)

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

export default AlphabetPage
