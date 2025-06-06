// 共享类型定义文件 - 供主进程和渲染进程共同使用

// 导入electron-updater的UpdateInfo类型
import { UpdateInfo } from 'electron-updater'

// 字幕项接口
export interface SubtitleItem {
  startTime: number
  endTime: number
  text: string
  englishText?: string
  chineseText?: string
}

// 背景颜色类型
export type BackgroundType = 'transparent' | 'blur' | 'solid-black' | 'solid-gray'

// 字幕边距配置
export interface SubtitleMargins {
  left: number
  top: number
  right: number
  bottom: number
}

// 掩码框配置
export interface MaskFrame {
  left: number
  top: number
  width: number
  height: number
}

// 字幕显示配置
export interface SubtitleDisplaySettings {
  margins: SubtitleMargins
  backgroundType: BackgroundType
  isMaskMode: boolean
  maskFrame: MaskFrame
}

// 视频级别的播放设置接口
export interface VideoPlaybackSettings {
  displayMode: 'none' | 'original' | 'chinese' | 'english' | 'bilingual' // 字幕显示模式
  volume: number // 音量设置
  playbackRate: number // 播放速度
  isSingleLoop: boolean // 单句循环
  isAutoPause: boolean // 自动暂停
  subtitleDisplay?: SubtitleDisplaySettings // 字幕显示配置
}

// 视频级别的UI配置接口 - Video-level UI configuration interface
export interface VideoUIConfig {
  isSubtitleLayoutLocked: boolean // 字幕布局锁定状态 / Subtitle layout lock state
}

// 播放项接口
export interface RecentPlayItem {
  fileId: string // 文件ID
  filePath: string // 文件路径
  fileName: string // 文件名
  lastOpenedAt: number // 最后打开时间
  duration?: number // 视频时长
  currentTime?: number // 当前播放时间
  subtitleFile?: string // 字幕文件路径
  subtitleItems?: SubtitleItem[] // 字幕数据
  videoPlaybackSettings: VideoPlaybackSettings // 视频级别的播放设置
  videoUIConfig?: VideoUIConfig // 视频级别的UI配置 / Video-level UI configuration
}

// 全局播放设置接口（保持向后兼容）， 和单视频的配置区分开的
// 如果单视频的配置不存在则使用全局配置
export interface GlobalPlaybackSettings {
  displayMode: 'none' | 'original' | 'chinese' | 'english' | 'bilingual' // 字幕显示模式
  volume: number // 音量
  playbackRate: number // 播放速度
  isSingleLoop: boolean // 单句循环
  isAutoPause: boolean // 自动暂停
}

// 更新状态接口
export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  info?: UpdateInfo
  error?: string
  progress?: {
    bytesPerSecond?: number
    percent?: number
    total?: number
    transferred?: number
  }
}

// 更新设置接口
export interface UpdateSettings {
  autoUpdate: boolean // 是否自动检查更新
  lastChecked?: number // 上次检查时间
  updateChannel?: 'stable' | 'beta' | 'alpha' // 更新渠道
}

// 存储设置接口
export interface StoreSettings {
  maxRecentItems: number
  playback: GlobalPlaybackSettings // 播放设置
  update: UpdateSettings // 更新设置
}

// 存储结构接口
export interface StoreSchema {
  recentPlays: RecentPlayItem[]
  settings: StoreSettings
}

// API 响应类型
export interface ApiResponse {
  success: boolean
  error?: string
  fileId?: string
}

export interface ApiResponseWithCount extends ApiResponse {
  removedCount: number
}

// Store API 接口定义
export interface StoreAPI {
  getRecentPlays: () => Promise<RecentPlayItem[]>
  addRecentPlay: (item: Omit<RecentPlayItem, 'id' | 'lastOpenedAt'>) => Promise<ApiResponse>
  updateRecentPlay: (
    id: string,
    updates: Partial<Omit<RecentPlayItem, 'id'>>
  ) => Promise<ApiResponse>
  removeRecentPlay: (id: string) => Promise<ApiResponse>
  clearRecentPlays: () => Promise<ApiResponse>
  getRecentPlayByPath: (filePath: string) => Promise<RecentPlayItem | null>
  getSettings: () => Promise<StoreSettings>
  updateSettings: (settings: Partial<StoreSettings>) => Promise<ApiResponse>
  removeMultipleRecentPlays: (ids: string[]) => Promise<ApiResponseWithCount>
  searchRecentPlays: (query: string) => Promise<RecentPlayItem[]>
}

export interface UpdateInfoResponse {
  status: 'available' | 'not-available' | 'error'
  info?: UpdateInfo
  error?: string
}
