import { defaultGenerateHash } from './hash'

describe('defaultGenerateHash', () => {
  it('should create a hash string from a tag', () => {
    expect(typeof defaultGenerateHash('some-tag')).toBe('string')
  })

  it('should create indepotent hashes', () => {
    expect(defaultGenerateHash('some-tag')).toBe(defaultGenerateHash('some-tag'))
    expect(defaultGenerateHash('some-tag')).not.toBe(defaultGenerateHash('other-tag'))
  })
})
