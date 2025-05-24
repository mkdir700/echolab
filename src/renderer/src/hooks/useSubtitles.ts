import { useState, useCallback } from 'react'
import { message } from 'antd'
import { parseSubtitles } from '../utils/subtitleParser'
import { SubtitleState } from '../types'

interface UseSubtitlesReturn extends SubtitleState {
  handleSubtitleUpload: (file: File) => boolean
  toggleSubtitles: () => void
  getCurrentSubtitleIndex: (currentTime: number) => number
  setAutoScrollEnabled: (enabled: boolean) => void
  setCurrentSubtitleIndex: (index: number) => void
}

export function useSubtitles(): UseSubtitlesReturn {
  const [state, setState] = useState<SubtitleState>({
    subtitles: [],
    showSubtitles: true,
    currentSubtitleIndex: -1,
    isAutoScrollEnabled: true
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

  // 切换字幕显示
  const toggleSubtitles = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      showSubtitles: !prev.showSubtitles
    }))
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

  return {
    ...state,
    handleSubtitleUpload,
    toggleSubtitles,
    getCurrentSubtitleIndex,
    setAutoScrollEnabled,
    setCurrentSubtitleIndex
  }
}
