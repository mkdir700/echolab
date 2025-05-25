import React, { useState } from 'react'
import { Card, Button, Divider, message, Tag, Input, Typography } from 'antd'
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useShortcuts } from '@renderer/hooks/useShortcuts'
import { DEFAULT_SHORTCUTS } from '@renderer/hooks/useShortcutManager'

const { Text, Paragraph } = Typography

// 快捷键配置数据 - 从新的管理系统获取
const SHORTCUT_CONFIGS = Object.values(DEFAULT_SHORTCUTS)

// 快捷键分类
const SHORTCUT_CATEGORIES = {
  playback: { name: '播放控制', color: '#667eea' },
  subtitle: { name: '字幕控制', color: '#52c41a' }
}

interface ShortcutItemProps {
  config: (typeof DEFAULT_SHORTCUTS)[keyof typeof DEFAULT_SHORTCUTS]
  currentKey: string
  isEditing: boolean
  onEdit: () => void
  onSave: (newKey: string) => void
  onCancel: () => void
}

function ShortcutItem({
  config,
  currentKey,
  isEditing,
  onEdit,
  onSave,
  onCancel
}: ShortcutItemProps): React.JSX.Element {
  const [newKey, setNewKey] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    e.preventDefault()
    e.stopPropagation()

    let keyString = ''

    if (e.ctrlKey || e.metaKey) keyString += 'Ctrl+'
    if (e.altKey) keyString += 'Alt+'
    if (e.shiftKey) keyString += 'Shift+'

    const key = e.key
    if (key === ' ') {
      keyString += 'Space'
    } else if (key.length === 1) {
      keyString += key.toUpperCase()
    } else {
      keyString += key
    }

    setNewKey(keyString)
  }

  const handleSave = (): void => {
    if (newKey) {
      onSave(newKey)
      setNewKey('')
    }
  }

  const handleCancel = (): void => {
    setNewKey('')
    onCancel()
  }

  return (
    <div className="shortcut-item">
      <div className="shortcut-info">
        <div className="shortcut-name">
          <Text strong style={{ color: 'var(--text-primary)' }}>
            {config.name}
          </Text>
          <Tag
            color={SHORTCUT_CATEGORIES[config.category].color}
            style={{ marginLeft: 8, fontSize: '10px' }}
          >
            {SHORTCUT_CATEGORIES[config.category].name}
          </Tag>
        </div>
        <Text style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{config.description}</Text>
      </div>

      <div className="shortcut-key">
        {isEditing ? (
          <div className="shortcut-edit">
            <Input
              size="small"
              placeholder="按下新的快捷键..."
              value={newKey}
              onKeyDown={handleKeyDown}
              style={{ width: 120, marginRight: 8 }}
              autoFocus
            />
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={handleSave}
              disabled={!newKey}
              style={{ color: 'var(--success-color)' }}
            />
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleCancel}
              style={{ color: 'var(--error-color)' }}
            />
          </div>
        ) : (
          <div className="shortcut-display">
            <Tag className="shortcut-tag">{currentKey}</Tag>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={onEdit}
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

interface ShortcutsSectionProps {
  className?: string
}

export function ShortcutsSection({ className }: ShortcutsSectionProps): React.JSX.Element {
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const { shortcuts, getCurrentShortcut, updateShortcut, resetShortcuts } = useShortcuts()

  const handleEditShortcut = (key: string): void => {
    setEditingShortcut(key)
  }

  const handleSaveShortcut = (key: string, newKey: string): void => {
    updateShortcut(key, newKey)
    message.success(`快捷键 "${key}" 已更新为 "${newKey}"`)
    setEditingShortcut(null)
  }

  const handleCancelEdit = (): void => {
    setEditingShortcut(null)
  }

  const handleResetToDefault = (): void => {
    resetShortcuts()
    message.success('快捷键已重置为默认设置')
  }

  const handleExportConfig = (): void => {
    const config = {
      shortcuts,
      timestamp: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'echolab-shortcuts.json'
    a.click()
    URL.revokeObjectURL(url)
    message.success('快捷键配置已导出')
  }

  return (
    <Card title="快捷键设置" className={`settings-section-card ${className || ''}`}>
      <Paragraph style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        自定义快捷键以提高使用效率。点击快捷键右侧的编辑按钮进行修改。
      </Paragraph>

      <div className="shortcuts-list">
        {SHORTCUT_CONFIGS.map((config) => (
          <ShortcutItem
            key={config.key}
            config={config}
            currentKey={getCurrentShortcut(config.key)}
            isEditing={editingShortcut === config.key}
            onEdit={() => handleEditShortcut(config.key)}
            onSave={(newKey) => handleSaveShortcut(config.key, newKey)}
            onCancel={handleCancelEdit}
          />
        ))}
      </div>

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Button type="default" style={{ marginRight: 8 }} onClick={handleResetToDefault}>
          重置为默认
        </Button>
        <Button type="primary" onClick={handleExportConfig}>
          导出配置
        </Button>
      </div>
    </Card>
  )
}
