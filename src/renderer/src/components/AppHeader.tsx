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

// 截断文件名的工具函数
function truncateFileName(fileName: string, maxLength: number = 30): string {
  if (fileName.length <= maxLength) return fileName

  const extension = fileName.split('.').pop() || ''
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'))
  const maxNameLength = maxLength - extension.length - 4 // 4 for "..." and "."

  if (nameWithoutExt.length <= maxNameLength) return fileName

  return `${nameWithoutExt.slice(0, maxNameLength)}...${extension}`
}

export function AppHeader({
  videoFileName,
  isVideoLoaded,
  subtitlesCount,
  currentPage,
  onVideoFileSelect,
  onSubtitleUpload,
  onPageChange
}: AppHeaderProps): React.JSX.Element {
  return (
    <Header className="app-header">
      <div className="header-left">
        <Title level={4} style={{ color: '#ffffff', margin: 0, flexShrink: 0 }}>
          🎬 EchoLab
        </Title>
        {videoFileName && (
          <div className="video-file-info">
            <VideoCameraOutlined className="video-icon" />
            <Tooltip title={videoFileName} placement="bottomLeft">
              <Text className="video-filename">{truncateFileName(videoFileName)}</Text>
            </Tooltip>
            {isVideoLoaded && <Text className="video-status">✓ 已就绪</Text>}
          </div>
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

      <div className="header-right">
        <Space size="middle">
          <Tooltip title="支持 MP4, AVI, MOV 等格式">
            <Button
              icon={<UploadOutlined />}
              onClick={onVideoFileSelect}
              style={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#ffffff',
                background: 'transparent'
              }}
            >
              打开视频
            </Button>
          </Tooltip>
          <Upload
            accept={SUBTITLE_EXTENSIONS}
            beforeUpload={onSubtitleUpload}
            showUploadList={false}
          >
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
      </div>
    </Header>
  )
}
