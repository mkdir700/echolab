import { createContext } from 'react'
import type { SubtitleItem } from '@types_/shared'

// * 字幕列表上下文类型
export interface ISubtitleListContextType {
  // 状态
  subtitles: SubtitleItem[]

  // 操作方法
  handleSubtitleUpload: (file: File) => boolean
  getCurrentSubtitleIndex: (currentTime: number) => number
  getSubtitleIndexForTime: (currentTime: number) => number
  getCurrentSubtitle: (currentTime: number) => SubtitleItem | null
  setAutoScrollEnabled: (enabled: boolean) => void
  setCurrentSubtitleIndex: (index: number) => void
  restoreSubtitles: (subtitles: SubtitleItem[], currentSubtitleIndex: number) => void
}

export const SubtitleListContext = createContext<ISubtitleListContextType | null>(null)
