import React from 'react'
import { SubtitleListContent } from './SubtitleListContent/SubtitleListContent'
import styles from './SidebarSection.module.css'

interface SidebarSectionProps {
  currentTime: number
  onSeek: (time: number) => void
}

export function SidebarSection({ currentTime, onSeek }: SidebarSectionProps): React.JSX.Element {
  return (
    <div className={styles.sidebarContainer}>
      <SubtitleListContent currentTime={currentTime} onSeek={onSeek} />
    </div>
  )
}
