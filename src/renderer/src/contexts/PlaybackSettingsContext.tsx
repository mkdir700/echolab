import React from 'react'
import { usePlaybackSettings } from '../hooks/usePlaybackSettings'
import {
  PlaybackSettingsContext,
  type PlaybackSettingsContextType
} from './playback-settings-context'

export function PlaybackSettingsProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const value: PlaybackSettingsContextType = usePlaybackSettings()

  return (
    <PlaybackSettingsContext.Provider value={value}>{children}</PlaybackSettingsContext.Provider>
  )
}
