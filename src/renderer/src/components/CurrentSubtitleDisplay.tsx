import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Button, Typography, Tooltip, Space } from 'antd'
import {
  EyeInvisibleOutlined,
  GlobalOutlined,
  FontSizeOutlined,
  TranslationOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import type { SubtitleItem } from '../types/shared'
import type { DisplayMode } from '../hooks/useSubtitleDisplayMode'

const { Text } = Typography

interface CurrentSubtitleDisplayProps {
  currentSubtitle: SubtitleItem | null
  isPlaying: boolean
  displayMode: DisplayMode
  onDisplayModeChange: (mode: DisplayMode) => void
  onToggleDisplayMode: () => void
  onWordHover: (isHovering: boolean) => void
  onPauseOnHover: () => void
}

// 显示模式配置
const DISPLAY_MODE_CONFIG = {
  none: { label: '隐藏', icon: <EyeInvisibleOutlined />, color: '#ff4d4f' },
  original: { label: '原始', icon: <FontSizeOutlined />, color: '#1890ff' },
  chinese: { label: '中文', icon: <GlobalOutlined />, color: '#52c41a' },
  english: { label: 'English', icon: <GlobalOutlined />, color: '#722ed1' },
  bilingual: { label: '双语', icon: <TranslationOutlined />, color: '#fa8c16' }
}

export function CurrentSubtitleDisplay({
  currentSubtitle,
  isPlaying,
  displayMode,
  onDisplayModeChange,
  onToggleDisplayMode,
  onWordHover,
  onPauseOnHover
}: CurrentSubtitleDisplayProps): React.JSX.Element {
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [expandDirection, setExpandDirection] = useState<'up' | 'down'>('up')
  const selectorRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)

  // 计算展开方向
  const calculateExpandDirection = useCallback(() => {
    if (!controlsRef.current) return 'up'

    const rect = controlsRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceAbove = rect.top
    const spaceBelow = viewportHeight - rect.bottom

    // 选择器需要大约 200px 的高度
    const requiredSpace = 200

    // 如果上方空间充足，优先向上展开
    if (spaceAbove >= requiredSpace) {
      return 'up'
    }
    // 如果下方空间充足，向下展开
    if (spaceBelow >= requiredSpace) {
      return 'down'
    }
    // 都不够的情况下，选择空间更大的方向
    return spaceAbove > spaceBelow ? 'up' : 'down'
  }, [])

  // 点击外部关闭选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setShowModeSelector(false)
      }
    }

    if (showModeSelector) {
      document.addEventListener('mousedown', handleClickOutside)
      return (): void => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
    return undefined
  }, [showModeSelector])

  // 处理选择器展开
  const handleToggleSelector = useCallback(() => {
    if (!showModeSelector) {
      const direction = calculateExpandDirection()
      setExpandDirection(direction)
      setShowModeSelector(true)
    } else {
      setShowModeSelector(false)
    }
  }, [showModeSelector, calculateExpandDirection])

  // 处理选择器关闭（带动画）
  const handleCloseSelector = useCallback(() => {
    setShowModeSelector(false)
  }, [])

  // 处理单词hover事件
  const handleWordHover = useCallback(
    (isHovering: boolean) => {
      onWordHover(isHovering)
      if (isHovering && isPlaying) {
        onPauseOnHover()
      }
    },
    [onWordHover, onPauseOnHover, isPlaying]
  )

  // 将文本分割成单词
  const splitTextIntoWords = useCallback(
    (text: string) => {
      return text.split(/(\s+)/).map((word, index) => {
        if (word.trim() === '') {
          return <span key={index}>{word}</span>
        }

        return (
          <span
            key={index}
            className="subtitle-word"
            onMouseEnter={() => handleWordHover(true)}
            onMouseLeave={() => handleWordHover(false)}
          >
            {word}
          </span>
        )
      })
    },
    [handleWordHover]
  )

  // 获取当前模式的配置
  const currentModeConfig = DISPLAY_MODE_CONFIG[displayMode]

  // 根据显示模式渲染字幕内容
  const renderSubtitleContent = useMemo(() => {
    if (!currentSubtitle || displayMode === 'none') {
      return (
        <div className="subtitle-placeholder">
          <Text className="subtitle-hidden">
            {displayMode === 'none' ? '字幕已隐藏' : '当前没有字幕'}
          </Text>
        </div>
      )
    }

    const { text, englishText, chineseText } = currentSubtitle

    switch (displayMode) {
      case 'original':
        return (
          <div className="subtitle-content-original">
            <Text className="subtitle-text">{splitTextIntoWords(text)}</Text>
          </div>
        )

      case 'chinese':
        if (chineseText) {
          return (
            <div className="subtitle-content-chinese">
              <Text className="subtitle-text">{splitTextIntoWords(chineseText)}</Text>
            </div>
          )
        }
        return (
          <div className="subtitle-placeholder">
            <Text className="subtitle-hidden">没有中文字幕</Text>
          </div>
        )

      case 'english':
        if (englishText) {
          return (
            <div className="subtitle-content-english">
              <Text className="subtitle-text">{splitTextIntoWords(englishText)}</Text>
            </div>
          )
        }
        return (
          <div className="subtitle-placeholder">
            <Text className="subtitle-hidden">没有英文字幕</Text>
          </div>
        )

      case 'bilingual':
        return (
          <div className="subtitle-content-bilingual">
            {englishText && (
              <div className="subtitle-line english">
                <Text className="subtitle-text english">{splitTextIntoWords(englishText)}</Text>
              </div>
            )}
            {chineseText && (
              <div className="subtitle-line chinese">
                <Text className="subtitle-text chinese">{splitTextIntoWords(chineseText)}</Text>
              </div>
            )}
            {!englishText && !chineseText && (
              <div className="subtitle-line original">
                <Text className="subtitle-text">{splitTextIntoWords(text)}</Text>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }, [currentSubtitle, displayMode, splitTextIntoWords])

  return (
    <div className="current-subtitle-display">
      <div className="subtitle-display-header">
        <div className="subtitle-mode-indicator">
          <Space size="small">
            {currentModeConfig.icon}
            <Text style={{ color: currentModeConfig.color, fontWeight: 500 }}>
              {currentModeConfig.label}
            </Text>
          </Space>
        </div>

        <div className="subtitle-display-controls" ref={controlsRef}>
          <Space size="small">
            {/* 快速切换按钮 */}
            <Tooltip title="快速切换显示模式 (Ctrl+M)">
              <Button
                type="text"
                size="small"
                icon={<MenuUnfoldOutlined />}
                onClick={onToggleDisplayMode}
                style={{ color: currentModeConfig.color }}
              />
            </Tooltip>

            {/* 模式选择器切换按钮 */}
            <Tooltip title="显示所有选项">
              <Button
                type="text"
                size="small"
                icon={<GlobalOutlined />}
                onClick={handleToggleSelector}
                className={showModeSelector ? 'active' : ''}
              />
            </Tooltip>
          </Space>

          {/* 展开的模式选择器 */}
          {showModeSelector && (
            <div
              className={`subtitle-mode-selector ${expandDirection === 'down' ? 'expand-down' : ''}`}
              ref={selectorRef}
            >
              <Space direction="vertical" size="small">
                {Object.entries(DISPLAY_MODE_CONFIG).map(([mode, config]) => (
                  <Button
                    key={mode}
                    type={displayMode === mode ? 'primary' : 'text'}
                    size="small"
                    icon={config.icon}
                    onClick={() => {
                      onDisplayModeChange(mode as DisplayMode)
                      handleCloseSelector()
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      color: displayMode === mode ? '#fff' : config.color
                    }}
                  >
                    {config.label}
                  </Button>
                ))}
              </Space>
            </div>
          )}
        </div>
      </div>

      <div className="subtitle-display-content">{renderSubtitleContent}</div>
    </div>
  )
}
