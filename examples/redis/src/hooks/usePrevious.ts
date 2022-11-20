import { useRef, useEffect } from 'react'

/**
 * Maintain the previous value in a reference.
 */
const usePrevious = <T>(value: T) => {
  const ref = useRef<T>(value)

  // @ts-ignore
  useEffect(() => void (ref.current = value))

  return ref.current
}

export { usePrevious }
