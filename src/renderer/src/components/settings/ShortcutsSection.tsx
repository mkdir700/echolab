import React, { useState, useEffect } from 'react'
import { Card, Button, Divider, message, Tag, Input, Typography } from 'antd'
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useShortcuts } from '@renderer/hooks/useShortcuts'
import { DEFAULT_SHORTCUTS } from '@renderer/hooks/useShortcutManager'

const { Text, Paragraph } = Typography

// 检测操作系统平台
const isMac = window.navigator.platform.toLowerCase().includes('mac')

// 禁用的特殊按键
const FORBIDDEN_KEYS = new Set([
  'Enter',
  'Escape',
  'Tab',
  'Backspace',
  'Delete',
  'Insert',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'PrintScreen',
  'Pause',
  'ContextMenu',
  'Meta',
  'Control',
  'Alt',
  'Shift',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12'
])

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
  checkConflict: (newKey: string, currentKey: string) => string | null
}

function ShortcutItem({
  config,
  currentKey,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  checkConflict
}: ShortcutItemProps): React.JSX.Element {
  const [newKey, setNewKey] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 当开始编辑时设置等待状态
  useEffect(() => {
    if (isEditing) {
      setIsWaiting(true)
      setNewKey('')
      setErrorMessage('')
    } else {
      setIsWaiting(false)
    }
  }, [isEditing])

  const formatKeyForDisplay = (keyString: string): string => {
    // 将 Ctrl 替换为平台特定的修饰键显示
    if (isMac) {
      return keyString
        .replace(/Ctrl\+/g, '⌘')
        .replace(/Alt\+/g, '⌥')
        .replace(/Shift\+/g, '⇧')
    }
    return keyString
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    e.preventDefault()
    e.stopPropagation()

    const key = e.key

    // 处理 Enter 确认
    if (key === 'Enter') {
      if (newKey && !errorMessage) {
        handleSave()
      }
      return
    }

    // 处理 Esc 取消
    if (key === 'Escape') {
      handleCancel()
      return
    }

    // 检查是否为禁用的按键
    if (FORBIDDEN_KEYS.has(key)) {
      setErrorMessage(`"${key}" 是系统保留按键，无法设置为快捷键`)
      setNewKey('')
      return
    }

    // 构建快捷键字符串
    let keyString = ''

    // 根据平台使用不同的修饰键
    if (isMac) {
      if (e.metaKey) keyString += 'Cmd+'
      if (e.ctrlKey) keyString += 'Ctrl+'
    } else {
      if (e.ctrlKey) keyString += 'Ctrl+'
    }

    if (e.altKey) keyString += 'Alt+'
    if (e.shiftKey) keyString += 'Shift+'

    // 处理特殊按键
    if (key === ' ') {
      keyString += 'Space'
    } else if (key.length === 1) {
      keyString += key.toUpperCase()
    } else {
      keyString += key
    }

    // 检查快捷键冲突
    const conflictName = checkConflict(keyString, config.key)
    if (conflictName) {
      setErrorMessage(`与 "${conflictName}" 冲突`)
      setNewKey('')
      return
    }

    setNewKey(keyString)
    setErrorMessage('')
    setIsWaiting(false)
  }

  const handleSave = (): void => {
    if (newKey && !errorMessage) {
      onSave(newKey)
      setNewKey('')
      setErrorMessage('')
      setIsWaiting(false)
    }
  }

  const handleCancel = (): void => {
    setNewKey('')
    setErrorMessage('')
    setIsWaiting(false)
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
              placeholder={isWaiting ? '按下新的快捷键...' : '等待输入...'}
              value={newKey ? formatKeyForDisplay(newKey) : ''}
              onKeyDown={handleKeyDown}
              className={`${isWaiting ? 'shortcut-input-waiting' : ''} ${errorMessage ? 'shortcut-input-error' : ''}`}
              style={{
                width: 140,
                marginRight: 8
              }}
              status={errorMessage ? 'error' : undefined}
              autoFocus
              readOnly
            />
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={handleSave}
              disabled={!newKey || !!errorMessage}
              style={{ color: 'var(--success-color)' }}
              title="按 Enter 确认"
            />
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleCancel}
              style={{ color: 'var(--error-color)' }}
              title="按 Esc 取消"
            />
            {errorMessage && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  fontSize: '11px',
                  color: '#ff4d4f',
                  marginTop: 2,
                  whiteSpace: 'nowrap'
                }}
              >
                {errorMessage}
              </div>
            )}
          </div>
        ) : (
          <div className="shortcut-display">
            <Tag className="shortcut-tag">{formatKeyForDisplay(currentKey)}</Tag>
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

  const checkShortcutConflict = (newKey: string, currentKey: string): string | null => {
    // 检查是否与其他快捷键冲突
    for (const config of SHORTCUT_CONFIGS) {
      if (config.key === currentKey) continue // 跳过当前正在编辑的快捷键
      const existingKey = getCurrentShortcut(config.key)
      if (existingKey === newKey) {
        return config.name
      }
    }
    return null
  }

  const handleSaveShortcut = (key: string, newKey: string): void => {
    // 检查快捷键冲突
    const conflictName = checkShortcutConflict(newKey, key)
    if (conflictName) {
      message.error(`快捷键 "${newKey}" 已被 "${conflictName}" 使用，请选择其他快捷键`)
      return
    }

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
        <br />
        <Text style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          💡 提示：快捷键必须包含修饰键（{isMac ? '⌘ Cmd' : 'Ctrl'}/Alt），按 Enter 确认，按 Esc
          取消
        </Text>
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
            checkConflict={checkShortcutConflict}
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
