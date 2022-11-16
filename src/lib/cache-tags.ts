import * as Next from 'next'
import { CacheTagsRegistry } from './registry/base'
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
   * Register a path/tags relationship.
   */
  public register(path: string, tags: string[]) {
    const hashed = tags.map(this.generateHash)

    if (this.log) {
      console.log(`[next-cache-tags] Regenerating ${path}:`)
      console.log(`  - Cache-tags: ${hashed.length}`)
    }

    return this.registry.register(path, hashed)
  }

  /**
   * Generates a Next.js API Route for cache-tag invalidation.
   */
  public invalidator(
    /**
     * Cache-tags resolver for an upcoming invalidation call.
     */
    resolver: TagsResolver,

    /**
     * Controls how the API Route should be resolved in case of invalidation success.
     */
    onSuccess: (
      req: Parameters<TagsResolver>[0],
      res: Parameters<TagsResolver>[1],
      tags: string[]
    ) => Promise<void> | void = (_req, res) => res.send('ok'),

    /**
     * Controls how the API Route should be resolved in case of invalidation error.
     */
    onError: (
      error: any,
      req: Parameters<TagsResolver>[0],
      res: Parameters<TagsResolver>[1],
      tags?: string[]
    ) => Promise<void> | void = (error, _req, res) => {
      console.error(error)
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  ): Next.NextApiHandler {
    return async (req, res) => {
      let tags: string[] | undefined = undefined

      try {
        // Retrieves tags
        const tags = await resolver(req, res)

        for (const tag of tags) {
          this.log && console.log(`[next-cache-tags] Invalidating "${tag}":`)

          // Fetch the paths related to the invalidating cache-tag.
          const paths =
            (await this.registry.extract(this.generateHash(tag))) ?? []

          for (const path of paths) {
            this.log && console.log(`  - ${path}`)

            // Dispatch revalidation.
            void res.revalidate(path)
          }
        }

        await onSuccess(req, res, tags)
      } catch (err) {
        await onError(err, req, res, tags)
      }
    }
  }
}

// Expose tags resolver so that it can be easily extended.
export { TagsResolver }

export { CacheTags }
