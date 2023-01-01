import type * as Next from 'next'
import Router from 'next/router'
import { resolveHref } from 'next/dist/shared/lib/router/router'

import { get } from './stack'
import type { CacheTagsRegistry } from './registry/type'
import { defaultGenerateHash, noHash } from './hash'

type Config<R extends CacheTagsRegistry> = {
  /**
   * Disable/enable logging of cache-tag actions.
   */
  log?: boolean

  /**
   * A cache-tag registry/store.
   */
  registry: R

  /**
   * An indepotent cache-tag hash generator.
   */
  generateHash?: typeof defaultGenerateHash | false
}

interface TagsResolver {
  (req: Next.NextApiRequest, res: Next.NextApiResponse):
    | Promise<string[]>
    | string[]
}

type InvalidatorConfig = {
  /**
   * Wheter the invalidator route should wait for it to operate.
   *
   * Defaults to false, and should be used carefully not to exceed lambda execution time limit.
   */
  wait?: boolean

  /**
   * Cache-tags resolver for an upcoming invalidation call.
   */
  resolver: TagsResolver

  /**
   * Controls how the API Route should be resolved in case of invalidation success.
   */
  onSuccess?: (
    req: Parameters<TagsResolver>[0],
    res: Parameters<TagsResolver>[1],
    tags: string[]
  ) => Promise<void> | void

  /**
   * Controls how the API Route should be resolved in case of invalidation error.
   */
  onError?: (
    error: any,
    req: Parameters<TagsResolver>[0],
    res: Parameters<TagsResolver>[1],
    tags?: string[]
  ) => Promise<void> | void
}

const regex = {
  pathname: /(pages|app)\/(?<pathname>.+)(\.index)?\.[tj]sx?$/u,
}

/**
 * Cache-tags service for Next.js.
 */
class CacheTags<R extends CacheTagsRegistry> {
  public log: boolean
  public registry: R
  public generateHash: typeof defaultGenerateHash

  constructor(config: Config<R>) {
    this.log = config.log ?? false
    this.registry = config.registry
    this.generateHash =
      config.generateHash === false
        ? noHash
        : config.generateHash ?? defaultGenerateHash
  }

  /**
   * Predicate for getStaticProps call-site.
   */
  private isGetStaticPropsTrace = (callSite: NodeJS.CallSite) =>
    callSite.getFunctionName() === 'getStaticProps'

  /**
   * Resolve the current page's pathname from Next.js static props context info.
   */
  private getPagePathname(ctx: Next.GetStaticPropsContext) {
    const stack = get()
    const trace = stack.find(this.isGetStaticPropsTrace)
    const path = trace?.getFileName() ?? trace?.getEvalOrigin()
    const { pathname } = path?.match(regex.pathname)?.groups ?? {}

    if (!pathname) {
      throw new Error('Could not resolve page pathname')
    }

    return resolveHref(Router, { pathname, query: ctx.params }, true)[1]
  }

  /**
   * Register tags into a Next.js extracted path.
   */
  public register(ctx: Next.GetStaticPropsContext, tags: string[]) {
    return this.registerPath(this.getPagePathname(ctx), tags)
  }

  /**
   * Register a tags/path relationship.
   */
  public registerPath(path: string, tags: string[]) {
    const hashed = tags.map((tag) => this.generateHash(tag))

    /* istanbul ignore next */
    if (this.log) {
      console.log(`[next-cache-tags] Regenerating ${path}:`)
      console.log(`  - Cache-tags: ${hashed.length}`)
    }

    return this.registry.register(path, hashed)
  }

  /**
   * Generates a Next.js API Route for cache-tag invalidation.
   */
  public invalidator({
    wait = false,
    resolver,
    onSuccess = (_req, res) => res.send('ok'),
    onError = (error, _req, res) => {
      console.error(error)
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  }: InvalidatorConfig): Next.NextApiHandler {
    return async (req, res) => {
      let tags: string[] | undefined = undefined

      try {
        // Retrieves tags
        const tags = await resolver(req, res)
        const invalidating: Array<Promise<void>> = []

        for (const tag of tags) {
          this.log && console.log(`[next-cache-tags] Invalidating "${tag}":`)

          // Fetch the paths related to the invalidating cache-tag.
          const paths =
            (await this.registry.extract(this.generateHash(tag))) ?? []

          for (const path of paths) {
            this.log && console.log(`  - ${path}`)

            // Dispatch revalidation.
            invalidating.push(res.revalidate(path))
          }
        }

        /* istanbul ignore next */
        if (wait) {
          await Promise.allSettled(invalidating)
        }

        await onSuccess(req, res, tags)
      } catch (err) {
        await onError(err, req, res, tags)
      }
    }
  }
}

// Expose tags resolver so that it can be easily extended.
export type { TagsResolver }

export { CacheTags }
