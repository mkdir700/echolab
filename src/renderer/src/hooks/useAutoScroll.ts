import { useRef, useCallback, useEffect, useMemo } from 'react'
import { throttle } from '../utils/helpers'
import { AUTO_SCROLL_SETTINGS, THROTTLE_DELAYS } from '../constants'

interface UseAutoScrollProps {
  currentSubtitleIndex: number
  subtitlesLength: number
  isAutoScrollEnabled: boolean
  onAutoScrollChange: (enabled: boolean) => void
}

interface UseAutoScrollReturn {
  subtitleListRef: React.RefObject<HTMLDivElement | null>
  handleUserScroll: () => void
  scrollToCurrentSubtitle: (index: number) => void
  handleCenterCurrentSubtitle: () => void
}

export function useAutoScroll({
  currentSubtitleIndex,
  subtitlesLength,
  isAutoScrollEnabled,
  onAutoScrollChange
}: UseAutoScrollProps): UseAutoScrollReturn {
  const subtitleListRef = useRef<HTMLDivElement>(null)
  const userScrollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoScrollingRef = useRef(false)
  const scrollEventListenerRef = useRef<boolean>(false)

  // 检查 DOM 元素是否准备就绪
  const checkDOMReady = useCallback((): boolean => {
    if (!subtitleListRef.current || subtitlesLength === 0) {
      return false
    }

    const listElement = subtitleListRef.current.querySelector('[class*="subtitleList"]')
    if (!listElement) {
      return false
    }

    const antListContainer = listElement.querySelector('.ant-list-items')
    const actualContainer = antListContainer || listElement

    return actualContainer.children.length > 0
  }, [subtitlesLength])

  // 将字幕索引映射到实际DOM索引的辅助函数
  const getActualDOMIndex = useCallback((subtitleIndex: number): number => {
    if (!subtitleListRef.current || subtitleIndex < 0) return -1

    const listElement = subtitleListRef.current.querySelector('[class*="subtitleList"]')
    if (!listElement) return -1

    const antListContainer = listElement.querySelector('.ant-list-items')
    const actualContainer = antListContainer || listElement
    const actualItemsCount = actualContainer.children.length

    if (subtitleIndex >= actualItemsCount) {
      return actualItemsCount - 1
    }

    return subtitleIndex
  }, [])

  // 优化的自动滚动函数
  const scrollToCurrentSubtitle = useMemo(() => {
    return throttle((index: number): void => {
      if (index === -1 || !subtitleListRef.current || subtitlesLength === 0) {
        return
      }

      if (!isAutoScrollEnabled) {
        return
      }

      // 检查 DOM 是否准备就绪
      if (!checkDOMReady()) {
        // 延迟重试，但不输出日志
        setTimeout(() => {
          if (checkDOMReady()) {
            scrollToCurrentSubtitle(index)
          }
        }, 100)
        return
      }

      isAutoScrollingRef.current = true

      const actualDOMIndex = getActualDOMIndex(index)
      if (actualDOMIndex === -1) {
        isAutoScrollingRef.current = false
        return
      }

      const listElement = subtitleListRef.current.querySelector('[class*="subtitleList"]')
      if (!listElement) {
        isAutoScrollingRef.current = false
        return
      }

      const antListContainer = listElement.querySelector('.ant-list-items')
      const actualContainer = antListContainer || listElement
      const actualItemsCount = actualContainer.children.length

      if (actualDOMIndex >= actualItemsCount) {
        isAutoScrollingRef.current = false
        return
      }

      const currentItem = actualContainer.children[actualDOMIndex] as HTMLElement
      if (!currentItem) {
        isAutoScrollingRef.current = false
        return
      }

      const listRect = listElement.getBoundingClientRect()
      const itemRect = currentItem.getBoundingClientRect()

      if (listElement.scrollHeight <= listRect.height) {
        isAutoScrollingRef.current = false
        return
      }

      const itemTopRelativeToList = itemRect.top - listRect.top + listElement.scrollTop
      const itemHeight = itemRect.height
      const listHeight = listRect.height

      let targetScrollTop = itemTopRelativeToList - listHeight / 2 + itemHeight / 2

      const maxScrollTop = listElement.scrollHeight - listHeight
      targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop))

      const totalItems = actualItemsCount
      const isNearStart = actualDOMIndex < AUTO_SCROLL_SETTINGS.NEAR_START_ITEMS
      const isNearEnd = actualDOMIndex >= totalItems - AUTO_SCROLL_SETTINGS.NEAR_END_ITEMS

      if (isNearStart) {
        targetScrollTop = Math.max(
          0,
          targetScrollTop - listHeight * AUTO_SCROLL_SETTINGS.VERTICAL_OFFSET_RATIO
        )
      } else if (isNearEnd) {
        targetScrollTop = Math.min(
          maxScrollTop,
          targetScrollTop + listHeight * AUTO_SCROLL_SETTINGS.VERTICAL_OFFSET_RATIO
        )
      }

      const currentScrollTop = listElement.scrollTop
      const scrollDifference = Math.abs(targetScrollTop - currentScrollTop)

      if (scrollDifference > AUTO_SCROLL_SETTINGS.MIN_SCROLL_THRESHOLD) {
        listElement.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        })
      }

      setTimeout(() => {
        isAutoScrollingRef.current = false
      }, AUTO_SCROLL_SETTINGS.COMPLETION_DELAY)
    }, THROTTLE_DELAYS.SCROLL)
  }, [subtitlesLength, getActualDOMIndex, isAutoScrollEnabled, checkDOMReady])

  // 重置用户滚动定时器
  const resetUserScrollTimer = useCallback((): void => {
    if (userScrollTimerRef.current) {
      clearTimeout(userScrollTimerRef.current)
    }

    userScrollTimerRef.current = setTimeout(() => {
      onAutoScrollChange(true)
    }, AUTO_SCROLL_SETTINGS.TIMEOUT)
  }, [onAutoScrollChange])

  // 处理用户滚动事件
  const handleUserScroll = useCallback((): void => {
    if (isAutoScrollingRef.current) {
      return
    }

    if (isAutoScrollEnabled) {
      onAutoScrollChange(false)
    }

    resetUserScrollTimer()
  }, [isAutoScrollEnabled, onAutoScrollChange, resetUserScrollTimer])

  // 手动定位到当前字幕的函数
  const handleCenterCurrentSubtitle = useCallback((): void => {
    if (currentSubtitleIndex >= 0) {
      onAutoScrollChange(true)

      if (userScrollTimerRef.current) {
        clearTimeout(userScrollTimerRef.current)
        userScrollTimerRef.current = null
      }

      scrollToCurrentSubtitle(currentSubtitleIndex)
    }
  }, [currentSubtitleIndex, onAutoScrollChange, scrollToCurrentSubtitle])

  // 监听字幕索引变化并自动滚动
  useEffect(() => {
    if (currentSubtitleIndex >= 0 && isAutoScrollEnabled && subtitlesLength > 0) {
      // 使用双重 requestAnimationFrame 确保 DOM 完全渲染
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToCurrentSubtitle(currentSubtitleIndex)
        })
      })
    }
  }, [currentSubtitleIndex, isAutoScrollEnabled, scrollToCurrentSubtitle, subtitlesLength])

  // 设置滚动事件监听器
  const setupScrollListener = useCallback((): (() => void) | undefined => {
    if (scrollEventListenerRef.current) {
      return undefined // 已经设置过了
    }

    const subtitleListContainer = subtitleListRef.current
    if (!subtitleListContainer) {
      return undefined
    }

    const listElement = subtitleListContainer.querySelector('[class*="subtitleList"]')
    if (!listElement) {
      return undefined
    }

    listElement.addEventListener('scroll', handleUserScroll, { passive: true })
    scrollEventListenerRef.current = true

    // 返回清理函数
    return (): void => {
      listElement.removeEventListener('scroll', handleUserScroll)
      scrollEventListenerRef.current = false
    }
  }, [handleUserScroll])

  // 监听用户滚动事件 - 延迟设置以确保 DOM 准备就绪
  useEffect(() => {
    if (subtitlesLength === 0) {
      return // 没有字幕时不需要设置监听器
    }

    let cleanupFunction: (() => void) | undefined

    // 延迟设置监听器，确保 DOM 已经渲染
    const timeoutId = setTimeout(() => {
      cleanupFunction = setupScrollListener()
    }, 200) // 200ms 延迟

    return (): void => {
      clearTimeout(timeoutId)

      // 调用清理函数（如果存在）
      if (cleanupFunction) {
        cleanupFunction()
      }

      // 清理滚动事件监听器
      if (scrollEventListenerRef.current && subtitleListRef.current) {
        const listElement = subtitleListRef.current.querySelector('[class*="subtitleList"]')
        if (listElement) {
          listElement.removeEventListener('scroll', handleUserScroll)
          scrollEventListenerRef.current = false
        }
      }
    }
  }, [subtitlesLength, setupScrollListener, handleUserScroll])

  // 清理定时器
  useEffect(() => {
    return (): void => {
      if (userScrollTimerRef.current) {
        clearTimeout(userScrollTimerRef.current)
        userScrollTimerRef.current = null
      }
    }
  }, [])

  return {
    subtitleListRef,
    handleUserScroll,
    scrollToCurrentSubtitle,
    handleCenterCurrentSubtitle
  }
}
