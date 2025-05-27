export interface SubtitleItem {
  startTime: number
  endTime: number
  text: string
  englishText?: string
  chineseText?: string
}

export interface VideoState {
  videoFilePath: string
  videoFileName: string
  currentTime: number
}
