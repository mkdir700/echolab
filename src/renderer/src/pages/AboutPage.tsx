import React from 'react'
import { Typography, Space, Divider } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

export function AboutPage(): React.JSX.Element {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <InfoCircleOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
          <Title level={2} style={{ color: 'var(--text-primary)' }}>
            关于 EchoLab
          </Title>
        </div>

        <Divider />

        <div>
          <Title level={4} style={{ color: 'var(--text-primary)' }}>
            产品介绍
          </Title>
          <Paragraph style={{ color: 'var(--text-muted)', fontSize: 16 }}>
            EchoLab 是一款专业的视频字幕学习工具，旨在帮助用户通过视频内容进行语言学习和字幕制作。
          </Paragraph>
        </div>

        <div>
          <Title level={4} style={{ color: 'var(--text-primary)' }}>
            主要功能
          </Title>
          <Paragraph style={{ color: 'var(--text-muted)', fontSize: 16 }}>
            • 视频播放与字幕同步显示
            <br />
            • 单句循环播放功能
            <br />
            • 自动暂停与手动控制
            <br />
            • 多种字幕显示模式
            <br />• 快捷键操作支持
          </Paragraph>
        </div>

        <div>
          <Title level={4} style={{ color: 'var(--text-primary)' }}>
            版本信息
          </Title>
          <Text style={{ color: 'var(--text-muted)' }}>
            版本: 1.0.0
            <br />
            构建时间: 2024-01-01
          </Text>
        </div>
      </Space>
    </div>
  )
}
