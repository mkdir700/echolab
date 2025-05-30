import React from 'react'
import { VideoPlayer } from '../VideoPlayer/VideoPlayer'
import { VideoControlsCompact } from '../VideoPlayer/VideoControlsCompact'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useShortcutGroup } from '@renderer/hooks/useComponentShortcuts'
import type { DisplayMode } from '@renderer/types'
import styles from './VideoSection.module.css'

interface VideoSectionProps {
  displayMode: DisplayMode
  isFullscreen: boolean
  onFullscreenChange: (isFullscreen: boolean) => void
  onFullscreenToggleReady: (toggleFn: () => void) => void
  onDisplayModeChange: (mode: DisplayMode) => void
}

export function VideoSection({
  displayMode,
  isFullscreen,
  onFullscreenChange,
  onFullscreenToggleReady,
  onDisplayModeChange
}: VideoSectionProps): React.JSX.Element {
  const videoPlayerContext = useVideoPlayerContext()
  const subtitleListContext = useSubtitleListContext()
  const playingVideoContext = usePlayingVideoContext()

  // 计算当前字幕索引（在这个组件中计算，避免PlayPage重新渲染）
  const currentSubtitleIndex = subtitleListContext.getCurrentSubtitleIndex(
    videoPlayerContext.currentTime
  )

  // 字幕控制 Hook
  const subtitleControl = useSubtitleControl({
    currentSubtitleIndex,
    currentTime: videoPlayerContext.currentTime,
    isPlaying: videoPlayerContext.isPlaying,
    isVideoLoaded: videoPlayerContext.isVideoLoaded,
    onSeek: videoPlayerContext.handleSeek,
    onPause: videoPlayerContext.handlePlayPause
  })

  // 注册组件特定的快捷键
  useShortcutGroup(
    'VideoSection',
    {
      singleLoop: subtitleControl.toggleSingleLoop,
      autoPause: subtitleControl.toggleAutoPause,
      previousSubtitle: subtitleControl.goToPreviousSubtitle,
      nextSubtitle: subtitleControl.goToNextSubtitle
    },
    {
      enabled: videoPlayerContext.isVideoLoaded && !!playingVideoContext.videoFile,
      priority: 10 // 高优先级，确保在视频播放时优先处理
    }
  )

  return (
    <div className={styles.videoSectionContainer}>
      {/* 视频播放区域 */}
      <div className={styles.videoPlayerSection}>
        <VideoPlayer
          videoFile={playingVideoContext.videoFile}
          playerRef={videoPlayerContext.playerRef}
          isPlaying={videoPlayerContext.isPlaying}
          volume={videoPlayerContext.volume}
          playbackRate={videoPlayerContext.playbackRate}
          currentTime={videoPlayerContext.currentTime}
          duration={videoPlayerContext.duration}
          isVideoLoaded={videoPlayerContext.isVideoLoaded}
          videoError={videoPlayerContext.videoError}
          currentSubtitle={subtitleListContext.getCurrentSubtitle(videoPlayerContext.currentTime)}
          displayMode={displayMode}
          onProgress={videoPlayerContext.handleProgress}
          onDuration={videoPlayerContext.handleVideoDuration}
          onReady={videoPlayerContext.handleVideoReady}
          onError={videoPlayerContext.handleVideoError}
          onSeek={videoPlayerContext.handleSeek}
          onStepBackward={videoPlayerContext.handleStepBackward}
          onPlayPause={videoPlayerContext.handlePlayPause}
          onStepForward={videoPlayerContext.handleStepForward}
          onPlaybackRateChange={videoPlayerContext.handlePlaybackRateChange}
          onVolumeChange={videoPlayerContext.handleVolumeChange}
          onFullscreenChange={onFullscreenChange}
          onFullscreenToggleReady={onFullscreenToggleReady}
        />
      </div>

      {/* 视频控制区域 - 仅在非全屏模式下显示 */}
      {playingVideoContext.videoFile && !isFullscreen && (
        <div className={styles.videoControlsSection}>
          <VideoControlsCompact
            duration={videoPlayerContext.duration}
            currentTime={videoPlayerContext.currentTime}
            isVideoLoaded={videoPlayerContext.isVideoLoaded}
            isPlaying={videoPlayerContext.isPlaying}
            videoError={videoPlayerContext.videoError}
            playbackRate={videoPlayerContext.playbackRate}
            volume={videoPlayerContext.volume}
            isLooping={subtitleControl.isSingleLoop}
            autoPause={subtitleControl.isAutoPause}
            autoSkipSilence={false}
            subtitlePosition="bottom"
            displayMode={displayMode}
            onSeek={videoPlayerContext.handleSeek}
            onStepBackward={videoPlayerContext.handleStepBackward}
            onPlayPause={videoPlayerContext.handlePlayPause}
            onStepForward={videoPlayerContext.handleStepForward}
            onPlaybackRateChange={videoPlayerContext.handlePlaybackRateChange}
            onVolumeChange={videoPlayerContext.handleVolumeChange}
            onLoopToggle={subtitleControl.toggleSingleLoop}
            onAutoSkipToggle={subtitleControl.toggleAutoPause}
            onSubtitlePositionToggle={() => {}}
            onFullscreenToggle={() => {}}
            onPreviousSubtitle={subtitleControl.goToPreviousSubtitle}
            onNextSubtitle={subtitleControl.goToNextSubtitle}
            onDisplayModeChange={onDisplayModeChange}
          />
        </div>
      )}
    </div>
  )
}
