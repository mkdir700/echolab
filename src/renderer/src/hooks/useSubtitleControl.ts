import { useState, useCallback, useEffect, useRef } from 'react'
import type { SubtitleItem } from '../types/shared'

interface SubtitleControlState {
  isSingleLoop: boolean // 是否开启单句循环
  isAutoLoop: boolean // 是否开启自动循环
}

interface UseSubtitleControlReturn extends SubtitleControlState {
  toggleSingleLoop: () => void
  toggleAutoLoop: () => void
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
}

export function useSubtitleControl({
  subtitles,
  currentSubtitleIndex,
  currentTime,
  isPlaying,
  isVideoLoaded,
  onSeek
}: UseSubtitleControlParams): UseSubtitleControlReturn {
  const [state, setState] = useState<SubtitleControlState>({
    isSingleLoop: false,
    isAutoLoop: false
  })

  // 用于单句循环的固定字幕索引和字幕对象
  const singleLoopSubtitleRef = useRef<SubtitleItem | null>(null)
  // 标记是否正在执行单句循环跳转，避免无限循环
  const isLoopingRef = useRef<boolean>(false)
  // 记录上次跳转的时间戳，用于去重
  const lastLoopTimeRef = useRef<number>(0)

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

  // 切换自动循环
  const toggleAutoLoop = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      isAutoLoop: !prev.isAutoLoop
    }))
  }, [])

  // 跳转到下一句字幕
  const goToNextSubtitle = useCallback((): void => {
    if (!isVideoLoaded || subtitles.length === 0) return

    const nextIndex = currentSubtitleIndex + 1
    if (nextIndex < subtitles.length) {
      const nextSubtitle = subtitles[nextIndex]
      onSeek(nextSubtitle.startTime)
    } else if (state.isAutoLoop) {
      // 如果开启自动循环，跳转到第一句
      onSeek(subtitles[0].startTime)
    }
  }, [isVideoLoaded, subtitles, currentSubtitleIndex, state.isAutoLoop, onSeek])

  // 跳转到上一句字幕
  const goToPreviousSubtitle = useCallback((): void => {
    if (!isVideoLoaded || subtitles.length === 0) return

    const prevIndex = currentSubtitleIndex - 1
    if (prevIndex >= 0) {
      const prevSubtitle = subtitles[prevIndex]
      onSeek(prevSubtitle.startTime)
    } else if (state.isAutoLoop) {
      // 如果开启自动循环，跳转到最后一句
      onSeek(subtitles[subtitles.length - 1].startTime)
    }
  }, [isVideoLoaded, subtitles, currentSubtitleIndex, state.isAutoLoop, onSeek])

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

  // 处理自动循环逻辑 - 当视频播放到最后一句字幕结束时
  useEffect(() => {
    if (!state.isAutoLoop || !isVideoLoaded || subtitles.length === 0) {
      return
    }

    const lastSubtitle = subtitles[subtitles.length - 1]
    if (!lastSubtitle) return

    // 如果当前时间超过了最后一句字幕的结束时间，且视频正在播放，则跳回第一句
    if (currentTime > lastSubtitle.endTime && isPlaying) {
      onSeek(subtitles[0].startTime)
    }
  }, [state.isAutoLoop, isVideoLoaded, subtitles, currentTime, isPlaying, onSeek])

  return {
    ...state,
    toggleSingleLoop,
    toggleAutoLoop,
    goToNextSubtitle,
    goToPreviousSubtitle
  }
}
