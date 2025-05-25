import React, { useState, useRef, useEffect } from 'react'
import ReactPlayer from 'react-player'
import { VideoPlaceholder } from './VideoPlaceholder'
import { LoadingIndicator } from './LoadingIndicator'
import { ErrorIndicator } from './ErrorIndicator'
import { VideoControls } from './VideoControls'

interface VideoSectionProps {
  videoFile: string | null
  playerRef: React.RefObject<ReactPlayer | null>
  isPlaying: boolean
  volume: number
  playbackRate: number
  currentTime: number
  duration: number
  isVideoLoaded: boolean
  videoError: string | null
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
}

export function VideoSection({
  videoFile,
  playerRef,
  isPlaying,
  volume,
  playbackRate,
  currentTime,
  duration,
  isVideoLoaded,
  videoError,
  onProgress,
  onDuration,
  onReady,
  onError,
  onSeek,
  onStepBackward,
  onPlayPause,
  onStepForward,
  onPlaybackRateChange,
  onVolumeChange
}: VideoSectionProps): React.JSX.Element {
  const [showControls, setShowControls] = useState(false)
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 智能控制显示逻辑
  const handleMouseEnter = (): void => {
    setShowControls(true)
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }
  }

  const handleMouseLeave = (): void => {
    if (!isUserInteracting) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2000) // 2秒后隐藏
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
  }, [isPlaying, isUserInteracting])

  return (
    <div className="video-section">
      <div
        className="video-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {videoFile ? (
          <>
            <ReactPlayer
              ref={playerRef}
              url={videoFile}
              className="video-player"
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

            {/* 现代化视频控制组件 */}
            <div onMouseEnter={handleUserInteractionStart} onMouseLeave={handleUserInteractionEnd}>
              <VideoControls
                showControls={showControls}
                duration={duration}
                currentTime={currentTime}
                isVideoLoaded={isVideoLoaded}
                isPlaying={isPlaying}
                videoError={videoError}
                playbackRate={playbackRate}
                volume={volume}
                onSeek={onSeek}
                onStepBackward={onStepBackward}
                onPlayPause={onPlayPause}
                onStepForward={onStepForward}
                onPlaybackRateChange={onPlaybackRateChange}
                onVolumeChange={onVolumeChange}
              />
            </div>
          </>
        ) : (
          <VideoPlaceholder />
        )}
      </div>
    </div>
  )
}
