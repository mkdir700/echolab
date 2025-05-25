import { useEffect } from 'react'
import { VOLUME_SETTINGS } from '../constants'
import { useShortcuts } from './useShortcuts'
import { DEFAULT_SHORTCUTS } from './useShortcutManager'

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
  const { shortcuts } = useShortcuts()

  useEffect(() => {
    // 创建快捷键匹配函数，直接使用当前的 shortcuts 状态
    const matchesShortcut = (event: KeyboardEvent, shortcutKey: string): boolean => {
      const currentKey = shortcuts[shortcutKey] || DEFAULT_SHORTCUTS[shortcutKey]?.defaultKey || ''
      if (!currentKey) return false

      // 解析快捷键字符串
      const parts = currentKey.split('+')
      const key = parts[parts.length - 1]
      const hasCtrl = parts.includes('Ctrl')
      const hasAlt = parts.includes('Alt')
      const hasShift = parts.includes('Shift')

      // 检查修饰键
      if (hasCtrl !== (event.ctrlKey || event.metaKey)) return false
      if (hasAlt !== event.altKey) return false
      if (hasShift !== event.shiftKey) return false

      // 检查主键
      if (key === 'Space') {
        return event.code === 'Space'
      } else if (key === '←') {
        return event.code === 'ArrowLeft'
      } else if (key === '→') {
        return event.code === 'ArrowRight'
      } else if (key === '↑') {
        return event.code === 'ArrowUp'
      } else if (key === '↓') {
        return event.code === 'ArrowDown'
      } else if (key.startsWith('Arrow')) {
        return event.code === key
      } else if (key.length === 1) {
        return event.code === `Key${key.toUpperCase()}`
      } else {
        return event.code === key
      }
    }

    const handleKeyPress = (e: KeyboardEvent): void => {
      // 避免在文本输入框中触发快捷键
      if (e.target && (e.target as HTMLElement).tagName === 'TEXTAREA') return

      // 使用新的快捷键匹配系统
      if (matchesShortcut(e, 'playPause')) {
        e.preventDefault()
        onPlayPause()
      } else if (matchesShortcut(e, 'stepBackward')) {
        e.preventDefault()
        onStepBackward()
      } else if (matchesShortcut(e, 'stepForward')) {
        e.preventDefault()
        onStepForward()
      } else if (matchesShortcut(e, 'toggleSubtitleMode')) {
        e.preventDefault()
        onToggleSubtitleMode?.()
      } else if (matchesShortcut(e, 'volumeUp')) {
        e.preventDefault()
        onVolumeChange(Math.min(VOLUME_SETTINGS.MAX, currentVolume + VOLUME_SETTINGS.KEYBOARD_STEP))
      } else if (matchesShortcut(e, 'volumeDown')) {
        e.preventDefault()
        onVolumeChange(Math.max(VOLUME_SETTINGS.MIN, currentVolume - VOLUME_SETTINGS.KEYBOARD_STEP))
      } else if (matchesShortcut(e, 'singleLoop')) {
        e.preventDefault()
        onToggleSingleLoop?.()
      } else if (matchesShortcut(e, 'autoPause')) {
        e.preventDefault()
        onToggleAutoPause?.()
      } else if (matchesShortcut(e, 'previousSubtitle')) {
        e.preventDefault()
        onGoToPreviousSubtitle?.()
      } else if (matchesShortcut(e, 'nextSubtitle')) {
        e.preventDefault()
        onGoToNextSubtitle?.()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return (): void => window.removeEventListener('keydown', handleKeyPress)
  }, [
    shortcuts, // 直接依赖 shortcuts 状态
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
