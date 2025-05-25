import React, { useCallback } from 'react'
import { List, Typography } from 'antd'
import { SubtitleListItemProps } from '../types'

const { Text } = Typography

// 字幕项组件 - 使用React.memo避免不必要的重渲染
export const SubtitleListItem = React.memo<SubtitleListItemProps>(
  ({ item, index, isActive, onSeek, formatTime }) => {
    const handleClick = useCallback((): void => {
      onSeek(item.startTime)
    }, [item.startTime, onSeek])

    return (
      <List.Item
        key={index}
        className={`subtitle-item ${isActive ? 'subtitle-item-active' : ''}`}
        onClick={handleClick}
        style={{
          cursor: 'pointer'
        }}
      >
        <div style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: isActive ? 'var(--accent-color)' : 'var(--text-muted)',
                fontWeight: isActive ? 'bold' : 'normal'
              }}
            >
              {formatTime(item.startTime)}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: isActive ? 'var(--accent-color)' : 'var(--text-muted)',
                fontWeight: isActive ? 'bold' : 'normal'
              }}
            >
              {formatTime(item.endTime)}
            </Text>
          </div>
          <Text
            style={{
              fontSize: 14,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? 'bold' : 'normal',
              lineHeight: '1.4'
            }}
          >
            {item.text}
          </Text>
          {/* 显示中文字幕（如果有双语字幕） */}
          {item.chineseText && item.englishText && (
            <Text
              style={{
                fontSize: 12,
                color: isActive ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontStyle: 'italic',
                lineHeight: '1.3',
                marginTop: '2px',
                display: 'block'
              }}
            >
              {item.chineseText}
            </Text>
          )}
        </div>
      </List.Item>
    )
  }
)

SubtitleListItem.displayName = 'SubtitleListItem'
