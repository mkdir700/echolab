import React, { useState, useRef, useEffect } from 'react'
import ReactPlayer from 'react-player'
import { VideoPlaceholder } from './VideoPlaceholder'
import { LoadingIndicator } from '../LoadingIndicator'
import { ErrorIndicator } from '../ErrorIndicator'
import { VideoControls } from './VideoControls'
import { Subtitle } from './Subtitle'
import { useFullscreen } from '@renderer/hooks/useFullscreen'
import type { SubtitleItem } from '@renderer/types/shared'
import type { DisplayMode } from '@renderer/hooks/useSubtitleDisplayMode'

// 导入样式
import styles from './VideoPlayer.module.css'

interface VideoPlayerProps {
  videoFile: string | null
  playerRef: React.RefObject<ReactPlayer | null>
  isPlaying: boolean
  volume: number
  playbackRate: number
  currentTime: number
  duration: number
  isVideoLoaded: boolean
  videoError: string | null
  currentSubtitle: SubtitleItem | null
  displayMode: DisplayMode
  onProgress: (state: {
    played: number
    playedSeconds: number
    loaded: number
    loadedSeconds: number
  }) => void
  onDuration: (duration: number) => void
  onReady: () => void
  onError: (error: Error | string) => void
  onSeek: (value: number) => void
  onStepBackward: () => void
  onPlayPause: () => void
  onStepForward: () => void
  onPlaybackRateChange: (value: number) => void
  onVolumeChange: (value: number) => void
  onDisplayModeChange: (mode: DisplayMode) => void
  onToggleDisplayMode: () => void
  // 全屏状态回调
  onFullscreenChange?: (isFullscreen: boolean) => void
  // 获取全屏切换函数的回调
  onFullscreenToggleReady?: (toggleFullscreen: () => void) => void
}

export function VideoPlayer({
  videoFile,
  playerRef,
  isPlaying,
  volume,
  playbackRate,
  currentTime,
  duration,
  isVideoLoaded,
  videoError,
  currentSubtitle,
  displayMode,
  onProgress,
  onDuration,
  onReady,
  onError,
  onSeek,
  onStepBackward,
  onPlayPause,
  onStepForward,
  onPlaybackRateChange,
  onVolumeChange,
  onDisplayModeChange,
  onToggleDisplayMode,
  onFullscreenChange,
  onFullscreenToggleReady
}: VideoPlayerProps): React.JSX.Element {
  const [showControls, setShowControls] = useState(false)
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const [isPausedByHover, setIsPausedByHover] = useState(false)
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 全屏状态管理
  const { isFullscreen, toggleFullscreen } = useFullscreen()

  // 监听全屏状态变化并通知父组件
  useEffect(() => {
    onFullscreenChange?.(isFullscreen)
  }, [isFullscreen, onFullscreenChange])

  // 将全屏切换函数传递给父组件
  useEffect(() => {
    onFullscreenToggleReady?.(toggleFullscreen)
  }, [toggleFullscreen, onFullscreenToggleReady])

  // 智能控制显示逻辑
  const handleMouseEnter = (): void => {
    setShowControls(true)
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }
  }

  // 鼠标离开时，如果用户没有交互，则隐藏控制栏
  const handleMouseLeave = (): void => {
    if (!isUserInteracting) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 200000) // 2秒后隐藏
    }
  }

  const handleMouseMove = (): void => {
    setShowControls(true)
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }

    if (!isUserInteracting) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000) // 3秒无操作后隐藏
    }
  }

  const handleUserInteractionStart = (): void => {
    setIsUserInteracting(true)
    setShowControls(true)
  }

  const handleUserInteractionEnd = (): void => {
    setIsUserInteracting(false)
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 2000)
  }

  // 处理视频播放器点击事件
  const handleVideoClick = (): void => {
    onPlayPause()
    setShowControls(true)
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    }
  }, [])

  // 播放状态变化时的控制逻辑
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    } else if (!isUserInteracting) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    // 如果是因为悬停暂停的，当播放状态变为播放时，重置悬停状态
    if (isPlaying && isPausedByHover) {
      setIsPausedByHover(false)
    }
  }, [isPlaying, isUserInteracting, isPausedByHover])

  return (
    <div className={styles.videoSection}>
      <div
        className={styles.videoContainer}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {videoFile ? (
          <>
            <ReactPlayer
              ref={playerRef}
              url={videoFile}
              className={styles.videoPlayer}
              width="100%"
              height="100%"
              playing={isPlaying}
              volume={volume}
              playbackRate={playbackRate}
              onProgress={onProgress}
              onDuration={onDuration}
              onReady={onReady}
              onError={onError}
              onClick={handleVideoClick}
              controls={false}
              progressInterval={100}
              style={{ cursor: 'pointer' }}
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload',
                    disablePictureInPicture: false,
                    preload: 'metadata',
                    crossOrigin: 'anonymous'
                  },
                  forceHLS: false,
                  forceDASH: false,
                  forceVideo: true
                }
              }}
            />

            {/* 加载状态提示 */}
            {!isVideoLoaded && !videoError && <LoadingIndicator />}

            {/* 错误状态提示 */}
            {videoError && <ErrorIndicator error={videoError} />}

            {/* 字幕显示组件 - 嵌入在视频内部，距离底部10% */}
            <div className={styles.subtitleOverlay}>
              <Subtitle
                currentSubtitle={currentSubtitle}
                isPlaying={isPlaying}
                displayMode={displayMode}
                onDisplayModeChange={onDisplayModeChange}
                onToggleDisplayMode={onToggleDisplayMode}
                onWordHover={(isHovering) => {
                  if (isHovering) {
                    setShowControls(true)
                  }
                }}
                onPauseOnHover={() => {
                  if (isPlaying) {
                    onPlayPause()
                    setIsPausedByHover(true)
                  }
                }}
              />
            </div>

            {/* 视频控制组件 - 仅在全屏模式下显示 */}
            {isFullscreen && (
              <div
                className={styles.controlsOverlay}
                onMouseEnter={handleUserInteractionStart}
                onMouseLeave={handleUserInteractionEnd}
              >
                <VideoControls
                  showControls={showControls}
                  duration={duration}
                  currentTime={currentTime}
                  isVideoLoaded={isVideoLoaded}
                  isPlaying={isPlaying}
                  videoError={videoError}
                  playbackRate={playbackRate}
                  volume={volume}
                  isLooping={false}
                  autoSkipSilence={false}
                  subtitlePosition="bottom"
                  isFullscreen={isFullscreen}
                  onSeek={onSeek}
                  onStepBackward={onStepBackward}
                  onPlayPause={onPlayPause}
                  onStepForward={onStepForward}
                  onPlaybackRateChange={onPlaybackRateChange}
                  onVolumeChange={onVolumeChange}
                  onLoopToggle={() => {}}
                  onAutoSkipToggle={() => {}}
                  onSubtitlePositionToggle={() => {}}
                  onFullscreenToggle={toggleFullscreen}
                  onPreviousSubtitle={() => {}}
                  onNextSubtitle={() => {}}
                />
              </div>
            )}
          </>
        ) : (
          <VideoPlaceholder />
        )}
      </div>
    </div>
  )
}
