import type { NextApiRequest, NextApiResponse } from 'next'
import { createMocks } from 'node-mocks-http'
import { CacheTags } from './cache-tags'
import type { TagsResolver } from './cache-tags'
import { CacheTagsRegistry } from './registry/base'

/**
 * Creates a mocked registry.
 */
const getRegistryMock = (): CacheTagsRegistry => {
  const registry: { [key: string]: string[] } = {}

  return {
    register: jest.fn((path, tags) => {
      for (const tag of tags) {
        registry[tag] = (registry[tag] ?? []).concat(path)
      }
    }),

    extract: jest.fn((tag) => {
      const paths = registry[tag] ?? []
      delete registry[tag]
      return paths
    }),
  }
}

/**
 * Create network mock.
 */
const getNetworkMock = (...params: Parameters<typeof createMocks>) => {
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>(...params)

  res.revalidate = jest.fn()

  return { req, res }
}

describe('CacheTags', () => {
  let registry: CacheTagsRegistry

  beforeEach(() => (registry = getRegistryMock()))

  it('should be possible to create an instance of CacheTags', () => {
    expect(() => new CacheTags({ registry })).not.toThrow()
    expect(new CacheTags({ registry })).toBeInstanceOf(CacheTags)
  })

  describe('::generateHash', () => {
    it('should be possible to use the default hash generator', () => {
      const cacheTags = new CacheTags({ registry })
      expect(typeof cacheTags.generateHash('some-id')).toBe('string')
    })

    it('should be possible to pass a custom hash generator', () => {
      const cacheTags = new CacheTags({ registry, generateHash: () => 'tag' })
      expect(cacheTags.generateHash('some-id')).toBe('tag')
    })

    it('should be possible to disable hash generator', () => {
      const cacheTags = new CacheTags({ registry, generateHash: false })
      expect(cacheTags.generateHash('some-id')).toBe('some-id')
    })
  })

  describe('::register', () => {
    it('should register a cache tags for a path', () => {
      const cacheTags = new CacheTags({ registry, generateHash: false })
      cacheTags.register('/some-path', ['tag-1'])

      expect(registry.register).toHaveBeenCalledWith('/some-path', ['tag-1'])
    })

    it('should hash registering cache', () => {
      const generateHash = jest.fn(() => 'hashed')
      const cacheTags = new CacheTags({ registry, generateHash })

      cacheTags.register('/some-path', ['tag-1'])

      expect(generateHash).toHaveBeenCalledWith('tag-1')
      expect(registry.register).toHaveBeenCalledWith('/some-path', ['hashed'])
    })
  })

  describe('::invalidator', () => {
    const resolver: TagsResolver = jest.fn((req) => [req.query.tag as string])

    it('should create a handler function', () => {
      const cacheTags = new CacheTags({ registry })
      const invalidator = cacheTags.invalidator({ resolver })

      expect(invalidator).toBeInstanceOf(Function)
    })

    it('should use tags resolver', async () => {
      const resolver: TagsResolver = jest.fn(() => [])
      const cacheTags = new CacheTags({ registry })
      const invalidator = cacheTags.invalidator({ resolver })

      const { req, res } = createMocks()
      await invalidator(req, res)

      expect(resolver).toHaveBeenCalledWith(req, res)
    })

    it('should use hash generator for resolved tags', async () => {
      const resolver = () => ['tag-1', 'tag-2']
      const generateHash = jest.fn(() => 'hash-1')
      const cacheTags = new CacheTags({ registry, generateHash })
      const invalidator = cacheTags.invalidator({ resolver })

      const { req, res } = getNetworkMock()
      await invalidator(req, res)

      expect(generateHash).toHaveBeenCalledWith('tag-1')
      expect(generateHash).toHaveBeenCalledWith('tag-2')
    })

    it('should execute revalidation for related paths', async () => {
      const cacheTags = new CacheTags({ registry, generateHash: false })
      const invalidator = cacheTags.invalidator({ resolver })

      cacheTags.register('/some-path', ['tag-1', 'tag-2'])
      cacheTags.register('/other-path', ['tag-1'])
      cacheTags.register('/unaffected-path', ['tag-3'])

      const { req, res } = getNetworkMock({ query: { tag: 'tag-1' } })

      await invalidator(req, res)

      expect(res.revalidate).toHaveBeenCalledWith('/some-path')
      expect(res.revalidate).toHaveBeenCalledWith('/other-path')
    })

    it('should execute onSuccess callback with invalidating tags', async () => {
      const onSuccess = jest.fn()
      const cacheTags = new CacheTags({ registry, generateHash: false })
      const invalidator = cacheTags.invalidator({ resolver, onSuccess })

      cacheTags.register('/some-path', ['tag-1', 'tag-2'])

      const { req, res } = getNetworkMock({ query: { tag: 'tag-1' } })

      await invalidator(req, res)

      expect(onSuccess).toHaveBeenCalledWith(req, res, ['tag-1'])
    })

    it('should execute onError callback upon invalidating error', async () => {
      const onError = jest.fn()
      const cacheTags = new CacheTags({
        registry: {
          ...registry,
          extract: () => {
            throw new Error('Simulated error')
          },
        },
        generateHash: false,
      })

      const invalidator = cacheTags.invalidator({ resolver, onError })

      cacheTags.register('/some-path', ['tag-1', 'tag-2'])
      cacheTags.register('/other-path', ['tag-1'])

      const { req, res } = getNetworkMock({ query: { tag: 'tag-1' } })

      await invalidator(req, res)

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        req,
        res,
        undefined
      )
    })

    it('should send default successful response', async () => {
      const cacheTags = new CacheTags({ registry })
      const invalidator = cacheTags.invalidator({ resolver })

      const { req, res } = getNetworkMock({ query: { tag: 'tag-1' } })
      res.send = jest.fn(res.send)

      await invalidator(req, res)

      expect(res.send).toHaveBeenCalledWith('ok')
    })

    it('should send default error response', async () => {
      const extract = () => Promise.reject(new Error('Simulated error'))
      const cacheTags = new CacheTags({ registry: { ...registry, extract } })
      const invalidator = cacheTags.invalidator({ resolver })

      const { req, res } = getNetworkMock({ query: { tag: 'tag-1' } })

      res.status = jest.fn(res.status)
      res.json = jest.fn(res.json)

      await invalidator(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ message: 'Simulated error' })
    })
  })
})
