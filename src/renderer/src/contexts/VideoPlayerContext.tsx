import React from 'react'
import { useVideoPlayer } from '../hooks/useVideoPlayer'
import { VideoPlayerContext, type VideoPlayerContextType } from './video-player-context'

export function VideoPlayerProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const value: VideoPlayerContextType = useVideoPlayer()

  return <VideoPlayerContext.Provider value={value}>{children}</VideoPlayerContext.Provider>
}
