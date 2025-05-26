import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Button, Typography, Tooltip, Space } from 'antd'
import {
  EyeInvisibleOutlined,
  GlobalOutlined,
  FontSizeOutlined,
  TranslationOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import type { SubtitleItem } from '@renderer/types/shared'
import type { DisplayMode } from '@renderer/hooks/useSubtitleDisplayMode'
import { WordCard } from '@renderer/components/WordCard/WordCard'

// 导入样式
import styles from './Subtitle.module.css'

const { Text } = Typography

interface SubtitleProps {
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

export function Subtitle({
  currentSubtitle,
  isPlaying,
  displayMode,
  onDisplayModeChange,
  onToggleDisplayMode,
  onWordHover,
  onPauseOnHover
}: SubtitleProps): React.JSX.Element {
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [expandDirection, setExpandDirection] = useState<'up' | 'down'>('up')
  const [selectedWord, setSelectedWord] = useState<{
    word: string
    element: HTMLElement
  } | null>(null)
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
        console.log('触发暂停视频')
        onPauseOnHover()
      }
    },
    [onWordHover, onPauseOnHover, isPlaying]
  )

  // 处理单词点击事件
  const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
    // 阻止事件冒泡
    event.stopPropagation()

    // 过滤掉空白字符
    const trimmedWord = word.trim()
    if (trimmedWord === '') {
      return
    }

    // 保存单词元素的引用，用于动态计算位置
    const wordElement = event.target as HTMLElement

    setSelectedWord({
      word: trimmedWord,
      element: wordElement
    })
  }, [])

  // 关闭单词卡片
  const handleCloseWordCard = useCallback(() => {
    setSelectedWord(null)
  }, [])

  // 检测文本是否主要包含中文字符
  const isChinese = useCallback((text: string): boolean => {
    const chineseRegex = /[\u4e00-\u9fff]/g
    const chineseMatches = text.match(chineseRegex)
    const chineseCount = chineseMatches ? chineseMatches.length : 0
    const totalChars = text.replace(/\s/g, '').length
    return totalChars > 0 && chineseCount / totalChars > 0.5
  }, [])

  // 将中文文本分割成字符
  const splitChineseText = useCallback(
    (text: string) => {
      return (
        <span
          className={styles.subtitleWord}
          onMouseEnter={() => handleWordHover(true)}
          onMouseLeave={() => handleWordHover(false)}
        >
          {text}
        </span>
      )
    },
    [handleWordHover]
  )

  // 将英文文本分割成单词
  const splitEnglishText = useCallback(
    (text: string) => {
      const words = text.split(/(\s+)/).map((word, index) => {
        if (word.trim() === '') {
          return <span key={index}>{word}</span>
        }

        // 一个单词的首尾不应该有特殊符号
        const trimWord = word.replace(/^[^\w\s]+|[^\w\s]+$/g, '')

        const isClickableWord = trimWord.trim() !== ''

        return (
          <span
            key={index}
            className={`${styles.subtitleWord} ${isClickableWord ? styles.clickableWord : ''}`}
            onMouseEnter={() => handleWordHover(true)}
            onMouseLeave={() => handleWordHover(false)}
            onClick={isClickableWord ? (e) => handleWordClick(trimWord, e) : undefined}
            style={{ cursor: isClickableWord ? 'pointer' : 'default' }}
          >
            {word}
          </span>
        )
      })

      return words
    },
    [handleWordHover, handleWordClick]
  )

  // 智能分割文本（根据语言类型选择分割方式）
  const splitTextIntoWords = useCallback(
    (text: string) => {
      if (isChinese(text)) {
        return splitChineseText(text)
      } else {
        return splitEnglishText(text)
      }
    },
    [isChinese, splitChineseText, splitEnglishText]
  )

  // 获取当前模式的配置
  // 确保 displayMode 是有效的，如果不是则使用默认值 'bilingual'
  const validDisplayMode = Object.keys(DISPLAY_MODE_CONFIG).includes(displayMode)
    ? displayMode
    : 'bilingual'
  const currentModeConfig = DISPLAY_MODE_CONFIG[validDisplayMode]

  // 根据显示模式渲染字幕内容
  const renderSubtitleContent = useMemo(() => {
    if (!currentSubtitle || displayMode === 'none') {
      return (
        <div className={styles.subtitlePlaceholder}>
          {/* <Text className={styles.subtitleHidden}>
            {displayMode === 'none' ? '字幕已隐藏' : '当前没有字幕'}
          </Text> */}
        </div>
      )
    }

    const { text, englishText, chineseText } = currentSubtitle

    switch (displayMode) {
      case 'original':
        return (
          <div className={styles.subtitleContentOriginal}>
            <Text className={styles.subtitleText}>{splitTextIntoWords(text)}</Text>
          </div>
        )

      case 'chinese':
        if (chineseText) {
          return (
            <div className={styles.subtitleContentChinese}>
              <Text className={styles.subtitleText}>{splitTextIntoWords(chineseText)}</Text>
            </div>
          )
        }
        return (
          <div className={styles.subtitlePlaceholder}>
            <Text className={styles.subtitleHidden}>没有中文字幕</Text>
          </div>
        )

      case 'english':
        if (englishText) {
          return (
            <div className={styles.subtitleContentEnglish}>
              <Text className={styles.subtitleText}>{splitTextIntoWords(englishText)}</Text>
            </div>
          )
        }
        return (
          <div className={styles.subtitlePlaceholder}>
            <Text className={styles.subtitleHidden}>没有英文字幕</Text>
          </div>
        )

      case 'bilingual':
        return (
          <div className={styles.subtitleContentBilingual}>
            {englishText && (
              <div className={`${styles.subtitleLine} english`}>
                <Text className={`${styles.subtitleText} english`}>
                  {splitTextIntoWords(englishText)}
                </Text>
              </div>
            )}
            {chineseText && (
              <div className={`${styles.subtitleLine} chinese`}>
                <Text className={`${styles.subtitleText} chinese`}>
                  {splitTextIntoWords(chineseText)}
                </Text>
              </div>
            )}
            {!englishText && !chineseText && (
              <div className={`${styles.subtitleLine} original`}>
                <Text className={styles.subtitleText}>{splitTextIntoWords(text)}</Text>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }, [currentSubtitle, displayMode, splitTextIntoWords])

  return (
    <div className={styles.subtitleContainer}>
      {/* 浮动控制按钮 */}
      <div className={styles.subtitleDisplayControlsFloating} ref={controlsRef}>
        <Space size="small">
          {/* 模式指示器 - 仅显示图标 */}
          <Tooltip title={`当前模式: ${currentModeConfig.label}`}>
            <Button
              type="text"
              size="small"
              icon={currentModeConfig.icon}
              style={{ color: currentModeConfig.color }}
            />
          </Tooltip>

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
            className={`${styles.subtitleModeSelector} ${expandDirection === 'down' ? styles.expandDown : ''}`}
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

      {/* 字幕内容区域 */}
      <div className={styles.subtitleContent}>{renderSubtitleContent}</div>

      {/* 单词卡片 - 使用固定定位渲染在根级别 */}
      {selectedWord && (
        <WordCard
          word={selectedWord.word}
          targetElement={selectedWord.element}
          onClose={handleCloseWordCard}
        />
      )}
    </div>
  )
}
