import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Layout } from 'antd'

// 导入自定义 Hook
import { useVideoPlayer } from '@renderer/hooks/useVideoPlayer'
import { useSubtitles } from '@renderer/hooks/useSubtitles'
import { useFileUpload } from '@renderer/hooks/useFileUpload'
import { useRecentFiles } from '@renderer/hooks/useRecentFiles'

import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts'
import { useAutoScroll } from '@renderer/hooks/useAutoScroll'
import { useSidebarResize } from '@renderer/hooks/useSidebarResize'
import { useSubtitleDisplayMode } from '@renderer/hooks/useSubtitleDisplayMode'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useAppState } from '@renderer/hooks/useAppState'

// 导入组件
import { AppHeader } from '@renderer/components/AppHeader'
import { HomePage } from '@renderer/pages/HomePage'
import { PlayPage } from '@renderer/pages/PlayPage'
import { FavoritesPage } from '@renderer/pages/FavoritesPage'
import { AboutPage } from '@renderer/pages/AboutPage'
import { SettingsPage } from '@renderer/pages/SettingsPage'

import { ShortcutProvider } from '@renderer/contexts/ShortcutContext'

// 导入类型
import { PageType } from '@renderer/types'

// 导入样式
import styles from './App.module.css'

// 导入性能监控工具
import { performanceMonitor } from '@renderer/utils/performance'

const { Content } = Layout

// 快捷键处理组件 - 必须在 ShortcutProvider 内部
function KeyboardShortcutHandler({
  videoPlayer,
  subtitleDisplayMode,
  subtitleControl
}: {
  videoPlayer: ReturnType<typeof useVideoPlayer>
  subtitleDisplayMode: ReturnType<typeof useSubtitleDisplayMode>
  subtitleControl: ReturnType<typeof useSubtitleControl>
}): null {
  useKeyboardShortcuts({
    onPlayPause: videoPlayer.handlePlayPause,
    onStepBackward: videoPlayer.handleStepBackward,
    onStepForward: videoPlayer.handleStepForward,
    onToggleSubtitleMode: subtitleDisplayMode.toggleDisplayMode,
    onVolumeChange: videoPlayer.handleVolumeChange,
    currentVolume: videoPlayer.volume,
    onToggleSingleLoop: subtitleControl.toggleSingleLoop,
    onToggleAutoPause: subtitleControl.toggleAutoPause,
    onGoToPreviousSubtitle: subtitleControl.goToPreviousSubtitle,
    onGoToNextSubtitle: subtitleControl.goToNextSubtitle
  })
  return null
}

function App(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  // 页面状态管理
  const [currentPage, setCurrentPage] = useState<PageType>('home')

  // 状态恢复标志 - 使用 ref 确保只执行一次
  const [isInitialized, setIsInitialized] = useState(false)
  const initializationRef = useRef(false)
  const restorationCompleteRef = useRef(false)

  // 应用状态持久化
  const { appState, saveAppState, restoreAppState, enableAutoSave } = useAppState()

  // 使用自定义 Hooks
  const videoPlayer = useVideoPlayer()
  const subtitles = useSubtitles()
  const fileUpload = useFileUpload()
  const recentFiles = useRecentFiles()
  const sidebarResize = useSidebarResize(containerRef)
  const subtitleDisplayMode = useSubtitleDisplayMode()

  // 计算当前字幕索引
  const currentSubtitleIndexMemo = useMemo(() => {
    return subtitles.getCurrentSubtitleIndex(videoPlayer.currentTime)
  }, [subtitles.getCurrentSubtitleIndex, videoPlayer.currentTime])

  // 缓存字幕长度，避免频繁重新计算
  const subtitlesLength = useMemo(() => {
    return subtitles.subtitles.length
  }, [subtitles.subtitles.length])

  // 缓存获取字幕的函数，避免频繁重新创建
  const getSubtitle = useCallback(
    (index: number) => {
      return subtitles.subtitles[index]
    },
    [subtitles.subtitles]
  )

  // 字幕控制 Hook - 优化：只传递必要的数据，避免大数组传递
  const subtitleControl = useSubtitleControl({
    subtitlesLength,
    currentSubtitleIndex: currentSubtitleIndexMemo,
    currentTime: videoPlayer.currentTime,
    isPlaying: videoPlayer.isPlaying,
    isVideoLoaded: videoPlayer.isVideoLoaded,
    onSeek: videoPlayer.handleSeek,
    onPause: videoPlayer.handlePlayPause,
    // 传递获取字幕的函数而不是整个数组
    getSubtitle,
    // 传递获取所有字幕的函数，用于时间查找
    getAllSubtitles: () => subtitles.subtitles
  })

  // 自动滚动 Hook
  const autoScroll = useAutoScroll({
    currentSubtitleIndex: currentSubtitleIndexMemo,
    subtitlesLength,
    isAutoScrollEnabled: subtitles.isAutoScrollEnabled,
    onAutoScrollChange: subtitles.setAutoScrollEnabled
  })

  // 应用启动时初始化 - 不自动恢复视频数据
  useEffect(() => {
    // 防止重复执行
    if (initializationRef.current) {
      return
    }

    initializationRef.current = true
    console.log('🚀 开始应用初始化')

    const initializeApp = async (): Promise<void> => {
      try {
        const savedState = await restoreAppState()
        if (savedState) {
          console.log('✅ 恢复保存的应用状态（不包括视频数据）')

          // 只恢复UI相关的状态，不恢复视频和字幕数据
          // 恢复侧边栏宽度
          sidebarResize.restoreSidebarWidth(savedState.sidebarWidth)

          // 恢复字幕显示模式
          subtitleDisplayMode.restoreDisplayMode(savedState.displayMode)

          // 恢复字幕控制状态
          subtitleControl.restoreState(savedState.isSingleLoop, savedState.isAutoPause)

          // 恢复视频播放器的基础设置（音量、播放速度）
          videoPlayer.restoreVideoState(
            0, // 不恢复播放时间，从头开始
            savedState.playbackRate,
            savedState.volume
          )
        } else {
          console.log('📝 使用默认应用状态')
        }

        // 立即启用自动保存
        restorationCompleteRef.current = true
        setIsInitialized(true)
        enableAutoSave(true)
        console.log('✅ 应用初始化完成，自动保存已启用')
      } catch (error) {
        console.error('❌ 应用初始化失败:', error)
        // 出错时也要启用自动保存
        restorationCompleteRef.current = true
        setIsInitialized(true)
        enableAutoSave(true)
      }
    }

    initializeApp()
  }, []) // 空依赖数组，确保只执行一次

  // 自动保存应用状态 - 优化版本
  const saveStateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 防抖保存函数
  const debouncedSaveState = useCallback(() => {
    if (saveStateTimeoutRef.current) {
      clearTimeout(saveStateTimeoutRef.current)
    }

    saveStateTimeoutRef.current = setTimeout(() => {
      // 如果还没有初始化完成或状态恢复未完成，跳过自动保存
      if (!isInitialized || !restorationCompleteRef.current) {
        return
      }

      // 只有在播放页面且有视频文件时才保存视频相关数据
      const isInPlayPage = currentPage === 'play'
      const hasVideoFile = fileUpload.isLocalFile && fileUpload.originalFilePath

      // 收集当前状态
      const currentState = {
        // 视频相关 - 只有在播放页面且有本地文件时才保存
        videoFilePath: isInPlayPage && hasVideoFile ? fileUpload.originalFilePath : undefined,
        videoFileName: isInPlayPage && hasVideoFile ? fileUpload.videoFileName : '',
        currentTime: isInPlayPage && hasVideoFile ? videoPlayer.currentTime : 0,
        playbackRate: videoPlayer.playbackRate,
        volume: videoPlayer.volume,

        // 字幕相关 - 只有在播放页面时才保存
        subtitles: isInPlayPage ? subtitles.subtitles : [],
        currentSubtitleIndex: isInPlayPage ? currentSubtitleIndexMemo : 0,
        isAutoScrollEnabled: isInPlayPage ? subtitles.isAutoScrollEnabled : true,
        displayMode: subtitleDisplayMode.displayMode,

        // 控制配置
        isSingleLoop: subtitleControl.isSingleLoop,
        isAutoPause: subtitleControl.isAutoPause,

        // UI状态
        sidebarWidth: sidebarResize.sidebarWidth
      }

      // 保存状态（带防抖）
      saveAppState(currentState)
    }, 2000) // 2秒防抖，减少保存频率
  }, [
    isInitialized,
    currentPage,
    fileUpload.originalFilePath,
    fileUpload.videoFileName,
    fileUpload.isLocalFile,
    videoPlayer.playbackRate,
    videoPlayer.volume,
    subtitles.subtitles,
    currentSubtitleIndexMemo,
    subtitles.isAutoScrollEnabled,
    subtitleDisplayMode.displayMode,
    subtitleControl.isSingleLoop,
    subtitleControl.isAutoPause,
    sidebarResize.sidebarWidth,
    saveAppState
  ])

  // 监听关键状态变化，触发防抖保存
  useEffect(() => {
    debouncedSaveState()
  }, [
    currentPage, // 页面切换时立即保存
    fileUpload.originalFilePath,
    subtitles.subtitles,
    subtitleDisplayMode.displayMode,
    debouncedSaveState
  ])

  // 单独处理视频时间的保存 - 降低频率
  useEffect(() => {
    if (currentPage === 'play' && videoPlayer.isVideoLoaded) {
      debouncedSaveState()
    }
  }, [
    Math.floor(videoPlayer.currentTime / 5),
    currentPage,
    videoPlayer.isVideoLoaded,
    debouncedSaveState
  ]) // 每5秒保存一次时间

  // 同步当前字幕索引
  useEffect(() => {
    if (currentSubtitleIndexMemo !== subtitles.currentSubtitleIndex) {
      subtitles.setCurrentSubtitleIndex(currentSubtitleIndexMemo)
    }
  }, [currentSubtitleIndexMemo, subtitles.currentSubtitleIndex, subtitles.setCurrentSubtitleIndex])

  // 处理视频文件选择（包含状态重置）
  const handleVideoFileSelect = useCallback(async (): Promise<boolean> => {
    const success = await fileUpload.handleVideoFileSelect(videoPlayer.resetVideoState)
    if (success) {
      // 重置字幕控制状态
      subtitleControl.resetState()

      // 直接进入播放页面
      setCurrentPage('play')

      // 添加到最近文件列表
      const updatedRecentFiles = recentFiles.addRecentFile(
        fileUpload.originalFilePath || '',
        fileUpload.videoFileName,
        videoPlayer.duration,
        appState.recentFiles || []
      )
      saveAppState({ recentFiles: updatedRecentFiles })
    }
    return success
  }, [
    fileUpload.handleVideoFileSelect,
    fileUpload.originalFilePath,
    fileUpload.videoFileName,
    videoPlayer.resetVideoState,
    videoPlayer.duration,
    subtitleControl.resetState,
    recentFiles.addRecentFile,
    saveAppState,
    appState.recentFiles
  ])

  // 处理打开最近文件 - 恢复该文件的缓存数据
  const handleOpenRecentFile = useCallback(
    async (filePath: string, fileName: string): Promise<boolean> => {
      const success = await recentFiles.openRecentFile(
        filePath,
        fileName,
        fileUpload.restoreVideoFile
      )
      if (success) {
        // 尝试恢复该文件的缓存数据
        try {
          const savedState = await restoreAppState()
          if (savedState && savedState.videoFilePath === filePath) {
            console.log('✅ 恢复该视频文件的缓存数据')

            // 恢复字幕状态
            if (savedState.subtitles.length > 0) {
              subtitles.restoreSubtitles(
                savedState.subtitles,
                savedState.currentSubtitleIndex,
                savedState.isAutoScrollEnabled
              )
            }

            // 恢复视频播放时间
            videoPlayer.restoreVideoState(
              savedState.currentTime,
              savedState.playbackRate,
              savedState.volume
            )
          } else {
            console.log('📝 该文件没有缓存数据，使用默认状态')
            // 重置字幕控制状态
            subtitleControl.resetState()
          }
        } catch (error) {
          console.warn('⚠️ 恢复缓存数据失败:', error)
          // 重置字幕控制状态
          subtitleControl.resetState()
        }

        // 更新最近文件列表（移到最前面）
        const updatedRecentFiles = recentFiles.addRecentFile(
          filePath,
          fileName,
          videoPlayer.duration,
          appState.recentFiles || []
        )
        saveAppState({ recentFiles: updatedRecentFiles })
        // 切换到播放页面
        setCurrentPage('play')
      }
      return success
    },
    [
      recentFiles.openRecentFile,
      recentFiles.addRecentFile,
      fileUpload.restoreVideoFile,
      subtitleControl.resetState,
      subtitles.restoreSubtitles,
      videoPlayer.restoreVideoState,
      videoPlayer.duration,
      restoreAppState,
      saveAppState,
      appState.recentFiles
    ]
  )

  // 处理移除最近文件
  const handleRemoveRecentFile = useCallback(
    (filePath: string) => {
      // 从应用状态获取当前的最近文件列表
      const currentRecentFiles = appState?.recentFiles || []
      const updatedRecentFiles = recentFiles.removeRecentFile(filePath, currentRecentFiles)
      saveAppState({ recentFiles: updatedRecentFiles })
    },
    [recentFiles.removeRecentFile, saveAppState, appState]
  )

  // 处理清空最近文件列表
  const handleClearRecentFiles = useCallback(() => {
    const updatedRecentFiles = recentFiles.clearRecentFiles()
    saveAppState({ recentFiles: updatedRecentFiles })
  }, [recentFiles.clearRecentFiles, saveAppState])

  // 稳定的返回主页回调函数
  const handleBackToHome = useCallback(() => {
    setCurrentPage('home')
    // 在下一个渲染周期结束性能测量
    requestAnimationFrame(() => {
      performanceMonitor.end('page-transition-to-home')
    })
  }, [])

  // 渲染页面内容 - 使用冻结模式，播放页面始终保持挂载
  const renderPageContent = useMemo((): React.JSX.Element => {
    return (
      <>
        {/* 主页 */}
        {currentPage === 'home' && (
          <div className={styles.pageContainer}>
            <HomePage
              recentFiles={appState.recentFiles || []}
              onVideoFileSelect={handleVideoFileSelect}
              onOpenRecentFile={handleOpenRecentFile}
              onRemoveRecentFile={handleRemoveRecentFile}
              onClearRecentFiles={handleClearRecentFiles}
            />
          </div>
        )}

        {/* 播放页面 - 始终挂载，通过 display 控制显示 */}
        <div
          ref={containerRef}
          className={styles.pageContainer}
          style={{
            display: currentPage === 'play' ? 'block' : 'none'
          }}
        >
          {/* 只有在播放页面时才渲染PlayPage组件 */}
          {(currentPage === 'play' || fileUpload.videoFile) && (
            <PlayPage
              fileUpload={fileUpload}
              videoPlayer={videoPlayer}
              subtitles={subtitles}
              sidebarResize={sidebarResize}
              subtitleDisplayMode={subtitleDisplayMode}
              autoScroll={autoScroll}
              onBack={handleBackToHome}
            />
          )}
        </div>

        {/* 其他页面 - 条件渲染，覆盖在播放页面之上 */}
        {currentPage === 'favorites' && (
          <div className={`${styles.pageContainer} ${styles.otherPage}`}>
            <FavoritesPage />
          </div>
        )}
        {currentPage === 'about' && (
          <div className={`${styles.pageContainer} ${styles.otherPage}`}>
            <AboutPage />
          </div>
        )}
        {currentPage === 'settings' && (
          <div className={`${styles.pageContainer} ${styles.otherPage}`}>
            <SettingsPage />
          </div>
        )}
      </>
    )
  }, [
    currentPage,
    appState.recentFiles,
    fileUpload,
    videoPlayer,
    subtitles,
    sidebarResize,
    subtitleDisplayMode,
    autoScroll,
    handleVideoFileSelect,
    handleOpenRecentFile,
    handleRemoveRecentFile,
    handleClearRecentFiles,
    handleBackToHome
  ])

  return (
    <ShortcutProvider>
      {/* 快捷键处理 - 必须在 Provider 内部 */}
      <KeyboardShortcutHandler
        videoPlayer={videoPlayer}
        subtitleDisplayMode={subtitleDisplayMode}
        subtitleControl={subtitleControl}
      />

      {currentPage === 'play' ? (
        // 播放页面 - 全屏布局，不显示全局header
        <div className={styles.playPageFullscreen}>{renderPageContent}</div>
      ) : (
        // 其他页面 - 标准布局，显示全局header
        <Layout className={styles.appLayout}>
          <AppHeader currentPage={currentPage} onPageChange={setCurrentPage} />

          <Content className={styles.appContent}>{renderPageContent}</Content>
        </Layout>
      )}
    </ShortcutProvider>
  )
}

export default App
