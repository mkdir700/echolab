import { useState, useCallback, useEffect } from 'react'

// 扩展 Document 和 Element 接口以支持全屏 API
interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element
  mozFullScreenElement?: Element
  msFullscreenElement?: Element
  webkitExitFullscreen?: () => Promise<void>
  mozCancelFullScreen?: () => Promise<void>
  msExitFullscreen?: () => Promise<void>
}

interface FullscreenElement extends Element {
  webkitRequestFullscreen?: () => Promise<void>
  mozRequestFullScreen?: () => Promise<void>
  msRequestFullscreen?: () => Promise<void>
}

interface UseFullscreenReturn {
  isFullscreen: boolean
  toggleFullscreen: () => void
  enterFullscreen: () => void
  exitFullscreen: () => void
}

export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = (): void => {
      const fullscreenDoc = document as FullscreenDocument
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        fullscreenDoc.webkitFullscreenElement ||
        fullscreenDoc.mozFullScreenElement ||
        fullscreenDoc.msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    // 添加全屏状态变化监听器
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  // 进入全屏
  const enterFullscreen = useCallback(async (): Promise<void> => {
    try {
      const element = document.documentElement as FullscreenElement
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen()
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen()
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen()
      }
    } catch (error) {
      console.error('进入全屏失败:', error)
    }
  }, [])

  // 退出全屏
  const exitFullscreen = useCallback(async (): Promise<void> => {
    try {
      const fullscreenDoc = document as FullscreenDocument
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (fullscreenDoc.webkitExitFullscreen) {
        await fullscreenDoc.webkitExitFullscreen()
      } else if (fullscreenDoc.mozCancelFullScreen) {
        await fullscreenDoc.mozCancelFullScreen()
      } else if (fullscreenDoc.msExitFullscreen) {
        await fullscreenDoc.msExitFullscreen()
      }
    } catch (error) {
      console.error('退出全屏失败:', error)
    }
  }, [])

  // 切换全屏状态
  const toggleFullscreen = useCallback((): void => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  return {
    isFullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen
  }
}
