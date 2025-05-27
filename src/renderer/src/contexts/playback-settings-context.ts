import { createContext } from 'react'
import type { UsePlaybackSettingsReturn } from '../hooks/usePlaybackSettings'

export type PlaybackSettingsContextType = UsePlaybackSettingsReturn

export const PlaybackSettingsContext = createContext<PlaybackSettingsContextType | null>(null)
