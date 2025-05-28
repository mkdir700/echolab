import { createContext } from 'react'
import type { SubtitleItem } from '@types_/shared'

// * 字幕列表上下文类型
// * 包含字幕数据、显示状态、当前索引以及相关操作方法
export interface SubtitleListContextType {
  // 状态
  subtitles: SubtitleItem[]
  showSubtitles: boolean
  currentSubtitleIndex: number

  // 操作方法
  handleSubtitleUpload: (file: File) => boolean
  toggleSubtitles: () => void
  getCurrentSubtitleIndex: (currentTime: number) => number
  getCurrentSubtitle: (currentTime: number) => SubtitleItem | null
  setAutoScrollEnabled: (enabled: boolean) => void
  setCurrentSubtitleIndex: (index: number) => void
  restoreSubtitles: (subtitles: SubtitleItem[], currentSubtitleIndex: number) => void
}

export const SubtitleListContext = createContext<SubtitleListContextType | null>(null)
