import React, { useRef, useCallback, useEffect, useMemo } from 'react'
import { Layout, Typography } from 'antd'

// 导入自定义 Hook
import { useVideoPlayer } from './hooks/useVideoPlayer'
import { useSubtitles } from './hooks/useSubtitles'
import { useFileUpload } from './hooks/useFileUpload'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAutoScroll } from './hooks/useAutoScroll'
import { useSidebarResize } from './hooks/useSidebarResize'
import { useSubtitleDisplayMode } from './hooks/useSubtitleDisplayMode'
import { useSubtitleControl } from './hooks/useSubtitleControl'

// 导入组件
import { AppHeader } from './components/AppHeader'
import { VideoSection } from './components/VideoSection'
import { SubtitleControls } from './components/SubtitleControls'
import { CurrentSubtitleDisplay } from './components/CurrentSubtitleDisplay'
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
  const subtitleDisplayMode = useSubtitleDisplayMode()

  // 计算当前字幕索引
  const currentSubtitleIndexMemo = useMemo(() => {
    return subtitles.getCurrentSubtitleIndex(videoPlayer.currentTime)
  }, [subtitles.getCurrentSubtitleIndex, videoPlayer.currentTime])

  // 字幕控制 Hook
  const subtitleControl = useSubtitleControl({
    subtitles: subtitles.subtitles,
    currentSubtitleIndex: currentSubtitleIndexMemo,
    currentTime: videoPlayer.currentTime,
    isPlaying: videoPlayer.isPlaying,
    isVideoLoaded: videoPlayer.isVideoLoaded,
    onSeek: videoPlayer.handleSeek,
    onPause: videoPlayer.handlePlayPause
  })

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
      return fileUpload.handleVideoUpload(file)
    },
    [fileUpload.handleVideoUpload, videoPlayer.resetVideoState]
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
          <div
            className="left-section"
            style={{ width: `calc(100% - ${sidebarResize.sidebarWidth}px)` }}
          >
            {/* 上部：视频播放区域 */}
            <VideoSection
              videoFile={fileUpload.videoFile}
              playerRef={videoPlayer.playerRef}
              isPlaying={videoPlayer.isPlaying}
              volume={videoPlayer.volume}
              playbackRate={videoPlayer.playbackRate}
              currentTime={videoPlayer.currentTime}
              duration={videoPlayer.duration}
              isVideoLoaded={videoPlayer.isVideoLoaded}
              videoError={videoPlayer.videoError}
              onProgress={videoPlayer.handleProgress}
              onDuration={videoPlayer.handleVideoDuration}
              onReady={videoPlayer.handleVideoReady}
              onError={videoPlayer.handleVideoError}
              onSeek={videoPlayer.handleSeek}
              onStepBackward={videoPlayer.handleStepBackward}
              onPlayPause={videoPlayer.handlePlayPause}
              onStepForward={videoPlayer.handleStepForward}
              onPlaybackRateChange={videoPlayer.handlePlaybackRateChange}
              onVolumeChange={videoPlayer.handleVolumeChange}
            />

            {/* 字幕控制区域 */}
            <SubtitleControls
              isSingleLoop={subtitleControl.isSingleLoop}
              isAutoPause={subtitleControl.isAutoPause}
              isVideoLoaded={videoPlayer.isVideoLoaded}
              subtitlesLength={subtitles.subtitles.length}
              onToggleSingleLoop={subtitleControl.toggleSingleLoop}
              onToggleAutoPause={subtitleControl.toggleAutoPause}
              onGoToPrevious={subtitleControl.goToPreviousSubtitle}
              onGoToNext={subtitleControl.goToNextSubtitle}
            />

            {/* 下部：当前字幕展示区域 */}
            <CurrentSubtitleDisplay
              currentSubtitle={subtitles.getCurrentSubtitle(videoPlayer.currentTime)}
              isPlaying={videoPlayer.isPlaying}
              displayMode={subtitleDisplayMode.displayMode}
              onDisplayModeChange={subtitleDisplayMode.setDisplayMode}
              onToggleDisplayMode={subtitleDisplayMode.toggleDisplayMode}
              onWordHover={handleWordHover}
              onPauseOnHover={handlePauseOnHover}
            />
          </div>

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
            💡 快捷键: 空格-播放/暂停 | ←→-快退/快进 | ↑↓-音量 | Ctrl+M-字幕模式 | H/L-上一句/下一句
            | Ctrl+S-单句循环 | Ctrl+P-自动暂停
          </Text>
        </div>
      </Content>
    </Layout>
  )
}

export default App
