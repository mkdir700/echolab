import React from 'react'
import { Layout, Button, Upload, Space, Typography, Tooltip } from 'antd'
import {
  UploadOutlined,
  FileAddOutlined,
  VideoCameraOutlined,
  MessageOutlined
} from '@ant-design/icons'
import { AppHeaderProps } from '../types'
import { SUBTITLE_EXTENSIONS } from '../constants'

const { Header } = Layout
const { Text, Title } = Typography

export function AppHeader({
  videoFileName,
  isVideoLoaded,
  subtitlesCount,
  onVideoUpload,
  onSubtitleUpload
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
