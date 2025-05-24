import { useState, useCallback } from 'react'

export type DisplayMode = 'none' | 'original' | 'chinese' | 'english' | 'bilingual'

interface UseSubtitleDisplayModeReturn {
  displayMode: DisplayMode
  setDisplayMode: (mode: DisplayMode) => void
  toggleDisplayMode: () => void
}

export function useSubtitleDisplayMode(
  initialMode: DisplayMode = 'bilingual'
): UseSubtitleDisplayModeReturn {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode)

  const toggleDisplayMode = useCallback(() => {
    const modes: DisplayMode[] = ['bilingual', 'english', 'chinese', 'none']
    const currentIndex = modes.indexOf(displayMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setDisplayMode(modes[nextIndex])
  }, [displayMode])

  return {
    displayMode,
    setDisplayMode,
    toggleDisplayMode
  }
}
