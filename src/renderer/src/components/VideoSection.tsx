import React, { useState } from 'react'
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

  return (
    <div className="video-section">
      <div
        className="video-container"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
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
              controls={false}
              progressInterval={100}
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

            {/* 视频控制条 */}
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
          </>
        ) : (
          <VideoPlaceholder />
        )}
      </div>
    </div>
  )
}
