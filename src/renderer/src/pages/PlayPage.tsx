import React, { useState, useCallback } from 'react'
import { VideoPlayer } from '@renderer/components/VideoPlayer/VideoPlayer'
import { VideoControlsCompact } from '@renderer/components/VideoPlayer/VideoControlsCompact'
import { SidebarSection } from '@renderer/components/SidebarSection'
import { PlayPageHeader } from '@renderer/components/PlayPageHeader'
import { SubtitleLoadModal } from '@renderer/components/SubtitleLoadModal'
import { PlayPageProps } from '@renderer/types'
import type { SubtitleItem } from '@renderer/types/shared'
import styles from './PlayPage.module.css'

export const PlayPage = React.memo<PlayPageProps>(function PlayPage({
  fileUpload,
  videoPlayer,
  subtitles,
  sidebarResize,
  subtitleDisplayMode,
  autoScroll,
  onBack
}) {
  // 全屏状态管理
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenToggle, setFullscreenToggle] = useState<(() => void) | null>(null)

  // 字幕检查Modal状态
  const [showSubtitleModal, setShowSubtitleModal] = useState(false)
  const [pendingVideoInfo, setPendingVideoInfo] = useState<{
    filePath: string
    fileName: string
  } | null>(null)

  // 处理全屏切换函数准备就绪
  const handleFullscreenToggleReady = (toggleFn: () => void): void => {
    setFullscreenToggle(() => toggleFn)
  }

  // 全屏切换处理函数
  const handleFullscreenToggle = (): void => {
    if (fullscreenToggle) {
      fullscreenToggle()
    }
  }

  // 处理字幕Modal的回调
  const handleSubtitleModalCancel = useCallback(() => {
    setShowSubtitleModal(false)
    setPendingVideoInfo(null)
  }, [])

  const handleSubtitleModalSkip = useCallback(() => {
    setShowSubtitleModal(false)
    setPendingVideoInfo(null)
  }, [])

  const handleSubtitlesLoaded = useCallback(
    (loadedSubtitles: SubtitleItem[]) => {
      // 加载字幕到应用状态
      subtitles.restoreSubtitles(loadedSubtitles, 0, true)
      setShowSubtitleModal(false)
      setPendingVideoInfo(null)
    },
    [subtitles]
  )

  return (
    <div className={styles.playPageContainer}>
      {/* 播放页面独立Header */}
      <PlayPageHeader videoFileName={fileUpload.videoFileName} onBack={onBack} />

      <div className={styles.playPageContent}>
        <div
          className={styles.mainContentArea}
          style={{ width: `calc(100% - ${sidebarResize.sidebarWidth}px)` }}
        >
          {/* 视频播放区域 - 占据主要空间 */}
          <div className={styles.videoPlayerSection}>
            <VideoPlayer
              videoFile={fileUpload.videoFile}
              playerRef={videoPlayer.playerRef}
              isPlaying={videoPlayer.isPlaying}
              volume={videoPlayer.volume}
              playbackRate={videoPlayer.playbackRate}
              currentTime={videoPlayer.currentTime}
              duration={videoPlayer.duration}
              isVideoLoaded={videoPlayer.isVideoLoaded}
              videoError={videoPlayer.videoError}
              currentSubtitle={subtitles.getCurrentSubtitle(videoPlayer.currentTime)}
              displayMode={subtitleDisplayMode.displayMode}
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
              onFullscreenChange={setIsFullscreen}
              onFullscreenToggleReady={handleFullscreenToggleReady}
            />
          </div>

          {/* 视频控制区域 - 仅在非全屏模式下显示 */}
          {fileUpload.videoFile && !isFullscreen && (
            <div className={styles.videoControlsSection}>
              <VideoControlsCompact
                duration={videoPlayer.duration}
                currentTime={videoPlayer.currentTime}
                isVideoLoaded={videoPlayer.isVideoLoaded}
                isPlaying={videoPlayer.isPlaying}
                videoError={videoPlayer.videoError}
                playbackRate={videoPlayer.playbackRate}
                volume={videoPlayer.volume}
                isLooping={false}
                autoSkipSilence={false}
                subtitlePosition="bottom"
                displayMode={subtitleDisplayMode.displayMode}
                onSeek={videoPlayer.handleSeek}
                onStepBackward={videoPlayer.handleStepBackward}
                onPlayPause={videoPlayer.handlePlayPause}
                onStepForward={videoPlayer.handleStepForward}
                onPlaybackRateChange={videoPlayer.handlePlaybackRateChange}
                onVolumeChange={videoPlayer.handleVolumeChange}
                onLoopToggle={() => {}}
                onAutoSkipToggle={() => {}}
                onSubtitlePositionToggle={() => {}}
                onFullscreenToggle={handleFullscreenToggle}
                onPreviousSubtitle={() => {}}
                onNextSubtitle={() => {}}
                onDisplayModeChange={subtitleDisplayMode.setDisplayMode}
              />
            </div>
          )}
        </div>

        {/* 分割线 - 更细更现代 */}
        <div
          className={`${styles.resizeHandle} ${sidebarResize.isDragging ? styles.dragging : ''}`}
          onMouseDown={sidebarResize.handleMouseDown}
        />

        {/* 字幕列表区域 - 无缝集成 */}
        <div className={styles.sidebarSection} style={{ width: `${sidebarResize.sidebarWidth}px` }}>
          <SidebarSection
            subtitles={subtitles.subtitles}
            isAutoScrollEnabled={subtitles.isAutoScrollEnabled}
            currentSubtitleIndex={subtitles.currentSubtitleIndex}
            currentTime={videoPlayer.currentTime}
            subtitleListRef={autoScroll.subtitleListRef}
            onSeek={videoPlayer.handleSeek}
            onCenterCurrentSubtitle={autoScroll.handleCenterCurrentSubtitle}
          />
        </div>
      </div>

      {/* 字幕检查Modal - 移入PlayPage */}
      <SubtitleLoadModal
        visible={showSubtitleModal}
        videoFilePath={pendingVideoInfo?.filePath || ''}
        onCancel={handleSubtitleModalCancel}
        onSkip={handleSubtitleModalSkip}
        onSubtitlesLoaded={handleSubtitlesLoaded}
      />
    </div>
  )
})
