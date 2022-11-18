import React, { useEffect, useState } from 'react'

const useCmdPressed = () => {
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    const handleKeyDown = () => setIsPressed(true)
    const handleKeyUp = () => setIsPressed(false)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return isPressed
}

export { useCmdPressed }
