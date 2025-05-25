import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Layout, Typography } from 'antd'

// 导入自定义 Hook
import { useVideoPlayer } from '@renderer/hooks/useVideoPlayer'
import { useSubtitles } from '@renderer/hooks/useSubtitles'
import { useFileUpload } from '@renderer/hooks/useFileUpload'
import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts'
import { useAutoScroll } from '@renderer/hooks/useAutoScroll'
import { useSidebarResize } from '@renderer/hooks/useSidebarResize'
import { useSubtitleDisplayMode } from '@renderer/hooks/useSubtitleDisplayMode'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useAppState } from '@renderer/hooks/useAppState'

// 导入组件
import { AppHeader } from '@renderer/components/AppHeader'
import { HomePage } from '@renderer/components/pages/HomePage'
import { FavoritesPage } from '@renderer/components/pages/FavoritesPage'
import { AboutPage } from '@renderer/components/pages/AboutPage'
import { SettingsPage } from '@renderer/components/pages/SettingsPage'

// 导入类型
import { PageType } from '@renderer/types'

import '@renderer/App.css'

const { Content } = Layout
const { Text } = Typography

function App(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  // 页面状态管理
  const [currentPage, setCurrentPage] = useState<PageType>('home')

  // 状态恢复标志 - 使用 ref 确保只执行一次
  const [isInitialized, setIsInitialized] = useState(false)
  const initializationRef = useRef(false)
  const restorationCompleteRef = useRef(false)

  // 应用状态持久化
  const { saveAppState, restoreAppState, enableAutoSave } = useAppState()

  // 使用自定义 Hooks
  const videoPlayer = useVideoPlayer()
  const subtitles = useSubtitles()
  const fileUpload = useFileUpload()
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
    getSubtitle
  })

  // 自动滚动 Hook
  const autoScroll = useAutoScroll({
    currentSubtitleIndex: currentSubtitleIndexMemo,
    subtitlesLength,
    isAutoScrollEnabled: subtitles.isAutoScrollEnabled,
    onAutoScrollChange: subtitles.setAutoScrollEnabled
  })

  // 应用启动时恢复状态 - 确保只执行一次
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
          console.log('✅ 恢复保存的应用状态')

          // 恢复字幕状态
          if (savedState.subtitles.length > 0) {
            subtitles.restoreSubtitles(
              savedState.subtitles,
              savedState.currentSubtitleIndex,
              savedState.isAutoScrollEnabled
            )
          }

          // 恢复视频状态
          videoPlayer.restoreVideoState(
            savedState.currentTime,
            savedState.playbackRate,
            savedState.volume
          )

          // 恢复字幕显示模式
          subtitleDisplayMode.restoreDisplayMode(savedState.displayMode)

          // 恢复字幕控制状态
          subtitleControl.restoreState(savedState.isSingleLoop, savedState.isAutoPause)

          // 恢复侧边栏宽度
          sidebarResize.restoreSidebarWidth(savedState.sidebarWidth)

          // 恢复视频文件（如果有保存的路径）
          if (savedState.videoFilePath && savedState.videoFileName) {
            const restored = await fileUpload.restoreVideoFile(
              savedState.videoFilePath,
              savedState.videoFileName
            )
            if (!restored) {
              console.warn('⚠️ 无法恢复视频文件，可能文件已被移动或删除')
            }
          }

          // 等待足够长的时间确保所有状态都已恢复
          setTimeout(() => {
            restorationCompleteRef.current = true
            setIsInitialized(true)
            enableAutoSave(true)
            console.log('✅ 应用初始化完成，自动保存已启用')
          }, 1000) // 给状态恢复1秒的时间
        } else {
          console.log('📝 使用默认应用状态')
          // 没有保存状态时立即启用自动保存
          restorationCompleteRef.current = true
          setIsInitialized(true)
          enableAutoSave(true)
          console.log('✅ 应用初始化完成')
        }
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

  // 自动保存应用状态
  useEffect(() => {
    // 如果还没有初始化完成或状态恢复未完成，跳过自动保存
    if (!isInitialized || !restorationCompleteRef.current) {
      return
    }

    // 只有本地文件才保存路径信息
    const shouldSaveVideoPath = fileUpload.isLocalFile && fileUpload.originalFilePath

    // 收集当前状态
    const currentState = {
      // 视频相关 - 只有本地文件才保存路径
      videoFilePath: shouldSaveVideoPath ? fileUpload.originalFilePath : undefined,
      videoFileName: fileUpload.videoFileName,
      currentTime: videoPlayer.currentTime,
      playbackRate: videoPlayer.playbackRate,
      volume: videoPlayer.volume,

      // 字幕相关
      subtitles: subtitles.subtitles,
      currentSubtitleIndex: currentSubtitleIndexMemo,
      isAutoScrollEnabled: subtitles.isAutoScrollEnabled,
      displayMode: subtitleDisplayMode.displayMode,

      // 控制配置
      isSingleLoop: subtitleControl.isSingleLoop,
      isAutoPause: subtitleControl.isAutoPause,

      // UI状态
      sidebarWidth: sidebarResize.sidebarWidth
    }

    // 保存状态（带防抖）
    saveAppState(currentState)
  }, [
    // 初始化状态
    isInitialized,
    // 视频相关
    fileUpload.originalFilePath,
    fileUpload.videoFileName,
    fileUpload.isLocalFile,
    videoPlayer.currentTime,
    videoPlayer.playbackRate,
    videoPlayer.volume,

    // 字幕相关
    subtitles.subtitles,
    currentSubtitleIndexMemo,
    subtitles.isAutoScrollEnabled,
    subtitleDisplayMode.displayMode,

    // 控制配置
    subtitleControl.isSingleLoop,
    subtitleControl.isAutoPause,

    // UI状态
    sidebarResize.sidebarWidth,

    // 依赖
    saveAppState
  ])

  // 同步当前字幕索引
  useEffect(() => {
    if (currentSubtitleIndexMemo !== subtitles.currentSubtitleIndex) {
      subtitles.setCurrentSubtitleIndex(currentSubtitleIndexMemo)
    }
  }, [currentSubtitleIndexMemo, subtitles.currentSubtitleIndex, subtitles.setCurrentSubtitleIndex])

  // 键盘快捷键
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

  // 处理视频文件选择（包含状态重置）
  const handleVideoFileSelect = useCallback(async (): Promise<boolean> => {
    const success = await fileUpload.handleVideoFileSelect()
    if (success) {
      // 重置视频播放器和字幕控制状态
      videoPlayer.resetVideoState()
      subtitleControl.resetState()
    }
    return success
  }, [fileUpload.handleVideoFileSelect, videoPlayer.resetVideoState, subtitleControl.resetState])

  // 处理字幕单词hover时的暂停功能
  const handleWordHover = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_isHovering: boolean) => {
      // 这里可以添加其他hover效果，比如改变视觉状态
      // 暂时不需要处理hover状态，但保留接口用于未来扩展
    },
    []
  )

  const handlePauseOnHover = useCallback(() => {
    if (videoPlayer.isPlaying) {
      videoPlayer.handlePlayPause()
    }
  }, [videoPlayer.isPlaying, videoPlayer.handlePlayPause])

  // 渲染页面内容
  const renderPageContent = (): React.JSX.Element => {
    switch (currentPage) {
      case 'home':
        return (
          <div ref={containerRef}>
            <HomePage
              fileUpload={fileUpload}
              videoPlayer={videoPlayer}
              subtitles={subtitles}
              sidebarResize={sidebarResize}
              subtitleDisplayMode={subtitleDisplayMode}
              subtitleControl={subtitleControl}
              autoScroll={autoScroll}
              handleWordHover={handleWordHover}
              handlePauseOnHover={handlePauseOnHover}
            />
          </div>
        )
      case 'favorites':
        return <FavoritesPage />
      case 'about':
        return <AboutPage />
      case 'settings':
        return <SettingsPage />
      default:
        return (
          <HomePage
            fileUpload={fileUpload}
            videoPlayer={videoPlayer}
            subtitles={subtitles}
            sidebarResize={sidebarResize}
            subtitleDisplayMode={subtitleDisplayMode}
            subtitleControl={subtitleControl}
            autoScroll={autoScroll}
            handleWordHover={handleWordHover}
            handlePauseOnHover={handlePauseOnHover}
          />
        )
    }
  }

  return (
    <Layout className="app-layout">
      <AppHeader
        videoFileName={fileUpload.videoFileName}
        isVideoLoaded={videoPlayer.isVideoLoaded}
        subtitlesCount={subtitlesLength}
        currentPage={currentPage}
        onVideoFileSelect={handleVideoFileSelect}
        onSubtitleUpload={subtitles.handleSubtitleUpload}
        onPageChange={setCurrentPage}
      />

      <Content className="app-content">
        {renderPageContent()}

        {/* 快捷键提示 - 仅在首页显示 */}
        {currentPage === 'home' && (
          <div className="shortcuts-hint">
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              💡 快捷键: 空格-播放/暂停 | ←→-快退/快进 | ↑↓-音量 | Ctrl+M-字幕模式 |
              H/L-上一句/下一句 | R-单句循环 | Ctrl+P-自动暂停
            </Text>
          </div>
        )}
      </Content>
    </Layout>
  )
}

export default App
