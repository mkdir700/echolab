import React from 'react'
import { Card, Space, Switch, Button, Divider, Typography, message } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { useAppState } from '@renderer/hooks/useAppState'

const { Text } = Typography

interface DataManagementSectionProps {
  className?: string
}

export function DataManagementSection({
  className
}: DataManagementSectionProps): React.JSX.Element {
  const { clearAppState, enableAutoSave, isAutoSaveEnabled } = useAppState()

  const handleClearState = (): void => {
    clearAppState()
    message.success('应用数据已清除')
  }

  const handleToggleAutoSave = (checked: boolean): void => {
    enableAutoSave(checked)
    message.success(checked ? '自动保存已启用' : '自动保存已禁用')
  }

  return (
    <Card title="数据管理" className={`settings-section-card ${className || ''}`}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div className="settings-item">
          <div className="settings-item-info">
            <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>
              自动保存应用状态
            </Text>
            <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              自动保存视频进度、字幕设置和界面配置
            </Text>
            <Text style={{ color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>
              注意：只有通过&ldquo;选择文件&rdquo;按钮选择的视频文件才能自动恢复，拖拽上传的文件无法恢复
            </Text>
          </div>
          <Switch checked={isAutoSaveEnabled} onChange={handleToggleAutoSave} />
        </div>

        <Divider />

        <div className="settings-item">
          <div className="settings-item-info">
            <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>
              清除所有数据
            </Text>
            <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              清除所有保存的应用状态和设置
            </Text>
          </div>
          <Button danger icon={<DeleteOutlined />} onClick={handleClearState}>
            清除数据
          </Button>
        </div>
      </Space>
    </Card>
  )
}
