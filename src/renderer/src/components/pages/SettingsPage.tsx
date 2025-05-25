import React from 'react'
import { Typography, Card, Space, Switch, Slider, Select, Divider, Button, message } from 'antd'
import { SettingOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAppState } from '@renderer/hooks/useAppState'

const { Title, Text } = Typography
const { Option } = Select

export function SettingsPage(): React.JSX.Element {
  const { clearAppState, enableAutoSave, isAutoSaveEnabled } = useAppState()

  const handleClearState = (): void => {
    clearAppState()
  }

  const handleToggleAutoSave = (checked: boolean): void => {
    enableAutoSave(checked)
    message.success(checked ? '自动保存已启用' : '自动保存已禁用')
  }
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <SettingOutlined style={{ fontSize: 64, color: '#722ed1', marginBottom: 16 }} />
          <Title level={2} style={{ color: 'var(--text-primary)' }}>
            设置
          </Title>
        </div>

        <Card title="播放设置" style={{ width: '100%' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'var(--text-primary)' }}>自动播放</Text>
              <Switch defaultChecked={false} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'var(--text-primary)' }}>记住播放位置</Text>
              <Switch defaultChecked={true} />
            </div>
            <Divider />
            <div>
              <Text style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                默认音量
              </Text>
              <Slider defaultValue={50} />
            </div>
          </Space>
        </Card>

        <Card title="字幕设置" style={{ width: '100%' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'var(--text-primary)' }}>自动加载字幕</Text>
              <Switch defaultChecked={true} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'var(--text-primary)' }}>显示双语字幕</Text>
              <Switch defaultChecked={false} />
            </div>
            <Divider />
            <div>
              <Text style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                字幕字体大小
              </Text>
              <Select defaultValue="medium" style={{ width: 120 }}>
                <Option value="small">小</Option>
                <Option value="medium">中</Option>
                <Option value="large">大</Option>
              </Select>
            </div>
          </Space>
        </Card>

        <Card title="界面设置" style={{ width: '100%' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'var(--text-primary)' }}>深色模式</Text>
              <Switch defaultChecked={true} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'var(--text-primary)' }}>显示快捷键提示</Text>
              <Switch defaultChecked={true} />
            </div>
            <div>
              <Text style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                界面语言
              </Text>
              <Select defaultValue="zh-CN" style={{ width: 120 }}>
                <Option value="zh-CN">中文</Option>
                <Option value="en-US">English</Option>
              </Select>
            </div>
          </Space>
        </Card>

        <Card title="数据管理" style={{ width: '100%' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: 'var(--text-primary)', display: 'block' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: 'var(--text-primary)', display: 'block' }}>清除所有数据</Text>
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
      </Space>
    </div>
  )
}
