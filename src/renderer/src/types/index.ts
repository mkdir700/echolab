import { SubtitleItem } from '../utils/subtitleParser'

export interface VideoPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  volume: number
  isVideoLoaded: boolean
  videoError: string | null
}

export interface VideoFileState {
  videoFile: string | null
  videoFileName: string
}

export interface SubtitleState {
  subtitles: SubtitleItem[]
  showSubtitles: boolean
  currentSubtitleIndex: number
  isAutoScrollEnabled: boolean
}

export interface UIState {
  showControls: boolean
  sidebarWidth: number
  isDragging: boolean
}

export interface SubtitleListItemProps {
  item: SubtitleItem
  index: number
  isActive: boolean
  onSeek: (time: number) => void
  formatTime: (time: number) => string
}

export interface VideoControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  volume: number
  isVideoLoaded: boolean
  videoError: string | null
  onPlayPause: () => void
  onSeek: (time: number) => void
  onStepBackward: () => void
  onStepForward: () => void
  onPlaybackRateChange: (rate: number) => void
  onVolumeChange: (volume: number) => void
  formatTime: (time: number) => string
}

export interface VideoPlayerProps {
  videoFile: string | null
  isPlaying: boolean
  volume: number
  playbackRate: number
  onProgress: (progress: { played: number; playedSeconds: number }) => void
  onDuration: (duration: number) => void
  onReady: () => void
  onError: (error: Error | MediaError | string | null) => void
}

export interface SubtitleListProps {
  subtitles: SubtitleItem[]
  currentTime: number
  isAutoScrollEnabled: boolean
  onSeek: (time: number) => void
  onCenterCurrentSubtitle: () => void
  formatTime: (time: number) => string
}

export interface AppHeaderProps {
  videoFileName: string
  isVideoLoaded: boolean
  subtitlesCount: number
  onVideoUpload: (file: File) => boolean
  onSubtitleUpload: (file: File) => boolean
}

export type ThrottledFunction<T extends (...args: never[]) => unknown> = T
