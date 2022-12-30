import type {
  RedisClientType,
  RedisClientOptions,
  RedisModules,
  RedisFunctions,
  RedisScripts,
} from 'redis'
import { createClient } from 'redis'
import { CacheTagsRegistry } from './type'

/**
 * A Cache-Tags registry implemented using Redis.
 */
class RedisCacheTagsRegistry<
  M extends RedisModules = RedisModules,
  F extends RedisFunctions = RedisFunctions,
  S extends RedisScripts = RedisScripts
> implements CacheTagsRegistry
{
  private client: RedisClientType<M, F, S>
  private acting = 0
  private connecting?: Promise<void>
  private disconnecting?: Promise<void>

  constructor(config: RedisClientOptions<M, F, S>) {
    this.client = createClient(config)
  }

  /**
   * Perform async actions on the store with ensured read/write.
   */
  act = async <R>(action: (client: RedisClientType<M, F, S>) => Promise<R>) => {
    // Inform of ongoing action.
    this.acting++

    // Ensure a closing connection ends it's process.
    await this.disconnecting

    // Establish connection
    await (this.connecting = this.connecting ?? this.client.connect())

    // Execute action.
    const result = await action(this.client)

    // Only disconnect on last action.
    if (--this.acting === 0 && this.client.isOpen) {
      // Start disconnection process.
      this.disconnecting = this.client.quit()

      // Ensure new acts reconnect.
      delete this.connecting

      // Wait for disconnection before proceeding
      await this.disconnecting
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
