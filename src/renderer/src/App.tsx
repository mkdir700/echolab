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
    console.log('🔍 重新计算字幕长度:', subtitles.subtitles.length)
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

  // 组合视频上传和状态重置
  const handleVideoUpload = useCallback(
    (file: File): boolean => {
      videoPlayer.resetVideoState()
      subtitleControl.resetState()
      return fileUpload.handleVideoUpload(file)
    },
    [fileUpload.handleVideoUpload, videoPlayer.resetVideoState, subtitleControl.resetState]
  )

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
        onVideoUpload={handleVideoUpload}
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
