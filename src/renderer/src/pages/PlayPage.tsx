import React, { useState, useCallback, useRef, useEffect } from 'react'
import { VideoPlayer } from '@renderer/components/VideoPlayer/VideoPlayer'
import { VideoControlsCompact } from '@renderer/components/VideoPlayer/VideoControlsCompact'
import { SidebarSection } from '@renderer/components/SidebarSection'
import { PlayPageHeader } from '@renderer/components/PlayPageHeader'
import { SubtitleLoadModal } from '@renderer/components/SubtitleLoadModal'

// 导入所需的 hooks
import { useVideoPlayer } from '@renderer/hooks/useVideoPlayer'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useSidebarResize } from '@renderer/hooks/useSidebarResize'
import { useSubtitleDisplayMode } from '@renderer/hooks/useSubtitleDisplayMode'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts'
import { usePlayStateSaver } from '@renderer/hooks/usePlayStateSaver'
import { usePlayStateInitializer } from '@renderer/hooks/usePlayStateInitializer'

import type { SubtitleItem } from '@types_/shared'
import styles from './PlayPage.module.css'

interface PlayPageProps {
  onBack: () => void
}

export const PlayPage = React.memo<PlayPageProps>(function PlayPage({ onBack }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 使用 hooks 获取所需的状态和方法
  // 视频播放器
  const videoPlayer = useVideoPlayer()
  // 字幕列表
  const subtitleListContext = useSubtitleListContext()
  // 播放视频上下文
  const playingVideoContext = usePlayingVideoContext()
  // 侧边栏调整
  const sidebarResize = useSidebarResize(containerRef)
  // 字幕显示模式
  const subtitleDisplayMode = useSubtitleDisplayMode()

  // 视频进度保存
  const { saveProgressRef: savePlayStateRef } = usePlayStateSaver({
    originalFilePath: playingVideoContext.originalFilePath || null,
    videoFile: playingVideoContext.videoFile || null,
    currentTime: videoPlayer.currentTime,
    duration: videoPlayer.duration,
    subtitles: subtitleListContext.subtitles,
    currentSubtitleIndex: subtitleListContext.currentSubtitleIndex,
    getCurrentSubtitleIndex: subtitleListContext.getCurrentSubtitleIndex
  })

  // 使用播放状态初始化 hook
  const { pendingVideoInfo, setPendingVideoInfo, showSubtitleModal, setShowSubtitleModal } =
    usePlayStateInitializer({
      playingVideoContext: playingVideoContext,
      subtitles: subtitleListContext.subtitles,
      showSubtitleModal: false, // 初始值
      restoreVideoState: videoPlayer.restoreVideoState,
      restoreSubtitles: subtitleListContext.restoreSubtitles,
      savePlayStateRef
    })

  // 计算当前字幕索引
  const currentSubtitleIndex = subtitleListContext.getCurrentSubtitleIndex(videoPlayer.currentTime)

  // 增强的进度条拖动处理函数
  const handleEnhancedSeek = useCallback(
    (time: number): void => {
      // 首先执行原始的视频跳转
      videoPlayer.handleSeek(time)

      // 计算目标时间点的字幕索引
      const targetSubtitleIndex = subtitleListContext.getSubtitleIndexForTime(time)

      if (targetSubtitleIndex !== -1) {
        console.log('🎯 进度条拖动：目标字幕索引', targetSubtitleIndex, '时间:', time)

        // 使用 setTimeout 确保视频跳转完成后再更新字幕索引
        setTimeout(() => {
          subtitleListContext.setCurrentSubtitleIndex(targetSubtitleIndex)
          console.log('✅ 字幕索引已更新为:', targetSubtitleIndex)
        }, 50) // 50ms 延迟，确保视频跳转完成
      }
    },
    [videoPlayer, subtitleListContext]
  )

  // 字幕控制 Hook - 在 PlayPage 中管理
  const subtitleControl = useSubtitleControl({
    currentSubtitleIndex,
    currentTime: videoPlayer.currentTime,
    isPlaying: videoPlayer.isPlaying,
    isVideoLoaded: videoPlayer.isVideoLoaded,
    onSeek: videoPlayer.handleSeek,
    onPause: videoPlayer.handlePlayPause
  })

  // 快捷键处理 - 在 PlayPage 中处理字幕控制相关的快捷键
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

  // 同步当前字幕索引 - 在 PlayPage 中处理
  useEffect(() => {
    if (currentSubtitleIndex !== subtitleListContext.currentSubtitleIndex) {
      subtitleListContext.setCurrentSubtitleIndex(currentSubtitleIndex)
    }
  }, [currentSubtitleIndex, subtitleListContext])

  // 全屏状态管理
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenToggle, setFullscreenToggle] = useState<(() => void) | null>(null)

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

  // region 字幕Modal

  // 处理字幕Modal的回调
  const handleSubtitleModalCancel = useCallback(() => {
    setShowSubtitleModal(false)
    setPendingVideoInfo(null)
  }, [setPendingVideoInfo, setShowSubtitleModal])

  // 跳过字幕Modal
  const handleSubtitleModalSkip = useCallback(() => {
    setShowSubtitleModal(false)
    setPendingVideoInfo(null)
  }, [setPendingVideoInfo, setShowSubtitleModal])

  // 字幕加载完成处理函数
  const handleSubtitlesLoaded = useCallback(
    async (loadedSubtitles: SubtitleItem[]) => {
      // 加载字幕到应用状态
      subtitleListContext.restoreSubtitles(loadedSubtitles, 0)
      setShowSubtitleModal(false)
      setPendingVideoInfo(null)

      // 立即保存字幕数据
      if (savePlayStateRef.current) {
        console.log('📝 字幕加载完成，立即保存字幕数据')
        await savePlayStateRef.current(true)
      }
    },
    [savePlayStateRef, setPendingVideoInfo, setShowSubtitleModal, subtitleListContext]
  )

  // endregion

  const handleBack = useCallback(async () => {
    console.log('🔙 处理返回操作')
    // 退出前保存一次进度
    if (savePlayStateRef.current) {
      await savePlayStateRef.current(true)
    }
    onBack()
  }, [onBack, savePlayStateRef])

  return (
    <div ref={containerRef} className={styles.playPageContainer}>
      {/* 播放页面独立Header */}
      <PlayPageHeader videoFileName={playingVideoContext.videoFileName} onBack={handleBack} />

      <div className={styles.playPageContent}>
        <div
          className={styles.mainContentArea}
          style={{ width: `calc(100% - ${sidebarResize.sidebarWidth}px)` }}
        >
          {/* 视频播放区域 - 占据主要空间 */}
          <div className={styles.videoPlayerSection}>
            <VideoPlayer
              videoFile={playingVideoContext.videoFile}
              playerRef={videoPlayer.playerRef}
              isPlaying={videoPlayer.isPlaying}
              volume={videoPlayer.volume}
              playbackRate={videoPlayer.playbackRate}
              currentTime={videoPlayer.currentTime}
              duration={videoPlayer.duration}
              isVideoLoaded={videoPlayer.isVideoLoaded}
              videoError={videoPlayer.videoError}
              currentSubtitle={subtitleListContext.getCurrentSubtitle(videoPlayer.currentTime)}
              displayMode={subtitleDisplayMode.displayMode}
              onProgress={videoPlayer.handleProgress}
              onDuration={videoPlayer.handleVideoDuration}
              onReady={videoPlayer.handleVideoReady}
              onError={videoPlayer.handleVideoError}
              onSeek={handleEnhancedSeek}
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
          {playingVideoContext.videoFile && !isFullscreen && (
            <div className={styles.videoControlsSection}>
              <VideoControlsCompact
                duration={videoPlayer.duration}
                currentTime={videoPlayer.currentTime}
                isVideoLoaded={videoPlayer.isVideoLoaded}
                isPlaying={videoPlayer.isPlaying}
                videoError={videoPlayer.videoError}
                playbackRate={videoPlayer.playbackRate}
                volume={videoPlayer.volume}
                isLooping={subtitleControl.isSingleLoop}
                autoPause={subtitleControl.isAutoPause}
                autoSkipSilence={false} // TODO: 需要从配置文件中读取
                subtitlePosition="bottom"
                displayMode={subtitleDisplayMode.displayMode}
                onSeek={handleEnhancedSeek}
                onStepBackward={videoPlayer.handleStepBackward}
                onPlayPause={videoPlayer.handlePlayPause}
                onStepForward={videoPlayer.handleStepForward}
                onPlaybackRateChange={videoPlayer.handlePlaybackRateChange}
                onVolumeChange={videoPlayer.handleVolumeChange}
                onLoopToggle={subtitleControl.toggleSingleLoop}
                onAutoSkipToggle={subtitleControl.toggleAutoPause}
                onSubtitlePositionToggle={() => {}}
                onFullscreenToggle={handleFullscreenToggle}
                onPreviousSubtitle={subtitleControl.goToPreviousSubtitle}
                onNextSubtitle={subtitleControl.goToNextSubtitle}
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
          <SidebarSection currentTime={videoPlayer.currentTime} onSeek={handleEnhancedSeek} />
          {/* 调试信息 */}
          {process.env.NODE_ENV === 'development' && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '5px',
                fontSize: '10px',
                borderRadius: '3px',
                zIndex: 1000
              }}
            >
              字幕数量: {subtitleListContext.subtitles.length} | 当前索引:{' '}
              {subtitleListContext.currentSubtitleIndex}
            </div>
          )}
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
