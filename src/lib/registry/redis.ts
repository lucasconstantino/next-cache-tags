import type {
  RedisClientType,
  RedisClientOptions,
  RedisModules,
  RedisFunctions,
  RedisScripts,
} from 'redis'
import { createClient } from 'redis'
import { CacheTagsRegistry } from './base'

/**
 * A Cache-Tags registry implemented using Redis.
 */
class RedisCacheTagsRegistry<
  M extends RedisModules = RedisModules,
  F extends RedisFunctions = RedisFunctions,
  S extends RedisScripts = RedisScripts
> extends CacheTagsRegistry {
  private client: RedisClientType<M, F, S>
  private acting = 0
  private connecting: Promise<void> | null = null

  constructor(config: RedisClientOptions<M, F, S>) {
    super()
    this.client = createClient(config)
  }

  /**
   * Perform async actions on the store with ensured read/write.
   */
  act = async <R>(action: (client: RedisClientType<M, F, S>) => Promise<R>) => {
    // Inform of ongoing action.
    this.acting++

    // Establish connection
    await (this.connecting = this.connecting ?? this.client.connect())

    // Execute action.
    const result = await action(this.client)

    // Only disconnect on last action.
    if (--this.acting === 0) {
      this.connecting = null
      await this.client.disconnect()
    }

    return result
  }

  register = async (path: string, tags: string[]) =>
    await this.act(async () => {
      const now = new Date().toISOString()
      const transaction = this.client.multi()

      for (const tag of tags) {
        // @ts-ignore
        transaction.HSET(tag, path, now)
      }

      await transaction.exec()
    })

  extract = async (tag: string) =>
    await this.act(async () => {
      // Retrieve all paths related to this key.
      const paths = Object.keys((await this.client.HGETALL(tag)) ?? {})

      // Dispatch deletion.
      void this.client.DEL(tag)

      return paths as any as string[]
    })
}

export { RedisCacheTagsRegistry }
