import React from 'react'
import { VideoSection } from '@renderer/components/VideoSection/VideoSection'
import { SubtitleControls } from '@renderer/components/SubtitleControls/SubtitleControls'
import { CurrentSubtitleDisplay } from '@renderer/components/CurrentSubtitleDisplay/CurrentSubtitleDisplay'
import { SidebarSection } from '@renderer/components/SidebarSection'
import { HomePageProps } from '@renderer/types'

// 使用React.memo优化HomePage组件
export const HomePage = React.memo<HomePageProps>(function HomePage({
  fileUpload,
  videoPlayer,
  subtitles,
  sidebarResize,
  subtitleDisplayMode,
  subtitleControl,
  autoScroll,
  handleWordHover,
  handlePauseOnHover
}) {
  return (
    <div className="main-container">
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
        onCenterCurrentSubtitle={autoScroll.handleCenterCurrentSubtitle}
      />
    </div>
  )
})
