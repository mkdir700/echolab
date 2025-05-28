import React from 'react'
import { useSubtitleList } from '../hooks/useSubtitleList'
import { SubtitleListContext, type SubtitleListContextType } from './subtitle-list-context'

export function SubtitleListProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const value: SubtitleListContextType = useSubtitleList()

  return <SubtitleListContext.Provider value={value}>{children}</SubtitleListContext.Provider>
}
