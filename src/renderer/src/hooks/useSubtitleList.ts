import { useState, useCallback } from 'react'
import { message } from 'antd'
import { parseSubtitles } from '../utils/subtitleParser'
import type { SubtitleItem } from '@types_/shared'

interface SubtitleListState {
  subtitles: SubtitleItem[]
}

interface UseSubtitleListReturn extends SubtitleListState {
  handleSubtitleUpload: (file: File) => boolean
  getCurrentSubtitleIndex: (currentTime: number) => number
  getSubtitleIndexForTime: (currentTime: number) => number
  getCurrentSubtitle: (currentTime: number) => SubtitleItem | null
  setAutoScrollEnabled: (enabled: boolean) => void
  setCurrentSubtitleIndex: (index: number) => void
  restoreSubtitles: (subtitles: SubtitleItem[], currentSubtitleIndex: number) => void
}

export function useSubtitleList(): UseSubtitleListReturn {
  const [state, setState] = useState<SubtitleListState>({
    subtitles: []
  })

  // 字幕文件上传处理
  const handleSubtitleUpload = useCallback((file: File): boolean => {
    const reader = new FileReader()
    reader.onload = (e): void => {
      try {
        const content = e.target?.result as string
        const parsedSubtitles = parseSubtitles(content, file.name)
        setState((prev) => ({
          ...prev,
          subtitles: parsedSubtitles
        }))
        message.success({
          content: `字幕文件 ${file.name} 已导入，共 ${parsedSubtitles.length} 条字幕`
        })
      } catch (error) {
        message.error({
          content: `字幕文件解析失败: ${(error as Error).message}`
        })
      }
    }
    reader.readAsText(file)
    return false
  }, [])

  // 获取当前字幕索引
  const getCurrentSubtitleIndex = useCallback(
    (currentTime: number): number => {
      return state.subtitles.findIndex(
        (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
      )
    },
    [state.subtitles]
  )

  // 获取指定时间点的字幕索引（用于进度条拖动）
  // 如果该时间点没有字幕，返回该时间点后最近的一条字幕索引
  const getSubtitleIndexForTime = useCallback(
    (currentTime: number): number => {
      // 首先尝试找到当前时间点正在播放的字幕
      const activeIndex = state.subtitles.findIndex(
        (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
      )

      if (activeIndex !== -1) {
        return activeIndex
      }

      // 如果没有正在播放的字幕，找到该时间点后最近的一条字幕
      const nextIndex = state.subtitles.findIndex((sub) => sub.startTime > currentTime)

      if (nextIndex !== -1) {
        return nextIndex
      }

      // 如果没有找到后续字幕，返回最后一条字幕的索引
      return state.subtitles.length > 0 ? state.subtitles.length - 1 : -1
    },
    [state.subtitles]
  )

  // 获取当前字幕对象
  const getCurrentSubtitle = useCallback(
    (currentTime: number): SubtitleItem | null => {
      const index = getCurrentSubtitleIndex(currentTime)
      return index >= 0 ? state.subtitles[index] : null
    },
    [getCurrentSubtitleIndex, state.subtitles]
  )

  // 设置自动滚动状态
  const setAutoScrollEnabled = useCallback((enabled: boolean): void => {
    setState((prev) => ({
      ...prev,
      isAutoScrollEnabled: enabled
    }))
  }, [])

  // 设置当前字幕索引
  const setCurrentSubtitleIndex = useCallback((index: number): void => {
    setState((prev) => ({
      ...prev,
      currentSubtitleIndex: index
    }))
  }, [])

  // 恢复字幕状态
  const restoreSubtitles = useCallback(
    (subtitles: SubtitleItem[], currentSubtitleIndex: number): void => {
      console.log('🔄 开始恢复字幕状态:', {
        subtitlesCount: subtitles.length,
        currentSubtitleIndex,
        firstSubtitle: subtitles[0]
      })

      setState({
        subtitles
      })

      console.log('✅ 字幕状态恢复完成')
    },
    []
  )

  return {
    ...state,
    handleSubtitleUpload,
    getCurrentSubtitleIndex,
    getSubtitleIndexForTime,
    getCurrentSubtitle,
    setAutoScrollEnabled,
    setCurrentSubtitleIndex,
    restoreSubtitles
  }
}
