import React from 'react'
import { Space, Typography } from 'antd'
import { VideoCameraOutlined } from '@ant-design/icons'
import styles from './VideoSection.module.css'

const { Text } = Typography

export function VideoPlaceholder(): React.JSX.Element {
  return (
    <div className={styles.videoPlaceholder}>
      <Space direction="vertical" align="center" size="large">
        <VideoCameraOutlined style={{ fontSize: 48, color: 'var(--accent-color)' }} />
        <Text style={{ color: 'var(--text-secondary)', fontSize: 16, textAlign: 'center' }}>
          拖拽视频文件到此处或点击&ldquo;打开视频&rdquo;按钮
        </Text>
        <Text style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          支持 MP4, AVI, MOV, MKV 等格式
        </Text>
      </Space>
    </div>
  )
}
