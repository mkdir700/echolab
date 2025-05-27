import React, { useCallback, useState } from 'react'
import { Button, Typography, Card, Tooltip, Tag, Row, Col, Empty, Modal } from 'antd'
import {
  VideoCameraOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { RecentFileItem } from '@renderer/hooks/useAppState'
import { formatTime } from '@renderer/utils/helpers'
import styles from './HomePage.module.css'

const { Title, Text } = Typography

interface HomePageProps {
  recentFiles: RecentFileItem[]
  onVideoFileSelect: () => Promise<boolean>
  onOpenRecentFile: (filePath: string, fileName: string) => Promise<boolean>
  onRemoveRecentFile: (filePath: string) => void
  onClearRecentFiles: () => void
}

// 推荐视频假数据
const recommendedVideos = [
  {
    id: '1',
    title: 'English Conversation Practice',
    duration: 1800,
    poster: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=400&fit=crop',
    category: '英语学习'
  },
  {
    id: '2',
    title: 'JavaScript Advanced Concepts',
    duration: 2400,
    poster: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&h=400&fit=crop',
    category: '编程教程'
  },
  {
    id: '3',
    title: 'French Pronunciation Guide',
    duration: 1200,
    poster: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    category: '法语学习'
  },
  {
    id: '4',
    title: 'React Hooks Tutorial',
    duration: 3600,
    poster: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=400&fit=crop',
    category: '前端开发'
  }
]

export function HomePage({
  recentFiles,
  onVideoFileSelect,
  onOpenRecentFile,
  onRemoveRecentFile,
  onClearRecentFiles
}: HomePageProps): React.JSX.Element {
  // 处理打开最近文件
  const handleOpenRecentFile = useCallback(
    async (item: RecentFileItem) => {
      const success = await onOpenRecentFile(item.filePath, item.fileName)
      if (!success) {
        // 如果文件无法打开，询问是否从列表中移除
        onRemoveRecentFile(item.filePath)
      }
    },
    [onOpenRecentFile, onRemoveRecentFile]
  )

  // 格式化最后打开时间
  const formatLastOpened = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return new Date(timestamp).toLocaleDateString()
  }

  // 生成视频海报占位符
  const generatePosterPlaceholder = (fileName: string): string => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ]
    const index = fileName.length % colors.length
    return colors[index]
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFilePath, setSelectedFilePath] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')

  const handleRemove = (): void => {
    onRemoveRecentFile(selectedFilePath)
    setIsModalOpen(false)
    setSelectedFilePath('')
    setSelectedFileName('')
  }

  const showDeleteConfirm = (filePath: string, fileName: string): void => {
    setSelectedFilePath(filePath)
    setSelectedFileName(fileName)
    setIsModalOpen(true)
  }

  return (
    <div className={styles.homePageContainer}>
      {/* 顶部欢迎区域 */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <Title level={1} className={styles.welcomeTitle}>
            我的视频库
          </Title>
          <Text className={styles.welcomeSubtitle}>发现、学习、成长 - 您的个人视频学习中心</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={onVideoFileSelect}
          className={styles.addVideoButton}
        >
          添加视频
        </Button>
      </div>

      <div className={styles.mainContent}>
        {/* 最近视频区域 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Title level={2} className={styles.sectionTitle}>
              <ClockCircleOutlined className={styles.titleIcon} />
              最近观看
            </Title>
            {recentFiles.length > 0 && (
              <Button
                type="text"
                size="small"
                onClick={onClearRecentFiles}
                className={styles.clearButton}
              >
                清空列表
              </Button>
            )}
          </div>

          {recentFiles.length === 0 ? (
            <Empty
              image={<VideoCameraOutlined className={styles.emptyIcon} />}
              description={
                <div className={styles.emptyDescription}>
                  <Text>还没有观看过任何视频</Text>
                  <br />
                  <Text type="secondary">点击上方按钮添加您的第一个视频</Text>
                </div>
              }
            />
          ) : (
            <Row gutter={[24, 24]} className={styles.videoGrid}>
              {recentFiles.slice(0, 8).map((item) => (
                <Col xs={12} sm={8} md={6} lg={4} xl={3} key={item.filePath}>
                  <Card
                    className={styles.videoCard}
                    hoverable
                    cover={
                      <div className={styles.videoPoster}>
                        <div
                          className={styles.posterPlaceholder}
                          style={{ background: generatePosterPlaceholder(item.fileName) }}
                        >
                          <VideoCameraOutlined className={styles.posterIcon} />
                        </div>
                        <div className={styles.playOverlay}>
                          <PlayCircleOutlined className={styles.playIcon} />
                        </div>
                        <div className={styles.deleteButton}>
                          <Tooltip title="删除记录">
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation()
                                showDeleteConfirm(item.filePath, item.fileName)
                              }}
                              className={styles.deleteIcon}
                            />
                          </Tooltip>
                        </div>
                        {item.duration && (
                          <div className={styles.durationBadge}>{formatTime(item.duration)}</div>
                        )}
                      </div>
                    }
                    onClick={() => handleOpenRecentFile(item)}
                  >
                    <div className={styles.videoInfo}>
                      <Tooltip title={item.fileName}>
                        <Text strong ellipsis className={styles.videoTitle}>
                          {item.fileName.replace(/\.[^/.]+$/, '')}
                        </Text>
                      </Tooltip>
                      <Text type="secondary" className={styles.lastWatched}>
                        {formatLastOpened(item.lastOpenedAt)}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* 推荐视频区域 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Title level={2} className={styles.sectionTitle}>
              <StarOutlined className={styles.titleIcon} />
              推荐视频
            </Title>
          </div>

          <Row gutter={[24, 24]} className={styles.videoGrid}>
            {recommendedVideos.map((video) => (
              <Col xs={12} sm={8} md={6} lg={4} xl={3} key={video.id}>
                <Card
                  className={styles.videoCard}
                  hoverable
                  cover={
                    <div className={styles.videoPoster}>
                      <img
                        src={video.poster}
                        alt={video.title}
                        className={styles.posterImage}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const placeholder = target.nextElementSibling as HTMLElement
                          if (placeholder) {
                            placeholder.style.display = 'flex'
                          }
                        }}
                      />
                      <div
                        className={styles.posterPlaceholder}
                        style={{
                          background: generatePosterPlaceholder(video.title),
                          display: 'none'
                        }}
                      >
                        <VideoCameraOutlined className={styles.posterIcon} />
                      </div>
                      <div className={styles.playOverlay}>
                        <PlayCircleOutlined className={styles.playIcon} />
                      </div>
                      <div className={styles.durationBadge}>{formatTime(video.duration)}</div>
                      <div className={styles.categoryBadge}>
                        <Tag color="blue">{video.category}</Tag>
                      </div>
                    </div>
                  }
                >
                  <div className={styles.videoInfo}>
                    <Tooltip title={video.title}>
                      <Text strong ellipsis className={styles.videoTitle}>
                        {video.title}
                      </Text>
                    </Tooltip>
                    <Text type="secondary" className={styles.videoCategory}>
                      推荐内容
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      <Modal
        title={
          <div className={styles.modalTitle}>
            <DeleteOutlined className={styles.modalTitleIcon} />
            确认删除
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleRemove}
        okText="删除"
        cancelText="取消"
        okType="danger"
        className={styles.deleteModal}
        centered
        width={480}
      >
        <div className={styles.modalContent}>
          <p className={styles.confirmText}>
            确定要删除视频{' '}
            <strong className={styles.fileName}>&ldquo;{selectedFileName}&rdquo;</strong>{' '}
            的观看记录吗？
          </p>
          <div className={styles.warningBox}>
            <p className={styles.warningText}>
              此操作将删除该视频的观看进度等所有相关数据，且无法恢复。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
