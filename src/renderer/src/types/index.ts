import { SubtitleItem } from '@renderer/utils/subtitleParser'
import ReactPlayer from 'react-player'

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
  currentPage: PageType
  onVideoUpload: (file: File) => boolean
  onSubtitleUpload: (file: File) => boolean
  onPageChange: (page: PageType) => void
}

export type ThrottledFunction<T extends (...args: never[]) => unknown> = T

// 页面类型定义
export type PageType = 'home' | 'favorites' | 'about' | 'settings'

export interface NavigationItem {
  key: PageType
  label: string
  icon: React.ReactNode
}

// HomePage 组件的 props 类型
export interface HomePageProps {
  fileUpload: {
    videoFile: string | null
    videoFileName: string
    handleVideoUpload: (file: File) => boolean
  }
  videoPlayer: {
    playerRef: React.RefObject<ReactPlayer | null>
    isPlaying: boolean
    volume: number
    playbackRate: number
    currentTime: number
    duration: number
    isVideoLoaded: boolean
    videoError: string | null
    handleProgress: (progress: { played: number; playedSeconds: number }) => void
    handleVideoDuration: (duration: number) => void
    handleVideoReady: () => void
    handleVideoError: (error: Error | MediaError | string | null) => void
    handleSeek: (time: number) => void
    handleStepBackward: () => void
    handlePlayPause: () => void
    handleStepForward: () => void
    handlePlaybackRateChange: (rate: number) => void
    handleVolumeChange: (volume: number) => void
  }
  subtitles: {
    subtitles: SubtitleItem[]
    isAutoScrollEnabled: boolean
    currentSubtitleIndex: number
    getCurrentSubtitle: (time: number) => SubtitleItem | null
  }
  sidebarResize: {
    sidebarWidth: number
    isDragging: boolean
    handleMouseDown: (e: React.MouseEvent) => void
  }
  subtitleDisplayMode: {
    displayMode: 'none' | 'original' | 'chinese' | 'english' | 'bilingual'
    setDisplayMode: (mode: 'none' | 'original' | 'chinese' | 'english' | 'bilingual') => void
    toggleDisplayMode: () => void
  }
  subtitleControl: {
    isSingleLoop: boolean
    isAutoPause: boolean
    toggleSingleLoop: () => void
    toggleAutoPause: () => void
    goToPreviousSubtitle: () => void
    goToNextSubtitle: () => void
  }
  autoScroll: {
    subtitleListRef: React.RefObject<HTMLDivElement | null>
    scrollToCurrentSubtitle: (index: number) => void
    handleCenterCurrentSubtitle: () => void
  }
  handleWordHover: (isHovering: boolean) => void
  handlePauseOnHover: () => void
}
