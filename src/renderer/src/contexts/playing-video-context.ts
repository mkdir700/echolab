import { createContext } from 'react'
import type { UseFileUploadReturn } from '../hooks/useFileUpload'

export type PlayingVideoContextType = UseFileUploadReturn

export const PlayingVideoContext = createContext<PlayingVideoContextType | null>(null)
