import { Low, JSONFile } from 'lowdb'
import { CacheTagsRegistry } from './base'

type Database = { lock?: string | null } & Record<string, Record<string, string>>
type Action<R> = (data: Database) => Promise<R> | R
type Store = Low<Database>

/**
 * A Cache-Tags registry implemented using local JSON files as database.
 *
 * By default, it will create a "cache.json" file on the root of the Next.js server project.
 *
 * WARNING: does not work on Vercel!
 */
class LowdbCacheTagsRegistry extends CacheTagsRegistry {
  public store: Store

  constructor(cachePath = `${process.cwd()}/cache.json`) {
    super()
    this.store = new Low(new JSONFile<Database>(cachePath))
  }

  /**
   * Lock based connection.
   */
  connect = async () => {
    let tried = 0
    let firstLock: string | null = null
    const lock = (Math.random() + 1).toString(36).substring(2)

    const acquire = async () => {
      console.log(lock, 'acquiring')
      // @ts-ignore
      this.store.data = { ...this.store.data, lock }
      await this.store.write()
    }

    acquire: while (true) {
      await this.store.read()
      const currentLock = this.store.data?.lock

      if (currentLock) {
        // Successfully acquired lock!
        if (currentLock === lock) {
          console.log(lock, 'acquired!')
          return
        }

        if (!firstLock) {
          firstLock = currentLock
        }
      }

      // Try to acquire lock.
      if (!currentLock) {
        await acquire()
        continue acquire
      }

      if (tried++ > 50) {
        // We probably got locked in a broken state
        if (firstLock === currentLock) {
          await acquire()
          continue acquire
        }

        throw new Error('Could not establish safe connection to lowdb')
      }

      console.log(lock, 'waiting')

      // Await to try again
      await new Promise((res) => setTimeout(res, 100))
    }
  }

  disconnect = async () => {
    console.log(this.store.data?.lock, 'releasing')
    // @ts-ignore
    this.store.data = { ...this.store.data, lock: null }
    await this.store.write()
  }

  /**
   * Perform async actions on the store with ensured read/write.
   */
  act = async <R>(action: Action<R>) => {
    await this.connect()

    await this.store.read()
    const data = this.store.data ?? {}

    const result = await action(data)
    this.store.data = data

    await this.store.write()
    await this.disconnect()

    return result
  }

  register = async (path: string, tags: string[]) =>
    await void this.act((data) => {
      const now = new Date().toISOString()

      for (const tag of tags) {
        data[tag] = data[tag] ?? {}
        data[tag][path] = now
      }
    })

  extract = async (tag: string) =>
    await this.act((data) => {
      const paths = Object.keys(data[tag] ?? {})
      delete data[tag]
      return paths
    })
}

export { LowdbCacheTagsRegistry }
