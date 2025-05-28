import { useContext } from 'react'
import {
  PlaybackSettingsContext,
  type PlaybackSettingsContextType
} from '../contexts/playback-settings-context'

export function usePlaybackSettingsContext(): PlaybackSettingsContextType {
  const context = useContext(PlaybackSettingsContext)
  if (!context) {
    throw new Error('usePlaybackSettingsContext 必须在 PlaybackSettingsProvider 内部使用')
  }
  return context
}
