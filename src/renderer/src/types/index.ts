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
  currentPage: PageType
  onPageChange: (page: PageType) => void
}

export type ThrottledFunction<T extends (...args: never[]) => unknown> = T

// 页面类型定义
export type PageType = 'home' | 'play' | 'favorites' | 'about' | 'settings'

export interface NavigationItem {
  key: PageType
  label: string
  icon: React.ReactNode
}

export interface PlayPageProps {
  fileUpload: {
    videoFile: string | null
    videoFileName: string
    handleVideoUpload: (file: File, resetVideoState?: () => void) => boolean
    handleVideoFileSelect: () => Promise<boolean>
    isLocalFile: boolean
    originalFilePath?: string
    restoreVideoFile: (filePath: string, fileName: string) => Promise<boolean>
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
    resetVideoState: () => void
    restoreVideoState: (currentTime: number, playbackRate: number, volume: number) => void
  }
  subtitles: {
    subtitles: SubtitleItem[]
    isAutoScrollEnabled: boolean
    currentSubtitleIndex: number
    getCurrentSubtitle: (time: number) => SubtitleItem | null
    restoreSubtitles: (subtitles: SubtitleItem[], currentIndex: number, autoScroll: boolean) => void
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
  autoScroll: {
    subtitleListRef: React.RefObject<HTMLDivElement | null>
    scrollToCurrentSubtitle: (index: number) => void
    handleCenterCurrentSubtitle: () => void
  }
  onBack: () => void
  onSaveAppState?: (
    partialState: Partial<{
      recentFiles: Array<{
        filePath: string
        fileName: string
        lastOpenedAt: number
        duration?: number
      }>
    }>
  ) => void
  appState?: {
    recentFiles?: Array<{
      filePath: string
      fileName: string
      lastOpenedAt: number
      duration?: number
    }>
  }
}

// 查单词相关类型定义
export type DictionaryEngine = 'eudic' | 'youdao' | 'eudic-html'

export interface DictionarySettings {
  selectedEngine: DictionaryEngine | null
  eudicApiToken: string
  youdaoApiKey: string
  youdaoApiSecret: string
}

export interface DictionaryEngineOption {
  key: DictionaryEngine
  label: string
  description: string
  requiresAuth: boolean
}

// OpenAI 相关类型定义
export type OpenAIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo' | 'gpt-4o' | 'gpt-4o-mini'

export interface OpenAISettings {
  apiKey: string
  selectedModel: OpenAIModel | null
  baseUrl: string
  maxTokens: number
  temperature: number
}

export interface OpenAIModelOption {
  key: OpenAIModel
  label: string
}

// 第三方服务配置类型定义
export interface ThirdPartyServicesSettings {
  openai: OpenAISettings
  dictionary: DictionarySettings
}

// 软件设置类型定义
export interface Settings {
  thirdPartyServices: ThirdPartyServicesSettings
}

// 重新导出共享类型，方便渲染进程使用
export type {
  PlayItem as RecentPlayItem,
  StoreSettings,
  StoreAPI,
  ApiResponse,
  ApiResponseWithCount
} from '@types_/shared'
