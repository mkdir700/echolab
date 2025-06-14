import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater, UpdateInfo } from 'electron-updater'
import Logger from 'electron-log'
import { Conf } from 'electron-conf/main'
import type { UpdateSettings, UpdateStatus } from '../../types/shared'
import { is } from '@electron-toolkit/utils'
import { getUpdateChannel, getVersionInfo } from '../utils/version-parser'

/**
 * Format bytes to human readable string
 * 将字节数格式化为人类可读的字符串
 *
 * @param bytes - Number of bytes / 字节数
 * @param decimals - Number of decimal places / 小数位数
 * @returns Formatted string / 格式化后的字符串
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Enhanced update info with additional properties
 * 增强的更新信息，包含额外属性
 */
interface EnhancedUpdateInfo extends UpdateInfo {
  updateSize?: number
}

/**
 * Parse version string into components for comparison
 * 解析版本字符串为组件用于比较
 */
interface ParsedVersion {
  major: number
  minor: number
  patch: number
  prerelease?: {
    type: 'alpha' | 'beta' | 'rc' | 'dev' | 'test'
    number?: number
  }
  raw: string
}

function parseVersion(version: string): ParsedVersion | null {
  if (!version) return null

  const cleanVersion = version.replace(/^v/, '').trim()

  // Match semver pattern with prerelease
  const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z]+)(?:\.(\d+))?)?$/)

  if (!match) return null

  const [, major, minor, patch, prereleaseType, prereleaseNumber] = match

  const parsed: ParsedVersion = {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    raw: cleanVersion
  }

  if (prereleaseType) {
    parsed.prerelease = {
      type: prereleaseType as 'alpha' | 'beta' | 'rc' | 'dev' | 'test',
      number: prereleaseNumber ? parseInt(prereleaseNumber, 10) : undefined
    }
  }

  return parsed
}

/**
 * Check if available version is newer than current version
 * 检查可用版本是否比当前版本更新
 * @param current - Current version
 * @param available - Available version
 * @returns true if available > current
 */
function isVersionNewer(current: string, available: string): boolean {
  if (!current || !available) return false

  const currentParsed = parseVersion(current)
  const availableParsed = parseVersion(available)

  if (!currentParsed || !availableParsed) {
    Logger.warn('版本解析失败:', { current, available })
    return false
  }

  // Compare major.minor.patch first
  if (availableParsed.major !== currentParsed.major) {
    return availableParsed.major > currentParsed.major
  }
  if (availableParsed.minor !== currentParsed.minor) {
    return availableParsed.minor > currentParsed.minor
  }
  if (availableParsed.patch !== currentParsed.patch) {
    return availableParsed.patch > currentParsed.patch
  }

  // If base versions are equal, handle prerelease comparison
  const currentHasPrerelease = !!currentParsed.prerelease
  const availableHasPrerelease = !!availableParsed.prerelease

  // Stable version (no prerelease) is always greater than prerelease
  if (!availableHasPrerelease && currentHasPrerelease) {
    return true
  }
  if (availableHasPrerelease && !currentHasPrerelease) {
    return false
  }

  // Both have prerelease or both are stable
  if (!currentHasPrerelease && !availableHasPrerelease) {
    return false // Both are stable and equal
  }

  if (currentHasPrerelease && availableHasPrerelease) {
    // Compare prerelease types: dev < alpha < beta < rc
    const prereleaseOrder = { dev: 1, test: 1, alpha: 2, beta: 3, rc: 4 }
    const currentOrder = prereleaseOrder[currentParsed.prerelease!.type] || 0
    const availableOrder = prereleaseOrder[availableParsed.prerelease!.type] || 0

    if (availableOrder !== currentOrder) {
      return availableOrder > currentOrder
    }

    // Same prerelease type, compare numbers
    const currentNum = currentParsed.prerelease!.number || 0
    const availableNum = availableParsed.prerelease!.number || 0
    return availableNum > currentNum
  }

  return false
}

/**
 * Process and enhance update info from electron-updater
 * 处理和增强来自electron-updater的更新信息
 *
 * @param info - Raw update info from electron-updater / 来自electron-updater的原始更新信息
 * @returns Enhanced update info / 增强后的更新信息
 */
function processUpdateInfo(info: UpdateInfo): EnhancedUpdateInfo {
  // Calculate total update size from files array
  // 从文件数组计算总更新大小
  let totalSize = 0
  if (info.files && Array.isArray(info.files)) {
    totalSize = info.files.reduce((sum, file) => {
      return sum + (file.size || 0)
    }, 0)
  }

  // Process release notes based on type
  // 根据类型处理发布说明
  let processedReleaseNotes: string | undefined

  if (info.releaseNotes) {
    if (typeof info.releaseNotes === 'string') {
      // Already a string, use as-is
      // 已经是字符串，直接使用
      processedReleaseNotes = info.releaseNotes
    } else if (Array.isArray(info.releaseNotes)) {
      // Array of ReleaseNoteInfo, combine into markdown
      // ReleaseNoteInfo数组，合并为markdown
      processedReleaseNotes = info.releaseNotes
        .map((note) => {
          const version = note.version ? `## ${note.version}\n` : ''
          const content = note.note || ''
          return version + content
        })
        .join('\n\n')
    } else {
      // Other types, convert to string
      // 其他类型，转换为字符串
      processedReleaseNotes = String(info.releaseNotes)
    }
  }

  // Return enhanced update info
  // 返回增强后的更新信息
  return {
    ...info,
    releaseNotes: processedReleaseNotes,
    // Add updateSize as a custom property
    // 添加updateSize作为自定义属性
    updateSize: totalSize > 0 ? totalSize : undefined
  } as EnhancedUpdateInfo
}

// 创建更新设置存储
const updateStore = new Conf({
  name: 'echolab-update-settings',
  defaults: {
    updateSettings: {
      autoUpdate: true,
      lastChecked: 0,
      updateChannel: 'stable'
    }
  }
})

// 获取更新设置
function getUpdateSettings(): UpdateSettings {
  return updateStore.get('updateSettings') as UpdateSettings
}

// 保存更新设置
function saveUpdateSettings(settings: Partial<UpdateSettings>): void {
  const currentSettings = getUpdateSettings()
  updateStore.set('updateSettings', { ...currentSettings, ...settings })
}

// 配置日志
Logger.transports.file.level = 'debug'
autoUpdater.logger = Logger

// 自动更新的定时器
let autoUpdateTimer: NodeJS.Timeout | null = null

/**
 * 获取有效的更新渠道
 * Get effective update channel
 *
 * 优先使用用户手动设置的渠道，如果没有设置则使用基于版本自动检测的渠道
 * Prioritize user-set channel, fallback to auto-detected channel based on version
 */
function getEffectiveUpdateChannel(): string {
  const currentVersion = app.getVersion()
  const detectedChannel = getUpdateChannel(currentVersion)
  const settings = getUpdateSettings()

  // 如果用户设置了stable渠道，使用用户设置
  const userChannel = settings.updateChannel
  let effectiveChannel = detectedChannel
  if (userChannel) {
    effectiveChannel = userChannel
  } else {
    effectiveChannel = detectedChannel
  }

  Logger.info('渠道选择逻辑:', {
    currentVersion,
    detectedChannel,
    userSetChannel: userChannel,
    effectiveChannel
  })

  return effectiveChannel
}

/**
 * 配置 autoUpdater 的更新渠道
 * Configure autoUpdater update channel
 *
 * 根据当前版本和用户设置动态设置更新渠道
 * Dynamically set update channel based on current version and user settings
 */
function configureAutoUpdater(): void {
  // 获取有效的更新渠道
  const effectiveChannel = getEffectiveUpdateChannel()

  // 设置 autoUpdater 的渠道
  // electron-updater 会根据这个渠道查找对应的更新文件
  autoUpdater.channel = effectiveChannel

  Logger.info(`AutoUpdater 配置完成:`, {
    channel: effectiveChannel,
    version: app.getVersion()
  })

  // 在生产环境中，electron-updater 会自动使用 GitHub 发布
  // 由于 electron-builder.yml 中设置了 generateUpdatesFilesForAllChannels: true
  // electron-updater 会查找带有对应渠道标签的发布版本
  if (!is.dev) {
    Logger.info(`生产环境: 使用 GitHub 发布，渠道: ${effectiveChannel}`)
  }
}

export function setupUpdateHandlers(mainWindow: BrowserWindow): void {
  // 发送状态到窗口
  function sendStatusToWindow(status: UpdateStatus): void {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', status)
    }
  }

  // 设置 autoUpdater 基础配置
  autoUpdater.autoDownload = false // 禁用自动下载，让用户决定是否下载
  autoUpdater.autoInstallOnAppQuit = false // 禁用自动安装，让用户决定何时安装

  // 配置更新渠道
  configureAutoUpdater()

  // 开发模式下，设置本地更新源
  if (is.dev) {
    const localUpdateUrl = 'http://localhost:8384' // 假设你的本地服务器跑在 8384 端口
    Logger.info(`开发模式：设置更新源为 ${localUpdateUrl}`)

    // 强制在开发模式下启用更新检查
    autoUpdater.forceDevUpdateConfig = true

    autoUpdater.setFeedURL({
      provider: 'generic',
      url: localUpdateUrl,
      // 为了简化初次测试，我们先使用 'latest'，不根据应用内设置的 channel 动态改变
      // 你需要确保本地服务器的 manifest 文件名是 'latest.yml' (或者对应平台的 'latest-mac.yml' 等)
      channel: 'latest'
    })
  }

  // 获取应用版本
  ipcMain.handle('get-app-version', (): string => {
    return app.getVersion()
  })

  // 获取当前版本的更新渠道信息
  ipcMain.handle('get-version-info', () => {
    const currentVersion = app.getVersion()
    const versionInfo = getVersionInfo(currentVersion)

    Logger.info('版本信息:', {
      version: currentVersion,
      detectedChannel: versionInfo.channel,
      isValid: versionInfo.isValid,
      pattern: versionInfo.pattern?.name
    })

    return versionInfo
  })

  // 获取当前版本的自动检测渠道
  ipcMain.handle('get-auto-detected-channel', (): string => {
    const currentVersion = app.getVersion()
    const detectedChannel = getUpdateChannel(currentVersion)

    Logger.info(`自动检测到的更新渠道: ${detectedChannel} (基于版本: ${currentVersion})`)

    return detectedChannel
  })

  // 获取有效的更新渠道（考虑用户设置和自动检测）
  ipcMain.handle('get-effective-update-channel', (): string => {
    return getEffectiveUpdateChannel()
  })

  // 获取更新设置
  ipcMain.handle('get-update-settings', (): UpdateSettings => {
    return getUpdateSettings()
  })

  // 保存更新设置
  ipcMain.handle(
    'save-update-settings',
    (_event, settings: Partial<UpdateSettings>): UpdateSettings => {
      saveUpdateSettings(settings)
      return getUpdateSettings()
    }
  )

  // 检查更新
  ipcMain.handle(
    'check-for-updates',
    async (_event, options: { silent?: boolean } = {}): Promise<UpdateStatus> => {
      try {
        // 保存最后检查时间
        saveUpdateSettings({ lastChecked: Date.now() })

        // 重新配置 autoUpdater 渠道（以防用户在运行时更改了设置）
        // Reconfigure autoUpdater channel (in case user changed settings at runtime)
        configureAutoUpdater()

        // 获取有效的更新渠道用于日志记录
        const effectiveChannel = getEffectiveUpdateChannel()

        Logger.info(`使用更新渠道: ${effectiveChannel}`)

        Logger.info('正在检查更新...')

        // 用户主动检查更新 / User-initiated update check

        // 只有用户主动检查时才发送状态 / Only send status for user-initiated checks
        if (!options.silent) {
          sendStatusToWindow({
            status: 'checking'
          })
        }

        const checkResult = await autoUpdater.checkForUpdates()
        Logger.info('更新检查结果:', checkResult)

        // 检查结果可能为null
        if (!checkResult) {
          throw new Error('更新检查失败，未收到有效响应')
        }

        // 使用更严格的版本比较逻辑
        const currentVersion = app.getVersion()
        const availableVersion = checkResult.updateInfo.version
        const isUpdateAvailable = isVersionNewer(currentVersion, availableVersion)

        Logger.info('版本比较结果:', {
          current: currentVersion,
          available: availableVersion,
          isUpdateAvailable
        })

        if (isUpdateAvailable) {
          // 有可用的更新
          Logger.info('发现新版本:', availableVersion)

          // Process and enhance update info
          // 处理和增强更新信息
          const enhancedInfo = processUpdateInfo(checkResult.updateInfo)

          // 只有用户主动检查时才发送状态 / Only send status for user-initiated checks
          if (!options.silent) {
            sendStatusToWindow({
              status: 'available',
              info: enhancedInfo
            })
          }

          return {
            status: 'available',
            info: enhancedInfo
          }
        } else {
          // 无可用的更新
          Logger.info('当前已是最新版本')

          // Process update info for consistency
          // 为保持一致性处理更新信息
          const enhancedInfo = processUpdateInfo(checkResult.updateInfo)

          // 只有用户主动检查时才发送状态 / Only send status for user-initiated checks
          if (!options.silent) {
            sendStatusToWindow({
              status: 'not-available',
              info: enhancedInfo
            })
          }

          return {
            status: 'not-available',
            info: enhancedInfo
          }
        }
      } catch (error) {
        Logger.error('检查更新时出错:', error)

        // 只有用户主动检查时才发送错误状态 / Only send error status for user-initiated checks
        if (!options.silent) {
          sendStatusToWindow({
            status: 'error',
            error: String(error)
          })
        }

        return {
          status: 'error',
          error: error instanceof Error ? error.message : '未知错误'
        }
      }
    }
  )

  // 下载更新
  ipcMain.handle('download-update', async (): Promise<UpdateStatus> => {
    try {
      sendStatusToWindow({
        status: 'downloading',
        progress: { percent: 0, bytesPerSecond: 0, total: 0, transferred: 0 }
      })

      await autoUpdater.downloadUpdate()

      return {
        status: 'downloaded'
      }
    } catch (error) {
      Logger.error('下载更新失败:', error)
      sendStatusToWindow({
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误'
      })
      return {
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  // 安装更新
  ipcMain.handle('install-update', (): void => {
    autoUpdater.quitAndInstall(false, true)
  })

  // 启用或禁用自动更新
  ipcMain.handle('enable-auto-update', async (_event, enable: boolean): Promise<void> => {
    saveUpdateSettings({ autoUpdate: enable })

    // 清除现有的定时器
    if (autoUpdateTimer) {
      clearInterval(autoUpdateTimer)
      autoUpdateTimer = null
    }

    if (enable) {
      // 启动自动更新检查
      startAutoUpdateSchedule()
    }

    Logger.info(`自动更新已${enable ? '启用' : '禁用'}`)
  })

  // 设置更新渠道
  ipcMain.handle(
    'set-update-channel',
    (_event, channel: 'stable' | 'beta' | 'alpha'): UpdateSettings => {
      saveUpdateSettings({ updateChannel: channel })

      // 重新配置 autoUpdater 以使用新的渠道设置
      // Reconfigure autoUpdater to use the new channel setting
      configureAutoUpdater()

      Logger.info(`更新渠道已设置为: ${channel}`)

      return getUpdateSettings()
    }
  )

  // 启动自动更新检查计划
  function startAutoUpdateSchedule(): void {
    const settings = getUpdateSettings()
    if (!settings.autoUpdate) return

    // 首次启动后5分钟检查一次更新
    setTimeout(
      () => {
        // 在自动检查前重新配置渠道
        configureAutoUpdater()
        // 自动后台检查 / Automatic background check
        autoUpdater.checkForUpdates().catch((err) => {
          Logger.error('自动检查更新失败:', err)
        })
      },
      5 * 60 * 1000
    ) // 5 分钟

    // 之后每4小时检查一次更新
    autoUpdateTimer = setInterval(
      () => {
        const currentSettings = getUpdateSettings()
        if (currentSettings.autoUpdate) {
          // 在自动检查前重新配置渠道
          configureAutoUpdater()
          // 自动后台检查 / Automatic background check
          autoUpdater.checkForUpdates().catch((err) => {
            Logger.error('自动检查更新失败:', err)
          })
        }
      },
      4 * 60 * 60 * 1000
    ) // 4 小时
  }

  // 监听更新事件
  autoUpdater.on('checking-for-update', () => {
    Logger.info('开始检查更新')
    // 取消发送状态到窗口，避免自动弹窗 / Cancel sending status to window to avoid auto-popup
    // if (!isBackgroundCheck) {
    //   sendStatusToWindow({ status: 'checking' })
    // }
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    Logger.info('发现可用更新:', info.version)

    // 详细记录原始更新信息用于调试
    Logger.info('原始更新信息详情:', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseName: info.releaseName,
      releaseNotesPreview: info.releaseNotes
        ? typeof info.releaseNotes === 'string'
          ? info.releaseNotes.substring(0, 200) + '...'
          : `Array with ${info.releaseNotes.length} items`
        : 'No release notes',
      filesCount: info.files?.length || 0,
      downloadUrl: info.files?.[0]?.url || 'Unknown'
    })

    // 验证版本信息一致性
    if (info.releaseName && info.version) {
      const releaseNameVersion = info.releaseName.replace(/^v/, '')
      if (releaseNameVersion !== info.version) {
        Logger.warn('版本信息不一致:', {
          infoVersion: info.version,
          releaseName: info.releaseName,
          releaseNameVersion
        })
      }
    }

    // Process and enhance update info with release notes parsing and file size calculation
    // 处理和增强更新信息，包括发布说明解析和文件大小计算
    const enhancedInfo = processUpdateInfo(info)

    // Log enhanced information for debugging
    // 记录增强信息用于调试
    Logger.info('增强后的更新信息:', {
      version: enhancedInfo.version,
      releaseDate: enhancedInfo.releaseDate,
      updateSize: enhancedInfo.updateSize ? formatBytes(enhancedInfo.updateSize) : 'Unknown',
      releaseNotesLength: enhancedInfo.releaseNotes?.length || 0,
      hasReleaseNotes: !!enhancedInfo.releaseNotes
    })

    // 始终发送状态到窗口以显示红点，但不触发对话框
    // Always send status to window to show red dot, but don't trigger dialog
    // 渲染进程会根据是否为用户主动检查来决定是否显示对话框
    // Renderer process will decide whether to show dialog based on user-initiated check
    sendStatusToWindow({ status: 'available', info: enhancedInfo })
    Logger.info('发现可用更新，已通知渲染进程显示红点')
  })

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    Logger.info('当前为最新版本:', info.version)
    // 取消发送状态到窗口，避免自动弹窗 / Cancel sending status to window to avoid auto-popup
    // if (!isBackgroundCheck) {
    //   sendStatusToWindow({ status: 'not-available', info })
    // }
  })

  autoUpdater.on('download-progress', (progressObj) => {
    Logger.info('下载进度:', `${Math.round(progressObj.percent)}%`)
    // 下载进度总是发送，因为下载是用户主动触发的
    // Always send download progress as download is user-initiated
    sendStatusToWindow({
      status: 'downloading',
      progress: progressObj
    })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    Logger.info('更新下载完成:', info.version)

    // Process and enhance update info for consistency
    // 为保持一致性处理和增强更新信息
    const enhancedInfo = processUpdateInfo(info)

    // 下载完成总是发送，因为下载是用户主动触发的
    // Always send download completion as download is user-initiated
    sendStatusToWindow({ status: 'downloaded', info: enhancedInfo })
  })

  autoUpdater.on('error', (err: Error) => {
    Logger.error('更新错误:', err.message)
    // 取消发送错误状态到窗口，避免自动弹窗 / Cancel sending error status to window to avoid auto-popup
    // if (!isBackgroundCheck) {
    //   sendStatusToWindow({
    //     status: 'error',
    //     error: err.message
    //   })
    // } else {
    //   Logger.info('后台检查更新出错，不触发对话框')
    // }
    Logger.info('更新检查出错，不触发对话框')
  })

  // 应用启动时检查自动更新设置
  const settings = getUpdateSettings()
  if (settings.autoUpdate) {
    startAutoUpdateSchedule()
  }

  Logger.info('更新处理器已初始化')
}
