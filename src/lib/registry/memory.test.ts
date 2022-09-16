import { MemoryCacheTagsRegistry } from './memory'

describe('registry/memory', () => {
  let registry: MemoryCacheTagsRegistry

  beforeEach(() => (registry = new MemoryCacheTagsRegistry()))

  it('should be possible to register path/tags relationship', () => {
    expect(() => registry.register('some-path', ['tag1', 'tag2'])).not.toThrow()
  })

  it('should be possible to retrieve a path related to a tag', () => {
    registry.register('some-path', ['tag1'])
    expect(registry.extract('tag1')).toEqual(['some-path'])
  })

  it('should not register a path more than once', () => {
    registry.register('some-path', ['tag1'])
    registry.register('some-path', ['tag1'])
    expect(registry.extract('tag1')).toEqual(['some-path'])
  })

  it('should clear the registry after extraction', () => {
    registry.register('some-path', ['tag1'])
    expect(registry.extract('tag1')).toEqual(['some-path'])
    expect(registry.extract('tag1')).toEqual([])
  })

  it('should be possible to retrieve multiple paths', () => {
    registry.register('some-path', ['tag1'])
    registry.register('other-path', ['tag1', 'tag2'])
    expect(registry.extract('tag1')).toEqual(['some-path', 'other-path'])
  })
})
