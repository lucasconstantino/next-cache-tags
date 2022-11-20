import { createMocks } from 'node-mocks-http'
import { CacheTags } from './cache-tags'
import type { TagsResolver } from './cache-tags'
import { MemoryCacheTagsRegistry } from './registry/memory'

describe('CacheTags', () => {
  let registry: MemoryCacheTagsRegistry

  beforeEach(() => (registry = new MemoryCacheTagsRegistry()))

  it('should be possible to create an instance of CacheTags', () => {
    expect(() => new CacheTags({ registry })).not.toThrow()
    expect(new CacheTags({ registry })).toBeInstanceOf(CacheTags)
  })

  describe('hash generator', () => {
    it('should be possible to use the hash generator', () => {
      const cacheTags = new CacheTags({ registry })
      expect(typeof cacheTags.generateHash('some-id')).toBe('string')
    })

    it('should be possible to pass a custom hash generator', () => {
      const cacheTags = new CacheTags({ registry, generateHash: () => 'tag' })
      expect(cacheTags.generateHash('some-id')).toBe('tag')
    })
  })

  describe('invalidator', () => {
    const resolver: TagsResolver = jest.fn((req) => [req.query.tag as string])

    it('should create a handler function', () => {
      const cacheTags = new CacheTags({ registry })
      const invalidator = cacheTags.invalidator({ resolver })

      expect(invalidator).toBeInstanceOf(Function)
    })

    it('should execute tags resolver upon invokation', async () => {
      const resolver: TagsResolver = jest.fn(() => [])
      const cacheTags = new CacheTags({ registry })
      const invalidator = cacheTags.invalidator({ resolver })

      const { req, res } = createMocks()
      await invalidator(req, res)

      expect(resolver).toHaveBeenCalledWith(req, res)
    })

    it('should execute hash generator for resolved tags', async () => {
      const resolver = () => ['some-tag']
      const generateHash = jest.fn(() => 'some-hash')
      const cacheTags = new CacheTags({ registry, generateHash })
      const invalidator = cacheTags.invalidator({ resolver })

      const { req, res } = createMocks()
      await invalidator(req, res)

      expect(generateHash).toHaveBeenCalledWith('some-tag')
    })

    it('should execute hash generator for all resolved tags', async () => {
      const resolver = () => ['first', 'second']
      const generateHash = jest.fn(() => 'some-hash')
      const cacheTags = new CacheTags({ registry, generateHash })
      const invalidator = cacheTags.invalidator({ resolver })

      const { req, res } = createMocks()
      await invalidator(req, res)

      expect(generateHash).toHaveBeenCalledWith('first')
      expect(generateHash).toHaveBeenCalledWith('second')
    })

    it('should execute revalidation for related paths', async () => {
      const cacheTags = new CacheTags({ registry, generateHash: false })
      const invalidator = cacheTags.invalidator({ resolver })

      cacheTags.registry.register('/some-path', ['tag-1', 'tag-2'])
      cacheTags.registry.register('/other-path', ['tag-1'])
      cacheTags.registry.register('/unaffected-path', ['tag-3'])

      const { req, res } = createMocks({ query: { tag: 'tag-1' } })

      res.revalidate = jest.fn(res.revalidate)
      await invalidator(req, res)

      expect(res.revalidate).toHaveBeenCalledWith('/some-path')
      expect(res.revalidate).toHaveBeenCalledWith('/other-path')
    })
  })
})
