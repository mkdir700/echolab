import React from 'react'
import { useFileUpload } from '../hooks/useVideoUpload'
import { PlayingVideoContext, type IPlayingVideoContextType } from './playing-video-context'

export function PlayingVideoProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const value: IPlayingVideoContextType = useFileUpload()

  return <PlayingVideoContext.Provider value={value}>{children}</PlayingVideoContext.Provider>
}
