import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { readFile, access, constants, stat } from 'fs/promises'
import { createHash } from 'crypto'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // 允许加载本地文件
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      // 启用媒体相关功能
      plugins: true,
      webgl: true,
      // 允许文件访问
      additionalArguments: ['--enable-features=VaapiVideoDecoder', '--disable-web-security']
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // 启用媒体相关的命令行开关
  app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder')
  app.commandLine.appendSwitch('disable-web-security')
  app.commandLine.appendSwitch('allow-file-access-from-files')
  app.commandLine.appendSwitch('enable-local-file-accesses')
  app.commandLine.appendSwitch('disable-site-isolation-trials')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 文件系统相关的 IPC 处理器
  setupFileSystemHandlers()

  // 设置词典服务相关的 IPC 处理器
  setupDictionaryHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 设置文件系统相关的 IPC 处理器
function setupFileSystemHandlers(): void {
  // 检查文件是否存在
  ipcMain.handle('fs:check-file-exists', async (_, filePath: string): Promise<boolean> => {
    try {
      await access(filePath, constants.F_OK)
      return true
    } catch {
      return false
    }
  })

  // 读取文件内容（用于字幕文件）
  ipcMain.handle('fs:read-file', async (_, filePath: string): Promise<string | null> => {
    try {
      const content = await readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      console.error('读取文件失败:', error)
      return null
    }
  })

  // 获取文件的 file:// URL（用于视频文件）
  ipcMain.handle('fs:get-file-url', async (_, filePath: string): Promise<string | null> => {
    try {
      await access(filePath, constants.F_OK)
      // 在 Windows 上需要特殊处理路径
      const normalizedPath = process.platform === 'win32' ? filePath.replace(/\\/g, '/') : filePath
      return `file://${normalizedPath}`
    } catch (error) {
      console.error('获取文件URL失败:', error)
      return null
    }
  })

  // 打开文件选择对话框
  ipcMain.handle('dialog:open-file', async (_, options: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog(options)
    return result
  })

  // 获取文件信息
  ipcMain.handle('fs:get-file-info', async (_, filePath: string) => {
    try {
      const stats = await stat(filePath)
      return {
        size: stats.size,
        mtime: stats.mtime.getTime(),
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      }
    } catch (error) {
      console.error('获取文件信息失败:', error)
      return null
    }
  })

  // 验证文件完整性（通过文件大小和修改时间）
  ipcMain.handle(
    'fs:validate-file',
    async (_, filePath: string, expectedSize?: number, expectedMtime?: number) => {
      try {
        const stats = await stat(filePath)

        if (expectedSize !== undefined && stats.size !== expectedSize) {
          return false
        }

        if (expectedMtime !== undefined && stats.mtime.getTime() !== expectedMtime) {
          return false
        }

        return true
      } catch {
        return false
      }
    }
  )
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 设置词典服务相关的 IPC 处理器
function setupDictionaryHandlers(): void {
  // 有道词典API请求
  ipcMain.handle(
    'dictionary:youdao-request',
    async (_, url: string, params: Record<string, string>) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams(params)
        })

        if (response.ok) {
          const data = await response.json()
          return { success: true, data }
        } else {
          return { success: false, error: '请求失败' }
        }
      } catch (error) {
        console.error('有道词典API请求失败:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : '网络错误'
        }
      }
    }
  )

  // 欧陆词典API请求
  ipcMain.handle('dictionary:eudic-request', async (_, url: string, options: RequestInit) => {
    try {
      const response = await fetch(url, options)

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || response.statusText,
          status: response.status
        }
      }
    } catch (error) {
      console.error('欧陆词典API请求失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  })

  // SHA256哈希计算
  ipcMain.handle('crypto:sha256', async (_, text: string) => {
    try {
      const hash = createHash('sha256')
      hash.update(text)
      return hash.digest('hex')
    } catch (error) {
      console.error('SHA256计算失败:', error)
      return null
    }
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
