/**
 * Generates a 7 chars long hash of a given tag.
 */
const defaultGenerateHash = (tag: string) => {
  let hash = 0

  for (let i = 0; i < tag.length; i++) {
    const char = tag.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }

  return new Uint32Array([hash])[0].toString(36)
}

/**
 * Empty implementation of hash generator, for disabling it.
 */
const noHash = (tag: string) => tag

export { defaultGenerateHash, noHash }
