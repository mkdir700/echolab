import { useState, useEffect, useCallback } from 'react'

// 快捷键配置接口
export interface ShortcutConfig {
  key: string
  name: string
  description: string
  defaultKey: string
  category: 'playback' | 'subtitle'
}

// 默认快捷键配置
export const DEFAULT_SHORTCUTS: Record<string, ShortcutConfig> = {
  playPause: {
    key: 'playPause',
    name: '播放/暂停',
    description: '控制视频播放状态',
    defaultKey: 'Space',
    category: 'playback'
  },
  stepBackward: {
    key: 'stepBackward',
    name: '后退5秒',
    description: '视频后退5秒',
    defaultKey: '←',
    category: 'playback'
  },
  stepForward: {
    key: 'stepForward',
    name: '前进5秒',
    description: '视频前进5秒',
    defaultKey: '→',
    category: 'playback'
  },
  volumeUp: {
    key: 'volumeUp',
    name: '音量增加',
    description: '增加音量10%',
    defaultKey: '↑',
    category: 'playback'
  },
  volumeDown: {
    key: 'volumeDown',
    name: '音量减少',
    description: '减少音量10%',
    defaultKey: '↓',
    category: 'playback'
  },
  toggleSubtitleMode: {
    key: 'toggleSubtitleMode',
    name: '切换字幕模式',
    description: '在原文/双语/隐藏字幕间切换',
    defaultKey: 'Ctrl+M',
    category: 'subtitle'
  },
  singleLoop: {
    key: 'singleLoop',
    name: '单句循环',
    description: '开启/关闭当前字幕单句循环',
    defaultKey: 'R',
    category: 'subtitle'
  },
  autoPause: {
    key: 'autoPause',
    name: '自动暂停',
    description: '开启/关闭字幕结束时自动暂停',
    defaultKey: 'Ctrl+P',
    category: 'subtitle'
  },
  previousSubtitle: {
    key: 'previousSubtitle',
    name: '上一句字幕',
    description: '跳转到上一句字幕',
    defaultKey: 'H',
    category: 'subtitle'
  },
  nextSubtitle: {
    key: 'nextSubtitle',
    name: '下一句字幕',
    description: '跳转到下一句字幕',
    defaultKey: 'L',
    category: 'subtitle'
  }
}

// 快捷键管理 hook
export function useShortcutManager(): {
  shortcuts: Record<string, string>
  getCurrentShortcut: (key: string) => string
  updateShortcut: (key: string, newKey: string) => void
  resetShortcuts: () => void
  matchesShortcut: (event: KeyboardEvent, shortcutKey: string) => boolean
} {
  const [shortcuts, setShortcuts] = useState<Record<string, string>>(() => {
    // 从 localStorage 加载保存的快捷键配置
    const saved = localStorage.getItem('echolab-shortcuts')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {}
      }
    }
    return {}
  })

  // 获取当前快捷键（用户自定义或默认）
  const getCurrentShortcut = useCallback(
    (key: string): string => {
      return shortcuts[key] || DEFAULT_SHORTCUTS[key]?.defaultKey || ''
    },
    [shortcuts]
  )

  // 更新快捷键
  const updateShortcut = useCallback(
    (key: string, newKey: string) => {
      const newShortcuts = { ...shortcuts, [key]: newKey }
      setShortcuts(newShortcuts)
      localStorage.setItem('echolab-shortcuts', JSON.stringify(newShortcuts))
    },
    [shortcuts]
  )

  // 重置快捷键
  const resetShortcuts = useCallback(() => {
    setShortcuts({})
    localStorage.removeItem('echolab-shortcuts')
  }, [])

  // 检查按键事件是否匹配快捷键
  const matchesShortcut = useCallback(
    (event: KeyboardEvent, shortcutKey: string): boolean => {
      // 直接使用当前的 shortcuts 状态，避免闭包问题
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
    },
    [shortcuts]
  )

  // 监听 localStorage 变化（用于跨组件同步）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === 'echolab-shortcuts') {
        try {
          const newShortcuts = e.newValue ? JSON.parse(e.newValue) : {}
          setShortcuts(newShortcuts)
        } catch {
          setShortcuts({})
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return {
    shortcuts,
    getCurrentShortcut,
    updateShortcut,
    resetShortcuts,
    matchesShortcut
  }
}
