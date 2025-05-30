import React from 'react'
import { SubtitleListContent } from './SubtitleListContent/SubtitleListContent'
import styles from './SidebarSection.module.css'

export function SidebarSection(): React.JSX.Element {
  return (
    <div className={styles.sidebarContainer}>
      <SubtitleListContent />
    </div>
  )
}
