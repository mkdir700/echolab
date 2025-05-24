import { useState, useCallback, useEffect, useRef } from 'react'
import type { SubtitleItem } from '../types/shared'

interface SubtitleControlState {
  isSingleLoop: boolean // 是否开启单句循环
  isAutoPause: boolean // 是否开启自动暂停
}

interface UseSubtitleControlReturn extends SubtitleControlState {
  toggleSingleLoop: () => void
  toggleAutoPause: () => void
  goToNextSubtitle: () => void
  goToPreviousSubtitle: () => void
}

interface UseSubtitleControlParams {
  subtitles: SubtitleItem[]
  currentSubtitleIndex: number
  currentTime: number
  isPlaying: boolean
  isVideoLoaded: boolean
  onSeek: (time: number) => void
  onPause: () => void // 添加暂停回调
}

export function useSubtitleControl({
  subtitles,
  currentSubtitleIndex,
  currentTime,
  isPlaying,
  isVideoLoaded,
  onSeek,
  onPause
}: UseSubtitleControlParams): UseSubtitleControlReturn {
  const [state, setState] = useState<SubtitleControlState>({
    isSingleLoop: false,
    isAutoPause: false
  })

  // 用于单句循环的固定字幕索引和字幕对象
  const singleLoopSubtitleRef = useRef<SubtitleItem | null>(null)
  // 标记是否正在执行单句循环跳转，避免无限循环
  const isLoopingRef = useRef<boolean>(false)
  // 记录上次跳转的时间戳，用于去重
  const lastLoopTimeRef = useRef<number>(0)

  // 用于自动暂停的状态
  const lastSubtitleIndexRef = useRef<number>(-1)
  const shouldPauseRef = useRef<boolean>(false)

  // 切换单句循环
  const toggleSingleLoop = useCallback((): void => {
    setState((prev) => {
      const newSingleLoop = !prev.isSingleLoop
      if (newSingleLoop && currentSubtitleIndex >= 0 && subtitles[currentSubtitleIndex]) {
        // 开启单句循环时，锁定当前字幕对象
        singleLoopSubtitleRef.current = subtitles[currentSubtitleIndex]
        console.log('🔄 开启单句循环，锁定字幕:', {
          index: currentSubtitleIndex,
          text: subtitles[currentSubtitleIndex].text,
          startTime: subtitles[currentSubtitleIndex].startTime,
          endTime: subtitles[currentSubtitleIndex].endTime
        })
      } else if (!newSingleLoop) {
        // 关闭单句循环时，重置相关状态
        singleLoopSubtitleRef.current = null
        isLoopingRef.current = false
        lastLoopTimeRef.current = 0
        console.log('🔄 关闭单句循环')
      }
      return {
        ...prev,
        isSingleLoop: newSingleLoop
      }
    })
  }, [currentSubtitleIndex, subtitles])

  // 切换自动暂停
  const toggleAutoPause = useCallback((): void => {
    setState((prev) => {
      const newAutoPause = !prev.isAutoPause
      if (newAutoPause) {
        console.log('⏸️ 开启自动暂停')
        // 重置自动暂停状态
        lastSubtitleIndexRef.current = currentSubtitleIndex
        shouldPauseRef.current = false
      } else {
        console.log('⏸️ 关闭自动暂停')
        // 清理自动暂停状态
        lastSubtitleIndexRef.current = -1
        shouldPauseRef.current = false
      }
      return {
        ...prev,
        isAutoPause: newAutoPause
      }
    })
  }, [currentSubtitleIndex])

  // 跳转到下一句字幕
  const goToNextSubtitle = useCallback((): void => {
    if (!isVideoLoaded || subtitles.length === 0) return

    const nextIndex = currentSubtitleIndex + 1
    if (nextIndex < subtitles.length) {
      const nextSubtitle = subtitles[nextIndex]
      onSeek(nextSubtitle.startTime)
      // 重置自动暂停状态，因为用户手动切换了字幕
      if (state.isAutoPause) {
        lastSubtitleIndexRef.current = nextIndex
        shouldPauseRef.current = false
      }
    }
  }, [isVideoLoaded, subtitles, currentSubtitleIndex, onSeek, state.isAutoPause])

  // 跳转到上一句字幕
  const goToPreviousSubtitle = useCallback((): void => {
    if (!isVideoLoaded || subtitles.length === 0) return

    const prevIndex = currentSubtitleIndex - 1
    if (prevIndex >= 0) {
      const prevSubtitle = subtitles[prevIndex]
      onSeek(prevSubtitle.startTime)
      // 重置自动暂停状态，因为用户手动切换了字幕
      if (state.isAutoPause) {
        lastSubtitleIndexRef.current = prevIndex
        shouldPauseRef.current = false
      }
    }
  }, [isVideoLoaded, subtitles, currentSubtitleIndex, onSeek, state.isAutoPause])

  // 处理单句循环逻辑
  useEffect(() => {
    if (!state.isSingleLoop || !isVideoLoaded || !isPlaying || !singleLoopSubtitleRef.current) {
      return
    }

    const loopSubtitle = singleLoopSubtitleRef.current

    // 如果当前时间超过了循环字幕的结束时间，则跳回字幕开始
    if (currentTime > loopSubtitle.endTime) {
      // 防止重复触发：检查是否刚刚执行过跳转
      const now = Date.now()
      if (isLoopingRef.current || now - lastLoopTimeRef.current < 500) {
        return
      }

      console.log('🔄 单句循环触发：跳回字幕开始', {
        currentTime,
        endTime: loopSubtitle.endTime,
        startTime: loopSubtitle.startTime,
        text: loopSubtitle.text
      })

      // 设置循环标记，防止重复触发
      isLoopingRef.current = true
      lastLoopTimeRef.current = now

      // 执行跳转
      onSeek(loopSubtitle.startTime)

      // 延迟重置循环标记
      setTimeout(() => {
        isLoopingRef.current = false
      }, 200)
    }
  }, [state.isSingleLoop, isVideoLoaded, isPlaying, currentTime, onSeek])

  // 处理自动暂停逻辑 - 监听字幕索引变化
  useEffect(() => {
    if (!state.isAutoPause || !isVideoLoaded || !isPlaying) {
      return
    }

    const prevIndex = lastSubtitleIndexRef.current

    // 字幕索引发生变化
    if (prevIndex !== currentSubtitleIndex) {
      // 如果从一个有效字幕切换到另一个有效字幕，或者从有效字幕切换到无字幕状态
      if (prevIndex >= 0 && prevIndex < subtitles.length) {
        const prevSubtitle = subtitles[prevIndex]

        // 检查是否已经超过了前一个字幕的结束时间
        if (currentTime >= prevSubtitle.endTime) {
          console.log('⏸️ 自动暂停触发：字幕切换', {
            fromIndex: prevIndex,
            toIndex: currentSubtitleIndex,
            prevSubtitle: prevSubtitle.text,
            currentTime,
            prevEndTime: prevSubtitle.endTime
          })

          // 触发暂停
          shouldPauseRef.current = true
          onPause()
        }
      }

      // 更新记录的索引
      lastSubtitleIndexRef.current = currentSubtitleIndex
    }
  }, [
    state.isAutoPause,
    isVideoLoaded,
    isPlaying,
    currentSubtitleIndex,
    currentTime,
    subtitles,
    onPause
  ])

  // 监听播放状态变化，重置自动暂停标记
  useEffect(() => {
    if (isPlaying && shouldPauseRef.current) {
      // 如果视频重新开始播放，重置自动暂停标记
      shouldPauseRef.current = false
      console.log('⏸️ 视频重新播放，重置自动暂停标记')
    }
  }, [isPlaying])

  return {
    ...state,
    toggleSingleLoop,
    toggleAutoPause,
    goToNextSubtitle,
    goToPreviousSubtitle
  }
}
