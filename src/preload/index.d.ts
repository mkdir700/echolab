import { ElectronAPI } from '@electron-toolkit/preload'

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

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      fileSystem: FileSystemAPI
    }
  }
}
