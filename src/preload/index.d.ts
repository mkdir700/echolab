import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  RecentPlayItem,
  StoreSettings,
  ApiResponse,
  ApiResponseWithCount,
  VideoUIConfig,
  AppConfig,
  TitleBarOverlayOptions,
  TranscodeOptions,
  VideoInfo
} from '../types/shared'

interface FileSystemAPI {
  checkFileExists: (filePath: string) => Promise<boolean>
  readFile: (filePath: string) => Promise<string | null>
  getFileUrl: (filePath: string) => Promise<string | null>
  getFileInfo: (filePath: string) => Promise<{
    size: number
    mtime: number
    isFile: boolean
    isDirectory: boolean
  } | null>
  validateFile: (
    filePath: string,
    expectedSize?: number,
    expectedMtime?: number
  ) => Promise<boolean>
  openFileDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
  showItemInFolder: (filePath: string) => Promise<boolean>
}

interface DictionaryAPI {
  youdaoRequest: (
    url: string,
    params: Record<string, string>
  ) => Promise<{
    success: boolean
    data?: unknown
    error?: string
  }>
  eudicRequest: (
    url: string,
    options: RequestInit
  ) => Promise<{
    success: boolean
    data?: unknown
    error?: string
    status?: number
  }>
  sha256: (text: string) => Promise<string | null>
  eudicHtmlRequest: (
    word: string,
    context?: string
  ) => Promise<{
    success: boolean
    data?: {
      word: string
      phonetic?: string
      definitions: Array<{
        partOfSpeech?: string
        meaning: string
        examples?: string[]
      }>
      examples?: string[]
      translations?: string[]
    }
    error?: string
  }>
}

interface UpdateAPI {
  checkForUpdates: (options?: { silent: boolean }) => Promise<UpdateInfoResponse>
  downloadUpdate: () => Promise<{
    status: 'downloading' | 'error'
    progress?: {
      percent: number
      bytesPerSecond: number
      total: number
      transferred: number
    }
    error?: string
  }>
  installUpdate: () => Promise<void>
  enableAutoUpdate: (enable: boolean) => Promise<void>
  getAppVersion: () => Promise<string>
  getUpdateSettings: () => Promise<UpdateSettings>
  saveUpdateSettings: (settings: UpdateSettings) => Promise<void>
  setUpdateChannel: (channel: 'stable' | 'beta' | 'alpha') => Promise<void>
}

interface StoreAPI {
  getRecentPlays: () => Promise<RecentPlayItem[]>
  addRecentPlay: (item: Omit<RecentPlayItem, 'fileId' | 'lastOpenedAt'>) => Promise<ApiResponse>
  updateRecentPlay: (
    fileId: string,
    updates: Partial<Omit<RecentPlayItem, 'fileId'>>
  ) => Promise<ApiResponse>
  getRecentPlayByFileId: (fileId: string) => Promise<RecentPlayItem | null>
  getPlaybackSettingsByFileId: (fileId: string) => Promise<VideoPlaybackSettings>
  updatePlaybackSettingsByFileId: (
    fileId: string,
    updates: Partial<VideoPlaybackSettings>
  ) => Promise<ApiResponse>
  removeRecentPlay: (fileId: string) => Promise<ApiResponse>
  clearRecentPlays: () => Promise<ApiResponse>
  getRecentPlayByPath: (filePath: string) => Promise<RecentPlayItem | null>
  getSettings: () => Promise<StoreSettings>
  updateSettings: (settings: Partial<StoreSettings>) => Promise<ApiResponse>
  removeMultipleRecentPlays: (fileIds: string[]) => Promise<ApiResponseWithCount>
  searchRecentPlays: (query: string) => Promise<RecentPlayItem[]>
  getVideoUIConfig: (fileId: string) => Promise<VideoUIConfig>
  updateVideoUIConfig: (fileId: string, config: Partial<VideoUIConfig>) => Promise<ApiResponse>
  // 通用存储方法 - 支持 Zustand persist 中间件
  getRawData: (key: string) => Promise<string | null>
  setRawData: (key: string, value: string) => Promise<ApiResponse>
  removeRawData: (key: string) => Promise<ApiResponse>
}

// 应用配置 API 接口 / Application configuration API interface
interface AppConfigAPI {
  getConfig: () => Promise<AppConfig>
  updateConfig: (updates: Partial<AppConfig>) => Promise<ApiResponse>
  resetConfig: () => Promise<ApiResponse>
  getDefaultDataDirectory: () => Promise<string>
  getTestVideoPath: () => Promise<string>
}

// 窗口控制 API 接口 / Window control API interface
interface WindowAPI {
  setTitleBarOverlay: (overlay: TitleBarOverlayOptions) => Promise<void>
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>
  isAlwaysOnTop: () => Promise<boolean>
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  restart: () => Promise<void>
  getPlatform: () => Promise<string>
  getVersion: () => Promise<string>
  setFullScreen: (fullscreen: boolean) => Promise<void>
  isFullScreen: () => Promise<boolean>
  toggleFullScreen: () => Promise<boolean>
}

// 环境信息 API 接口 / Environment info API interface
interface EnvAPI {
  getNodeEnv: () => string
  isTestEnv: () => boolean
  isDevelopment: () => boolean
}

// FFmpeg API 接口 / FFmpeg API interface
interface FFmpegAPI {
  checkExists: () => Promise<boolean>
  getVersion: () => Promise<string | null>
  download: () => Promise<ApiResponse>
  getVideoInfo: (inputPath: string) => Promise<VideoInfo | null>
  transcode: (
    inputPath: string,
    outputPath?: string,
    options?: TranscodeOptions
  ) => Promise<ApiResponse & { outputPath?: string }>
  getPath: () => Promise<string>
  getDataDirectory: () => Promise<string>
  cancelTranscode: () => Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI & {
      ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
        on: (channel: string, listener: (...args: unknown[]) => void) => void
        removeAllListeners: (channel: string) => void
      }
    }
    api: {
      fileSystem: FileSystemAPI
      dictionary: DictionaryAPI
      store: StoreAPI
      update: UpdateAPI
      appConfig: AppConfigAPI // 应用配置 API / Application configuration API
      window: WindowAPI // 窗口控制 API / Window control API
      env: EnvAPI // 环境信息 API / Environment info API
      ffmpeg: FFmpegAPI // FFmpeg API
      log: (
        level: 'debug' | 'info' | 'warn' | 'error',
        message: string,
        data?: unknown
      ) => Promise<void>
    }
  }
}
