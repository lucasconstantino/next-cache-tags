import { CacheTagsRegistry } from './type'

/**
 * A Cache-Tags registry implemented using memory, for testing purposes.
 */
class MemoryCacheTagsRegistry implements CacheTagsRegistry {
  private store: Map<string, Map<string, boolean>>

  constructor() {
    this.store = new Map()
  }

  register = (path: string, tags: string[]) => {
    for (const tag of tags) {
      const map = this.store.get(tag) ?? new Map<string, boolean>()
      map.set(path, true)
      this.store.set(tag, map)
    }
  }

  extract = (tag: string) => {
    const map = this.store.get(tag) ?? new Map<string, boolean>()
    const paths = [...map.keys()]
    this.store.delete(tag)
    return paths
  }
}

export { MemoryCacheTagsRegistry }
