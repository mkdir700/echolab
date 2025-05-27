import React from 'react'
import { SubtitleListContent } from './SubtitleListContent/SubtitleListContent'
import type { SubtitleItem } from '../types/shared'
import styles from './SidebarSection.module.css'

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
  subtitles,
  isAutoScrollEnabled,
  currentSubtitleIndex,
  currentTime,
  subtitleListRef,
  onSeek,
  onCenterCurrentSubtitle
}: Omit<SidebarSectionProps, 'sidebarWidth'>): React.JSX.Element {
  return (
    <div className={styles.sidebarContainer}>
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
