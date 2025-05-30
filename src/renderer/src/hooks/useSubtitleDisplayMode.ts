import { useState, useCallback } from 'react'
import { DisplayMode } from '@renderer/types'
import { ReactCallback } from '@renderer/types/shared'

interface UseSubtitleDisplayModeReturn {
  displayMode: DisplayMode
  setDisplayMode: ReactCallback<(mode: DisplayMode) => void>
  /** 被 useCallback 包装的字幕显示模式切换回调函数 */
  toggleDisplayMode: ReactCallback<() => void>
  restoreDisplayMode: ReactCallback<(mode: DisplayMode) => void>
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
