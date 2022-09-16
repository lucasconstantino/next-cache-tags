abstract class CacheTagsRegistry {
  /**
   * Registers a set of cache-tags for a given path.
   */
  abstract register: (path: string, tags: string[]) => Promise<void> | void

  /**
   * Removes and returns a set of paths related to a cache-tag.
   */
  abstract extract: (tag: string) => Promise<string[]> | string[]
}

export { CacheTagsRegistry }
