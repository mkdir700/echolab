import React, { useMemo, useRef, useEffect } from 'react'
import { Button, Space, Typography } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import VirtualList from 'rc-virtual-list'
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

// 虚拟列表项高度（估算值，可以根据实际内容调整）
const ITEM_HEIGHT = 80

export function SubtitleListContent({
  currentTime,
  onSeek
}: SubtitleListContentProps): React.JSX.Element {
  const subtitleListContext = useSubtitleListContext()
  const { subtitles, currentSubtitleIndex } = subtitleListContext
  const playbackSettingsContext = usePlaybackSettingsContext()

  // 为虚拟列表创建一个单独的 ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const virtualListRef = useRef<any>(null)

  // 自动滚动 Hook
  const autoScroll = useAutoScroll({
    currentSubtitleIndex,
    subtitlesLength: subtitleListContext.subtitles.length,
    isAutoScrollEnabled: playbackSettingsContext.playbackSettings.isAutoScrollEnabled,
    onAutoScrollChange: playbackSettingsContext.setAutoScrollEnabled
  })

  const isAutoScrollEnabled = playbackSettingsContext.playbackSettings.isAutoScrollEnabled
  const { subtitleListRef } = autoScroll

  // 创建带索引的字幕列表，用于虚拟列表渲染
  const subtitlesWithIndex = useMemo(() => {
    return subtitles.map((item, index) => ({ ...item, index }))
  }, [subtitles])

  // 处理虚拟列表的滚动到指定索引
  useEffect(() => {
    if (currentSubtitleIndex >= 0 && isAutoScrollEnabled && virtualListRef.current) {
      // 使用虚拟列表的 scrollTo 方法
      virtualListRef.current.scrollTo({
        index: currentSubtitleIndex,
        align: 'center'
      })
    }
  }, [currentSubtitleIndex, isAutoScrollEnabled])

  // 修改定位函数，使用虚拟列表的 API
  const handleCenterCurrentSubtitleVirtual = (): void => {
    if (currentSubtitleIndex >= 0 && virtualListRef.current) {
      playbackSettingsContext.setAutoScrollEnabled(true)
      virtualListRef.current.scrollTo({
        index: currentSubtitleIndex,
        align: 'center'
      })
    }
  }

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
                onClick={handleCenterCurrentSubtitleVirtual}
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
          <VirtualList
            ref={virtualListRef}
            data={subtitlesWithIndex}
            height={0} // 设置为 0，让组件自动填充父容器高度
            fullHeight
            itemHeight={ITEM_HEIGHT}
            itemKey={(item) => `subtitle-${item.startTime}-${item.index}`}
            className={styles.subtitleList}
            onScroll={(e) => {
              // 处理用户滚动事件
              if (!isAutoScrollEnabled) {
                return
              }

              // 检测是否是用户手动滚动
              const scrollElement = e.currentTarget as HTMLElement
              if (scrollElement && !scrollElement.dataset.autoScrolling) {
                playbackSettingsContext.setAutoScrollEnabled(false)
              }
            }}
          >
            {(item) => {
              const isActive = currentTime >= item.startTime && currentTime <= item.endTime
              return (
                <SubtitleListItem
                  key={`subtitle-${item.startTime}-${item.index}`}
                  item={item}
                  index={item.index}
                  isActive={isActive}
                  onSeek={onSeek}
                  formatTime={formatTime}
                />
              )
            }}
          </VirtualList>
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
