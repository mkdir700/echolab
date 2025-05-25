import { useState, useCallback, useEffect, useMemo } from 'react'
import { throttle } from '../utils/helpers'
import { SIDEBAR_SETTINGS, THROTTLE_DELAYS } from '../constants'

interface UseSidebarResizeReturn {
  sidebarWidth: number
  isDragging: boolean
  handleMouseDown: (e: React.MouseEvent) => void
  restoreSidebarWidth: (width: number) => void
}

export function useSidebarResize(
  containerRef: React.RefObject<HTMLDivElement | null>
): UseSidebarResizeReturn {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_SETTINGS.DEFAULT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)

  // 处理拖拽调整侧边栏宽度 - 添加节流优化
  const handleMouseMove = useMemo(() => {
    return throttle((e: MouseEvent): void => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newSidebarWidth = containerRect.right - e.clientX
      const minWidth = SIDEBAR_SETTINGS.MIN_WIDTH
      const maxWidth = Math.min(600, containerRect.width * SIDEBAR_SETTINGS.MAX_WIDTH_RATIO)

      setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, newSidebarWidth)))
    }, THROTTLE_DELAYS.RESIZE)
  }, [isDragging, containerRef])

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false)
  }, [])

  // 拖拽事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return (): void => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
    return undefined
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleMouseDown = useCallback((e: React.MouseEvent): void => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const restoreSidebarWidth = useCallback((width: number): void => {
    const minWidth = SIDEBAR_SETTINGS.MIN_WIDTH
    const maxWidth = 600 // 使用固定最大宽度
    const validWidth = Math.max(minWidth, Math.min(maxWidth, width))
    setSidebarWidth(validWidth)
    console.log('🔄 恢复侧边栏宽度:', validWidth)
  }, [])

  return {
    sidebarWidth,
    isDragging,
    handleMouseDown,
    restoreSidebarWidth
  }
}
