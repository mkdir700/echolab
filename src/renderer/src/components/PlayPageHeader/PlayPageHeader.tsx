import React from 'react'
import { Button, Typography, Tooltip } from 'antd'
import { ArrowLeftOutlined, VideoCameraOutlined } from '@ant-design/icons'
import styles from './PlayPageHeader.module.css'

const { Text } = Typography

interface PlayPageHeaderProps {
  videoFileName: string
  onBack: () => void
}

// 截断文件名的工具函数
function truncateFileName(fileName: string, maxLength: number = 50): string {
  if (fileName.length <= maxLength) return fileName

  const extension = fileName.split('.').pop() || ''
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'))
  const maxNameLength = maxLength - extension.length - 4 // 4 for "..." and "."

  if (nameWithoutExt.length <= maxNameLength) return fileName

  return `${nameWithoutExt.slice(0, maxNameLength)}...${extension}`
}

export function PlayPageHeader({ videoFileName, onBack }: PlayPageHeaderProps): React.JSX.Element {
  return (
    <div className={styles.header}>
      {/* 背景装饰 */}
      <div className={styles.headerBackground} />

      {/* 左侧：返回按钮 */}
      <div className={styles.headerLeft}>
        <Tooltip title="返回首页" placement="bottom">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            className={styles.backButton}
            size="large"
          />
        </Tooltip>
      </div>

      {/* 中间：视频信息 */}
      <div className={styles.headerCenter}>
        <div className={styles.videoInfo}>
          <VideoCameraOutlined className={styles.videoIcon} />
          <div className={styles.videoDetails}>
            <Tooltip title={videoFileName} placement="bottom">
              <Text className={styles.videoTitle}>{truncateFileName(videoFileName)}</Text>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 右侧：预留空间 */}
      <div className={styles.headerRight}>{/* 可以添加其他功能按钮，如设置、全屏等 */}</div>
    </div>
  )
}
