import React from 'react'
import { SubtitleListContent } from './SubtitleListContent/SubtitleListContent'
import { useSubtitleListContext } from '../hooks/useSubtitleListContext'
import styles from './SidebarSection.module.css'

interface SidebarSectionProps {
  isAutoScrollEnabled: boolean
  currentSubtitleIndex: number
  currentTime: number
  subtitleListRef: React.RefObject<HTMLDivElement | null>
  onSeek: (time: number) => void
  onCenterCurrentSubtitle: () => void
}

export function SidebarSection({
  isAutoScrollEnabled,
  currentSubtitleIndex,
  currentTime,
  subtitleListRef,
  onSeek,
  onCenterCurrentSubtitle
}: SidebarSectionProps): React.JSX.Element {
  const { subtitles } = useSubtitleListContext()

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
