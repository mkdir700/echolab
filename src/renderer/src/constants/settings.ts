import React from 'react'
import { KeyOutlined, EyeOutlined, BookOutlined, InfoCircleOutlined } from '@ant-design/icons'

export interface SettingsSection {
  key: string
  label: string
  icon: React.ReactNode
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { key: 'shortcuts', label: '快捷键', icon: React.createElement(KeyOutlined) },
  { key: 'appearance', label: '外观', icon: React.createElement(EyeOutlined) },
  { key: 'dictionary', label: '查单词', icon: React.createElement(BookOutlined) },
  { key: 'about', label: '关于', icon: React.createElement(InfoCircleOutlined) }
]
