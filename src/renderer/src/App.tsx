import React, { useRef, useCallback, useEffect, useMemo } from 'react'
import { Layout, Typography } from 'antd'

// 导入自定义 Hook
import { useVideoPlayer } from './hooks/useVideoPlayer'
import { useSubtitles } from './hooks/useSubtitles'
import { useFileUpload } from './hooks/useFileUpload'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAutoScroll } from './hooks/useAutoScroll'
import { useSidebarResize } from './hooks/useSidebarResize'

// 导入组件
import { AppHeader } from './components/AppHeader'
import { VideoSection } from './components/VideoSection'
import { SidebarSection } from './components/SidebarSection'

import './App.css'

const { Content } = Layout
const { Text } = Typography

function App(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  // 使用自定义 Hooks
  const videoPlayer = useVideoPlayer()
  const subtitles = useSubtitles()
  const fileUpload = useFileUpload()
  const sidebarResize = useSidebarResize(containerRef)

  // 计算当前字幕索引
  const currentSubtitleIndexMemo = useMemo(() => {
    return subtitles.getCurrentSubtitleIndex(videoPlayer.currentTime)
  }, [subtitles.getCurrentSubtitleIndex, videoPlayer.currentTime])

  // 自动滚动 Hook
  const autoScroll = useAutoScroll({
    currentSubtitleIndex: currentSubtitleIndexMemo,
    subtitlesLength: subtitles.subtitles.length,
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
    onRestart: videoPlayer.handleRestart,
    onToggleSubtitles: subtitles.toggleSubtitles,
    onVolumeChange: videoPlayer.handleVolumeChange,
    currentVolume: videoPlayer.volume
  })

  // 组合视频上传和状态重置
  const handleVideoUpload = useCallback(
    (file: File): boolean => {
      videoPlayer.resetVideoState()
      return fileUpload.handleVideoUpload(file)
    },
    [fileUpload.handleVideoUpload, videoPlayer.resetVideoState]
  )

  return (
    <Layout className="app-layout">
      <AppHeader
        videoFileName={fileUpload.videoFileName}
        isVideoLoaded={videoPlayer.isVideoLoaded}
        subtitlesCount={subtitles.subtitles.length}
        onVideoUpload={handleVideoUpload}
        onSubtitleUpload={subtitles.handleSubtitleUpload}
      />

      <Content className="app-content">
        <div className="main-container" ref={containerRef}>
          {/* 左侧：视频播放区域 */}
          <VideoSection
            sidebarWidth={sidebarResize.sidebarWidth}
            videoFile={fileUpload.videoFile}
            playerRef={videoPlayer.playerRef}
            isPlaying={videoPlayer.isPlaying}
            volume={videoPlayer.volume}
            playbackRate={videoPlayer.playbackRate}
            currentTime={videoPlayer.currentTime}
            duration={videoPlayer.duration}
            isVideoLoaded={videoPlayer.isVideoLoaded}
            videoError={videoPlayer.videoError}
            showSubtitles={subtitles.showSubtitles}
            onProgress={videoPlayer.handleProgress}
            onDuration={videoPlayer.handleVideoDuration}
            onReady={videoPlayer.handleVideoReady}
            onError={videoPlayer.handleVideoError}
            onSeek={videoPlayer.handleSeek}
            onStepBackward={videoPlayer.handleStepBackward}
            onPlayPause={videoPlayer.handlePlayPause}
            onStepForward={videoPlayer.handleStepForward}
            onRestart={videoPlayer.handleRestart}
            onPlaybackRateChange={videoPlayer.handlePlaybackRateChange}
            onVolumeChange={videoPlayer.handleVolumeChange}
            onToggleSubtitles={subtitles.toggleSubtitles}
          />

          {/* 拖拽分割线 */}
          <div
            className={`resize-handle ${sidebarResize.isDragging ? 'dragging' : ''}`}
            onMouseDown={sidebarResize.handleMouseDown}
          />

          {/* 右侧：字幕列表区域 */}
          <SidebarSection
            sidebarWidth={sidebarResize.sidebarWidth}
            subtitles={subtitles.subtitles}
            isAutoScrollEnabled={subtitles.isAutoScrollEnabled}
            currentSubtitleIndex={subtitles.currentSubtitleIndex}
            currentTime={videoPlayer.currentTime}
            subtitleListRef={autoScroll.subtitleListRef}
            onSeek={videoPlayer.handleSeek}
            onScrollToCurrentSubtitle={autoScroll.scrollToCurrentSubtitle}
            onCenterCurrentSubtitle={autoScroll.handleCenterCurrentSubtitle}
          />
        </div>

        {/* 快捷键提示 */}
        <div className="shortcuts-hint">
          <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            💡 快捷键: 空格-播放/暂停 | ←→-快退/快进 | ↑↓-音量 | Ctrl+H-字幕切换
          </Text>
        </div>
      </Content>
    </Layout>
  )
}

export default App
