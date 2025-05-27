import React from 'react'
import { Card } from 'antd'
import { SETTINGS_SECTIONS } from '@renderer/constants/settings'

interface SettingsNavigationProps {
  activeSection: string
  onSectionChange: (section: string) => void
  className?: string
}

export function SettingsNavigation({
  activeSection,
  onSectionChange,
  className
}: SettingsNavigationProps): React.JSX.Element {
  return (
    <Card className={`settings-sidebar ${className || ''}`}>
      <div className="settings-nav">
        {SETTINGS_SECTIONS.map((item) => (
          <div
            key={item.key}
            className={`settings-nav-item ${activeSection === item.key ? 'active' : ''}`}
            onClick={() => onSectionChange(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
