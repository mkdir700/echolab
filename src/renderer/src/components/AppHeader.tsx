import React from 'react'
import { Layout, Button, Upload, Space, Typography, Tooltip, Menu } from 'antd'
import {
  UploadOutlined,
  FileAddOutlined,
  VideoCameraOutlined,
  MessageOutlined,
  HomeOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { AppHeaderProps, PageType, NavigationItem } from '@renderer/types'
import { SUBTITLE_EXTENSIONS } from '@renderer/constants'

const { Header } = Layout
const { Text, Title } = Typography

// 导航菜单配置
const navigationItems: NavigationItem[] = [
  { key: 'home', label: '首页', icon: <HomeOutlined /> },
  { key: 'favorites', label: '收藏', icon: <HeartOutlined /> },
  { key: 'about', label: '关于', icon: <InfoCircleOutlined /> },
  { key: 'settings', label: '设置', icon: <SettingOutlined /> }
]

export function AppHeader({
  videoFileName,
  isVideoLoaded,
  subtitlesCount,
  currentPage,
  onVideoUpload,
  onSubtitleUpload,
  onPageChange
}: AppHeaderProps): React.JSX.Element {
  return (
    <Header className="app-header">
      <div className="header-left">
        <Title level={4} style={{ color: '#ffffff', margin: 0 }}>
          🎬 EchoLab
        </Title>
        {videoFileName && (
          <Space style={{ marginLeft: 16 }}>
            <VideoCameraOutlined style={{ color: '#ffffff', opacity: 0.8 }} />
            <Text style={{ color: '#ffffff', opacity: 0.8, fontSize: 12 }}>{videoFileName}</Text>
            {isVideoLoaded && <Text style={{ color: '#52c41a', fontSize: 12 }}>✓ 已就绪</Text>}
          </Space>
        )}
      </div>

      {/* 导航菜单 */}
      <div className="header-center">
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          onClick={({ key }) => onPageChange(key as PageType)}
          style={{
            backgroundColor: 'transparent',
            borderBottom: 'none',
            minWidth: 300
          }}
          items={navigationItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            style: { color: '#ffffff' }
          }))}
        />
      </div>

      <Space size="middle">
        <Upload accept="video/*" beforeUpload={onVideoUpload} showUploadList={false}>
          <Tooltip title="支持 MP4, AVI, MOV 等格式">
            <Button
              icon={<UploadOutlined />}
              style={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#ffffff',
                background: 'transparent'
              }}
            >
              打开视频
            </Button>
          </Tooltip>
        </Upload>
        <Upload accept={SUBTITLE_EXTENSIONS} beforeUpload={onSubtitleUpload} showUploadList={false}>
          <Tooltip title="支持 JSON, SRT, VTT 格式">
            <Button
              icon={<FileAddOutlined />}
              style={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#ffffff',
                background: 'transparent'
              }}
            >
              导入字幕
            </Button>
          </Tooltip>
        </Upload>
        {subtitlesCount > 0 && (
          <Space>
            <MessageOutlined style={{ color: '#ffffff', opacity: 0.8 }} />
            <Text style={{ color: '#ffffff', opacity: 0.8 }}>{subtitlesCount} 条字幕</Text>
          </Space>
        )}
      </Space>
    </Header>
  )
}
