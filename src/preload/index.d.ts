import { ElectronAPI } from '@electron-toolkit/preload'
import type { PlayItem, StoreSettings, ApiResponse, ApiResponseWithCount } from '../types/shared'

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

interface StoreAPI {
  getRecentPlays: () => Promise<PlayItem[]>
  addRecentPlay: (item: Omit<PlayItem, 'id' | 'lastOpenedAt'>) => Promise<ApiResponse>
  updateRecentPlay: (id: string, updates: Partial<Omit<PlayItem, 'id'>>) => Promise<ApiResponse>
  removeRecentPlay: (id: string) => Promise<ApiResponse>
  clearRecentPlays: () => Promise<ApiResponse>
  getRecentPlayByPath: (filePath: string) => Promise<PlayItem | null>
  getSettings: () => Promise<StoreSettings>
  updateSettings: (settings: Partial<StoreSettings>) => Promise<ApiResponse>
  removeMultipleRecentPlays: (ids: string[]) => Promise<ApiResponseWithCount>
  searchRecentPlays: (query: string) => Promise<PlayItem[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      fileSystem: FileSystemAPI
      dictionary: DictionaryAPI
      store: StoreAPI
    }
  }
}
