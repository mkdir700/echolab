import { useState, useCallback } from 'react'

export type DisplayMode = 'none' | 'original' | 'chinese' | 'english' | 'bilingual'

interface UseSubtitleDisplayModeReturn {
  displayMode: DisplayMode
  setDisplayMode: (mode: DisplayMode) => void
  toggleDisplayMode: () => void
  restoreDisplayMode: (mode: DisplayMode) => void
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

  const restoreDisplayMode = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode)
    console.log('🔄 恢复字幕显示模式:', mode)
  }, [])

  return {
    displayMode,
    setDisplayMode,
    toggleDisplayMode,
    restoreDisplayMode
  }
}
