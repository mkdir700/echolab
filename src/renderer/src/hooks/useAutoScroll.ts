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

  // 将字幕索引映射到实际DOM索引的辅助函数
  const getActualDOMIndex = useCallback((subtitleIndex: number): number => {
    if (!subtitleListRef.current || subtitleIndex < 0) return -1

    const listElement = subtitleListRef.current.querySelector('.subtitle-list')
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
      console.log(
        '🎯 scrollToCurrentSubtitle called with index:',
        index,
        'auto scroll enabled:',
        isAutoScrollEnabled
      )

      if (index === -1 || !subtitleListRef.current || subtitlesLength === 0) {
        console.log('❌ Early return: index=-1 or no ref or no subtitles')
        return
      }

      if (!isAutoScrollEnabled) {
        console.log('🔒 Auto scroll disabled at execution time, aborting')
        return
      }

      isAutoScrollingRef.current = true
      console.log('🤖 Starting auto scroll, setting flag to true')

      const actualDOMIndex = getActualDOMIndex(index)
      if (actualDOMIndex === -1) {
        console.log('❌ Could not map to actual DOM index')
        isAutoScrollingRef.current = false
        return
      }

      const listElement = subtitleListRef.current.querySelector('.subtitle-list')
      if (!listElement) {
        console.log('❌ List element not found')
        isAutoScrollingRef.current = false
        return
      }

      const antListContainer = listElement.querySelector('.ant-list-items')
      const actualContainer = antListContainer || listElement
      const actualItemsCount = actualContainer.children.length

      if (actualDOMIndex >= actualItemsCount) {
        console.log('❌ DOM Index out of bounds:', { actualDOMIndex, actualItemsCount })
        isAutoScrollingRef.current = false
        return
      }

      const currentItem = actualContainer.children[actualDOMIndex] as HTMLElement
      if (!currentItem) {
        console.log('❌ Current item not found at DOM index:', actualDOMIndex)
        isAutoScrollingRef.current = false
        return
      }

      const listRect = listElement.getBoundingClientRect()
      const itemRect = currentItem.getBoundingClientRect()

      if (listElement.scrollHeight <= listRect.height) {
        console.log('📏 List is short, no need to scroll')
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
        console.log('🚀 Scrolling to:', targetScrollTop)
        listElement.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        })
      } else {
        console.log('⏸️ No scroll needed, difference too small')
      }

      setTimeout(() => {
        isAutoScrollingRef.current = false
        console.log('🤖 Auto scroll completed, clearing flag')
      }, AUTO_SCROLL_SETTINGS.COMPLETION_DELAY)
    }, THROTTLE_DELAYS.SCROLL)
  }, [subtitlesLength, getActualDOMIndex, isAutoScrollEnabled])

  // 重置用户滚动定时器
  const resetUserScrollTimer = useCallback((): void => {
    if (userScrollTimerRef.current) {
      clearTimeout(userScrollTimerRef.current)
    }

    userScrollTimerRef.current = setTimeout(() => {
      console.log('⏰ 5秒超时，重新启用自动滚动')
      onAutoScrollChange(true)
    }, AUTO_SCROLL_SETTINGS.TIMEOUT)
  }, [onAutoScrollChange])

  // 处理用户滚动事件
  const handleUserScroll = useCallback((): void => {
    if (isAutoScrollingRef.current) {
      console.log('🤖 Ignoring scroll event during auto scroll')
      return
    }

    console.log('👆 User manual scroll detected - current auto scroll state:', isAutoScrollEnabled)

    if (isAutoScrollEnabled) {
      console.log('🔒 Immediately disabling auto scroll due to user interaction')
      onAutoScrollChange(false)
    }

    resetUserScrollTimer()
  }, [isAutoScrollEnabled, onAutoScrollChange, resetUserScrollTimer])

  // 手动定位到当前字幕的函数
  const handleCenterCurrentSubtitle = useCallback((): void => {
    console.log('🎯 Manual center called, currentSubtitleIndex:', currentSubtitleIndex)
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
    if (currentSubtitleIndex >= 0 && isAutoScrollEnabled) {
      console.log('📺 Auto scroll triggered for subtitle index:', currentSubtitleIndex)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToCurrentSubtitle(currentSubtitleIndex)
        })
      })
    } else if (currentSubtitleIndex >= 0 && !isAutoScrollEnabled) {
      console.log('🔒 Auto scroll skipped - disabled by user')
    }
  }, [currentSubtitleIndex, isAutoScrollEnabled, scrollToCurrentSubtitle])

  // 监听用户滚动事件
  useEffect(() => {
    const subtitleListContainer = subtitleListRef.current
    if (!subtitleListContainer) {
      console.log('❌ No subtitle list container found')
      return
    }

    const listElement = subtitleListContainer.querySelector('.subtitle-list')
    if (!listElement) {
      console.log('❌ No .subtitle-list element found')
      return
    }

    console.log('📜 Adding scroll event listener to:', listElement.className)

    listElement.addEventListener('scroll', handleUserScroll, { passive: true })

    return (): void => {
      console.log('📜 Removing scroll event listener')
      listElement.removeEventListener('scroll', handleUserScroll)
    }
  }, [handleUserScroll, subtitlesLength])

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
