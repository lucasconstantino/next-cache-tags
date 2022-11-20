/**
 * Resolve a color based on cache age, from green (recent) to red (old).
 */
const useAgeColor = (age: number | null, maxAge = 20) => {
  if (age === null) {
    return 'black'
  }

  const perc = Math.max(0, Math.min(1, age / maxAge))

  // RGB construction based on age percentage.
  return `rgb(${perc * 255}, ${255 - perc * 255}, 0)`
}

export { useAgeColor }
