import React from 'react'
import { useFileUpload } from '../hooks/useVideoUpload'
import { PlayingVideoContext, type PlayingVideoContextType } from './playing-video-context'

export function PlayingVideoProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const value: PlayingVideoContextType = useFileUpload()

  return <PlayingVideoContext.Provider value={value}>{children}</PlayingVideoContext.Provider>
}
