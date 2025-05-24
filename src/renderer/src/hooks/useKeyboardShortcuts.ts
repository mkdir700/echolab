import { useEffect } from 'react'
import { KEYBOARD_SHORTCUTS, VOLUME_SETTINGS } from '../constants'

interface UseKeyboardShortcutsProps {
  onPlayPause: () => void
  onStepBackward: () => void
  onStepForward: () => void
  onToggleSubtitleMode?: () => void
  onVolumeChange: (volume: number) => void
  currentVolume: number
  onToggleSingleLoop?: () => void
  onToggleAutoPause?: () => void
  onGoToPreviousSubtitle?: () => void
  onGoToNextSubtitle?: () => void
}

export function useKeyboardShortcuts({
  onPlayPause,
  onStepBackward,
  onStepForward,
  onToggleSubtitleMode,
  onVolumeChange,
  currentVolume,
  onToggleSingleLoop,
  onToggleAutoPause,
  onGoToPreviousSubtitle,
  onGoToNextSubtitle
}: UseKeyboardShortcutsProps): void {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      // 避免在文本输入框中触发快捷键
      if (e.target && (e.target as HTMLElement).tagName === 'TEXTAREA') return

      switch (e.code) {
        case KEYBOARD_SHORTCUTS.SPACE:
          e.preventDefault()
          onPlayPause()
          break
        case KEYBOARD_SHORTCUTS.ARROW_LEFT:
          e.preventDefault()
          onStepBackward()
          break
        case KEYBOARD_SHORTCUTS.ARROW_RIGHT:
          e.preventDefault()
          onStepForward()
          break
        case KEYBOARD_SHORTCUTS.KEY_M:
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            onToggleSubtitleMode?.()
          }
          break
        case KEYBOARD_SHORTCUTS.ARROW_UP:
          e.preventDefault()
          onVolumeChange(
            Math.min(VOLUME_SETTINGS.MAX, currentVolume + VOLUME_SETTINGS.KEYBOARD_STEP)
          )
          break
        case KEYBOARD_SHORTCUTS.ARROW_DOWN:
          e.preventDefault()
          onVolumeChange(
            Math.max(VOLUME_SETTINGS.MIN, currentVolume - VOLUME_SETTINGS.KEYBOARD_STEP)
          )
          break
        case KEYBOARD_SHORTCUTS.KEY_S:
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            onToggleSingleLoop?.()
          }
          break
        case KEYBOARD_SHORTCUTS.KEY_P:
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            onToggleAutoPause?.()
          }
          break
        case KEYBOARD_SHORTCUTS.KEY_J:
          e.preventDefault()
          onGoToPreviousSubtitle?.()
          break
        case KEYBOARD_SHORTCUTS.KEY_K:
          e.preventDefault()
          onGoToNextSubtitle?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return (): void => window.removeEventListener('keydown', handleKeyPress)
  }, [
    onPlayPause,
    onStepBackward,
    onStepForward,
    onToggleSubtitleMode,
    onVolumeChange,
    currentVolume,
    onToggleSingleLoop,
    onToggleAutoPause,
    onGoToPreviousSubtitle,
    onGoToNextSubtitle
  ])
}
