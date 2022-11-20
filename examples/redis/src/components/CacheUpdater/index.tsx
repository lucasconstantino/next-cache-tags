import classnames from 'classnames'
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

import type { TCacheInfo } from '~/hooks/useCacheInfo'
import { usePrevious } from '~/hooks/usePrevious'

type TProps = {
  cacheInfo: TCacheInfo

  /**
   * Update cache every "frequency" milliseconds.
   */
  frequency: number
}

let init = false
const styles = buildStyles({ strokeLinecap: 'butt', pathColor: '#666', pathTransitionDuration: 0 })

const CacheUpdater: React.FC<TProps> = ({ cacheInfo, frequency }) => {
  const [state, setState] = useState<'initial' | 'updating' | 'waiting'>('initial')
  const [remaining, setRemaining] = useState(0)

  const previousTime = useRef<number>()
  const animationFrame = useRef<number>()

  const wasUpdating = usePrevious(cacheInfo.updating)

  // Initial load.
  useEffect(() => void (init ? null : ((init = true), cacheInfo.update())), [])

  /**
   * Reactive state handler.
   */
  useEffect(() => {
    // Execute when started updating
    if (cacheInfo.updating && !wasUpdating) {
      setState('updating')
      setRemaining(0)
    }

    // Execute when finished updating
    if (!cacheInfo.updating && wasUpdating) {
      setState('waiting')
      setRemaining(frequency)
    }
  }, [cacheInfo.updating, wasUpdating])

  /**
   * Reactive update dispatcher.
   */
  useEffect(
    () => void (!cacheInfo.updating && remaining === 0 ? cacheInfo.update() : null),
    [remaining]
  )

  /**
   * Reset state upon cache updating.
   */
  useEffect(() => {
    // Execute when started updating
    if (cacheInfo.updating && !wasUpdating) {
      setState('updating')
      setRemaining(0)
    }
  }, [cacheInfo.updating])

  /**
   * Countdown animation logic.
   */
  useEffect(() => {
    const iterate = (time: number) => {
      if (previousTime.current !== undefined) {
        const elapsed = time - previousTime.current

        // Ensure we won't update the state past zero marker.
        setRemaining((current) => Math.max(current - elapsed, 0))
      }

      previousTime.current = time
      animationFrame.current = requestAnimationFrame(iterate)
    }

    // Start animating:
    animationFrame.current = requestAnimationFrame(iterate)

    // Stop animating on unmount.
    return () => void (animationFrame.current ? cancelAnimationFrame(animationFrame.current) : null)
  }, [])

  let text = ''
  if (state === 'waiting') text = `${(remaining / 1000).toFixed(1)}s`
  if (state === 'updating') text = 'loading'

  return (
    <div id="cache-update-status" className={classnames({ updating: state === 'updating' })}>
      <CircularProgressbarWithChildren
        value={100 - (remaining ? remaining / frequency : 0) * 100}
        styles={styles}
      >
        {text}
      </CircularProgressbarWithChildren>
    </div>
  )
}

export { CacheUpdater }
