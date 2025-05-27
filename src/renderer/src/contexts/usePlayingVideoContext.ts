import { useContext } from 'react'
import { PlayingVideoContext, type PlayingVideoContextType } from './playing-video-context'

export function usePlayingVideoContext(): PlayingVideoContextType {
  const context = useContext(PlayingVideoContext)
  if (!context) {
    throw new Error('usePlayingVideoContext 必须在 PlayingVideoProvider 内部使用')
  }
  return context
}
