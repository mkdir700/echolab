import React from 'react'
import { SubtitleListContent } from './SubtitleListContent/SubtitleListContent'
import type { SubtitleItem } from '../types/shared'

interface SidebarSectionProps {
  sidebarWidth: number
  subtitles: SubtitleItem[]
  isAutoScrollEnabled: boolean
  currentSubtitleIndex: number
  currentTime: number
  subtitleListRef: React.RefObject<HTMLDivElement | null>
  onSeek: (time: number) => void
  onCenterCurrentSubtitle: () => void
}

export function SidebarSection({
  sidebarWidth,
  subtitles,
  isAutoScrollEnabled,
  currentSubtitleIndex,
  currentTime,
  subtitleListRef,
  onSeek,
  onCenterCurrentSubtitle
}: SidebarSectionProps): React.JSX.Element {
  return (
    <div className="sidebar-section" style={{ width: `${sidebarWidth}px` }}>
      <SubtitleListContent
        subtitles={subtitles}
        isAutoScrollEnabled={isAutoScrollEnabled}
        currentSubtitleIndex={currentSubtitleIndex}
        currentTime={currentTime}
        subtitleListRef={subtitleListRef}
        onSeek={onSeek}
        onCenterCurrentSubtitle={onCenterCurrentSubtitle}
      />
    </div>
  )
}
