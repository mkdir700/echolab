import React from 'react'
import { Button, List, Space, Typography } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import { SubtitleListItem } from './SubtitleListItem'
import { formatTime } from '@renderer/utils/helpers'
import styles from './SubtitleListContent.module.css'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { useAutoScroll } from '@renderer/hooks/useAutoScroll'
import { usePlaybackSettingsContext } from '@renderer/hooks/usePlaybackSettingsContext'
const { Text } = Typography

interface SubtitleListContentProps {
  currentTime: number
  onSeek: (time: number) => void
}

export function SubtitleListContent({
  currentTime,
  onSeek
}: SubtitleListContentProps): React.JSX.Element {
  const subtitleListContext = useSubtitleListContext()
  const { subtitles, currentSubtitleIndex } = subtitleListContext
  const playbackSettingsContext = usePlaybackSettingsContext()
  // 自动滚动 Hook
  const autoScroll = useAutoScroll({
    currentSubtitleIndex,
    subtitlesLength: subtitleListContext.subtitles.length,
    isAutoScrollEnabled: playbackSettingsContext.playbackSettings.isAutoScrollEnabled,
    onAutoScrollChange: playbackSettingsContext.setAutoScrollEnabled
  })
  const isAutoScrollEnabled = playbackSettingsContext.playbackSettings.isAutoScrollEnabled
  const { subtitleListRef, handleCenterCurrentSubtitle } = autoScroll
  return (
    <div className={styles.subtitleListContainerNoHeader}>
      {subtitles.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.01) 0%, transparent 100%)'
          }}
        >
          <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            字幕列表 ({subtitles.length})
          </Text>
          <Space>
            {/* 滚动模式状态指示器 */}
            <Text
              style={{
                fontSize: 11,
                color: isAutoScrollEnabled ? '#52c41a' : '#ff7a00',
                background: isAutoScrollEnabled ? '#f6ffed' : '#fff7e6',
                padding: '1px 6px',
                borderRadius: '4px',
                border: isAutoScrollEnabled ? '1px solid #b7eb8f' : '1px solid #ffd591'
              }}
            >
              {isAutoScrollEnabled ? '🤖 自动跟随' : '👆 手动浏览'}
            </Text>

            {currentSubtitleIndex >= 0 && (
              <Button
                size="small"
                type="text"
                onClick={handleCenterCurrentSubtitle}
                title={isAutoScrollEnabled ? '定位当前字幕' : '定位当前字幕并启用自动跟随'}
                style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  color: isAutoScrollEnabled ? '#52c41a' : '#ff7a00'
                }}
              >
                {isAutoScrollEnabled ? '🎯 定位' : '🔓 定位'}
              </Button>
            )}
          </Space>
        </div>
      )}
      <div className={styles.subtitleListContent} ref={subtitleListRef}>
        {subtitles.length > 0 ? (
          <List
            size="small"
            dataSource={subtitles}
            className={styles.subtitleList}
            renderItem={(item, index) => {
              const isActive = currentTime >= item.startTime && currentTime <= item.endTime
              return (
                <SubtitleListItem
                  key={`subtitle-${item.startTime}-${index}`}
                  item={item}
                  index={index}
                  isActive={isActive}
                  onSeek={onSeek}
                  formatTime={formatTime}
                />
              )
            }}
          />
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-muted)'
            }}
          >
            <MessageOutlined style={{ fontSize: 32, marginBottom: 16, opacity: 0.5 }} />
            <div>暂无字幕文件</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              请点击&ldquo;导入字幕&rdquo;按钮加载字幕文件
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
