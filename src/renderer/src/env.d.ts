/// <reference types="vite/client" />

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

declare global {
  interface Window {
    api: {
      fileSystem: FileSystemAPI
      dictionary: DictionaryAPI
    }
  }
}
