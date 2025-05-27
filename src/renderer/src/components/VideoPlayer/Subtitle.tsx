import React, { useState, useCallback, useMemo } from 'react'
import { Typography } from 'antd'
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
  onWordHover: (isHovering: boolean) => void
  onPauseOnHover: () => void
}

export function Subtitle({
  currentSubtitle,
  isPlaying,
  displayMode,
  onWordHover,
  onPauseOnHover
}: SubtitleProps): React.JSX.Element {
  const [selectedWord, setSelectedWord] = useState<{
    word: string
    element: HTMLElement
  } | null>(null)

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
