import { createContext } from 'react'
import type { UseVideoPlayerReturn } from '../hooks/useVideoPlayer'

export type VideoPlayerContextType = UseVideoPlayerReturn

export const VideoPlayerContext = createContext<VideoPlayerContextType | null>(null)
