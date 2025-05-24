import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import ReactPlayer from 'react-player'
import { Layout, Button, Upload, Slider, message, Space, Typography, Tooltip, List } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  ReloadOutlined,
  UploadOutlined,
  FileAddOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  MessageOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { parseSubtitles, SubtitleItem } from './utils/subtitleParser'
import './App.css'

const { Header, Content } = Layout
const { Text, Title } = Typography

// 节流函数
function throttle<T extends (...args: never[]) => unknown>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  return ((...args: Parameters<T>) => {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(
        () => {
          func(...args)
          lastExecTime = Date.now()
        },
        delay - (currentTime - lastExecTime)
      )
    }
  }) as T
}

// 字幕项组件的Props接口
interface SubtitleListItemProps {
  item: SubtitleItem
  index: number
  isActive: boolean
  onSeek: (time: number) => void
  formatTime: (time: number) => string
}

// 字幕项组件 - 使用React.memo避免不必要的重渲染
const SubtitleListItem = React.memo<SubtitleListItemProps>(
  ({ item, index, isActive, onSeek, formatTime }) => {
    const handleClick = useCallback(() => {
      onSeek(item.startTime)
    }, [item.startTime, onSeek])

    return (
      <List.Item
        key={index}
        className={`subtitle-item ${isActive ? 'subtitle-item-active' : ''}`}
        onClick={handleClick}
        style={{
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '6px',
          marginBottom: '4px',
          backgroundColor: isActive ? 'var(--accent-color-light)' : 'transparent',
          border: isActive ? '1px solid var(--accent-color)' : '1px solid transparent',
          transition: 'all 0.3s ease',
          transform: isActive ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
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

function App(): React.JSX.Element {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [videoFile, setVideoFile] = useState<string | null>(null)
  const [videoFileName, setVideoFileName] = useState<string>('')
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([])
  const [volume, setVolume] = useState(1)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(380)
  const [isDragging, setIsDragging] = useState(false)
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1)
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true)

  const playerRef = useRef<ReactPlayer>(null)
  const subtitleListRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const userScrollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoScrollingRef = useRef(false)

  // 使用useMemo优化formatTime函数
  const formatTime = useMemo(() => {
    return (time: number): string => {
      const hours = Math.floor(time / 3600)
      const minutes = Math.floor((time % 3600) / 60)
      const seconds = Math.floor(time % 60)

      if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  }, [])

  // 当前字幕索引 - 用于自动滚动
  const currentSubtitleIndexMemo = useMemo(() => {
    return subtitles.findIndex((sub) => currentTime >= sub.startTime && currentTime <= sub.endTime)
  }, [subtitles, currentTime])

  const handlePlayPause = useCallback(() => {
    if (isVideoLoaded && !videoError) {
      setIsPlaying(!isPlaying)
    } else if (videoError) {
      message.error('视频加载失败，请重新选择视频文件')
    } else {
      message.warning('视频正在加载中，请稍候...')
    }
  }, [isPlaying, isVideoLoaded, videoError])

  const handleProgress = useCallback((progress: { played: number; playedSeconds: number }) => {
    setCurrentTime(progress.playedSeconds)
  }, [])

  const handleSeek = useCallback(
    (value: number) => {
      if (playerRef.current && isVideoLoaded) {
        playerRef.current.seekTo(value, 'seconds')
        setCurrentTime(value)
      }
    },
    [isVideoLoaded]
  )

  const handlePlaybackRateChange = useCallback((value: number) => {
    setPlaybackRate(value)
  }, [])

  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value)
  }, [])

  const handleStepBackward = useCallback(() => {
    if (isVideoLoaded) {
      const newTime = Math.max(0, currentTime - 5)
      handleSeek(newTime)
    }
  }, [currentTime, handleSeek, isVideoLoaded])

  const handleStepForward = useCallback(() => {
    if (isVideoLoaded) {
      const newTime = Math.min(duration, currentTime + 5)
      handleSeek(newTime)
    }
  }, [currentTime, duration, handleSeek, isVideoLoaded])

  const handleRestart = useCallback(() => {
    if (isVideoLoaded) {
      handleSeek(0)
    }
  }, [handleSeek, isVideoLoaded])

  const handleVideoUpload = useCallback(
    (file: File) => {
      // 检查文件类型
      const validTypes = [
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/mkv',
        'video/webm',
        'video/ogg'
      ]
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|avi|mov|mkv|webm|ogg)$/i)) {
        message.error('不支持的视频格式，请选择 MP4、AVI、MOV、MKV、WebM 或 OGG 格式的视频文件')
        return false
      }

      // 清理之前的 URL
      if (videoFile) {
        URL.revokeObjectURL(videoFile)
      }

      // 重置状态
      setVideoError(null)
      setIsVideoLoaded(false)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)

      // 创建新的 URL
      const url = URL.createObjectURL(file)
      console.log('Created blob URL:', url)
      console.log('File info:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      })

      setVideoFile(url)
      setVideoFileName(file.name)

      message.success({
        content: `视频文件 ${file.name} 已加载`,
        icon: <VideoCameraOutlined style={{ color: '#52c41a' }} />
      })
      return false
    },
    [videoFile]
  )

  const handleSubtitleUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedSubtitles = parseSubtitles(content, file.name)
        setSubtitles(parsedSubtitles)
        message.success({
          content: `字幕文件 ${file.name} 已导入，共 ${parsedSubtitles.length} 条字幕`,
          icon: <MessageOutlined style={{ color: '#52c41a' }} />
        })
      } catch (error) {
        message.error({
          content: `字幕文件解析失败: ${(error as Error).message}`,
          icon: <FileAddOutlined style={{ color: '#ff4d4f' }} />
        })
      }
    }
    reader.readAsText(file)
    return false
  }, [])

  const handleVideoReady = useCallback(() => {
    setIsVideoLoaded(true)
    setVideoError(null)
    message.success('视频加载完成，可以开始播放了！')
  }, [])

  const handleVideoError = useCallback(
    (error: Error | MediaError | string | null) => {
      console.error('Video player error:', error)
      console.error('Error details:', {
        error,
        videoFile,
        userAgent: navigator.userAgent,
        isElectron:
          typeof window !== 'undefined' && (window as { process?: { type?: string } }).process?.type
      })

      let errorMessage = '视频加载失败'
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error
        } else if (error instanceof MediaError) {
          switch (error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = '视频播放被中止'
              break
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = '网络错误，无法加载视频'
              break
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = '视频解码失败，可能是编解码器不支持'
              break
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = '不支持的视频格式或源'
              break
            default:
              errorMessage = '未知的视频错误'
          }
        } else if (error instanceof Error) {
          errorMessage = error.message || '视频加载失败'
        }
      }

      setVideoError(errorMessage)
      setIsVideoLoaded(false)
      setIsPlaying(false)
      message.error(`视频加载失败: ${errorMessage}`)
    },
    [videoFile]
  )

  const handleVideoDuration = useCallback((duration: number) => {
    setDuration(duration)
    if (duration > 0) {
      setIsVideoLoaded(true)
    }
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      if (e.target && (e.target as HTMLElement).tagName === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          handlePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleStepBackward()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleStepForward()
          break
        case 'KeyR':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleRestart()
          }
          break
        case 'KeyH':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setShowSubtitles(!showSubtitles)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(Math.max(0, volume - 0.1))
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [
    isPlaying,
    showSubtitles,
    volume,
    handlePlayPause,
    handleStepBackward,
    handleStepForward,
    handleRestart,
    handleVolumeChange
  ])

  // 将字幕索引映射到实际DOM索引的辅助函数
  const getActualDOMIndex = useCallback((subtitleIndex: number) => {
    if (!subtitleListRef.current || subtitleIndex < 0) return -1

    const listElement = subtitleListRef.current.querySelector('.subtitle-list')
    if (!listElement) return -1

    const antListContainer = listElement.querySelector('.ant-list-items')
    const actualContainer = antListContainer || listElement
    const actualItemsCount = actualContainer.children.length

    // 如果是虚拟滚动，我们需要找到对应的DOM项目
    // 对于Ant Design List，通常是1:1映射，除非使用了虚拟滚动
    if (subtitleIndex >= actualItemsCount) {
      // 如果请求的索引超出DOM范围，返回最后一个可用索引
      return actualItemsCount - 1
    }

    return subtitleIndex
  }, [])

  // 优化的自动滚动函数 - 让当前字幕始终保持在中间
  const scrollToCurrentSubtitle = useMemo(() => {
    return throttle((index: number) => {
      console.log(
        '🎯 scrollToCurrentSubtitle called with index:',
        index,
        'auto scroll enabled:',
        isAutoScrollEnabled
      )

      if (index === -1 || !subtitleListRef.current || subtitles.length === 0) {
        console.log('❌ Early return: index=-1 or no ref or no subtitles')
        return
      }

      // 双重检查是否启用自动滚动（防止状态在执行前发生变化）
      if (!isAutoScrollEnabled) {
        console.log('🔒 Auto scroll disabled at execution time, aborting')
        return
      }

      // 标记正在执行自动滚动
      isAutoScrollingRef.current = true
      console.log('🤖 Starting auto scroll, setting flag to true')

      // 将字幕索引映射到实际DOM索引
      const actualDOMIndex = getActualDOMIndex(index)
      if (actualDOMIndex === -1) {
        console.log('❌ Could not map to actual DOM index')
        isAutoScrollingRef.current = false
        return
      }

      console.log('🔄 Index mapping:', { originalIndex: index, actualDOMIndex })

      // 找到真正的滚动容器：.subtitle-list 元素
      const listElement = subtitleListRef.current.querySelector('.subtitle-list')
      if (!listElement) {
        console.log('❌ List element not found')
        isAutoScrollingRef.current = false
        return
      }

      console.log('📋 DOM structure analysis:', {
        totalSubtitles: subtitles.length,
        domChildren: listElement.children.length,
        listElement: listElement.tagName,
        listClasses: listElement.className
      })

      // 检查是否有Ant Design的特殊结构
      const antListContainer = listElement.querySelector('.ant-list-items')
      const actualContainer = antListContainer || listElement
      const actualItemsCount = actualContainer.children.length

      console.log('📋 Actual container analysis:', {
        antListContainer: !!antListContainer,
        actualContainer: actualContainer.tagName + '.' + actualContainer.className,
        actualItemsCount
      })

      if (actualDOMIndex >= actualItemsCount) {
        console.log('❌ DOM Index out of bounds:', { actualDOMIndex, actualItemsCount })
        isAutoScrollingRef.current = false
        return
      }

      const currentItem = actualContainer.children[actualDOMIndex] as HTMLElement
      if (!currentItem) {
        console.log('❌ Current item not found at DOM index:', actualDOMIndex)
        isAutoScrollingRef.current = false
        return
      }

      console.log('✅ Found elements:', {
        listElement: listElement.className,
        currentItem: currentItem.className,
        scrollHeight: listElement.scrollHeight,
        clientHeight: listElement.clientHeight
      })

      const listRect = listElement.getBoundingClientRect()
      const itemRect = currentItem.getBoundingClientRect()

      // 如果字幕列表很短，不需要滚动
      if (listElement.scrollHeight <= listRect.height) {
        console.log('📏 List is short, no need to scroll')
        isAutoScrollingRef.current = false
        return // 整个列表都可见，不需要滚动
      }

      // 计算当前元素相对于滚动容器的位置
      const itemTopRelativeToList = itemRect.top - listRect.top + listElement.scrollTop
      const itemHeight = itemRect.height
      const listHeight = listRect.height

      // 计算目标滚动位置：让当前项目在列表中央
      let targetScrollTop = itemTopRelativeToList - listHeight / 2 + itemHeight / 2

      // 确保滚动位置在合理范围内
      const maxScrollTop = listElement.scrollHeight - listHeight
      targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop))

      // 特殊处理：如果是列表开头或结尾的几个项目，调整滚动策略
      const totalItems = actualItemsCount // 使用实际DOM项目数量
      const isNearStart = actualDOMIndex < 3 // 前3个项目
      const isNearEnd = actualDOMIndex >= totalItems - 3 // 后3个项目

      if (isNearStart) {
        // 靠近开头时，适当向上偏移，给前面的字幕留出空间
        targetScrollTop = Math.max(0, targetScrollTop - listHeight * 0.1)
      } else if (isNearEnd) {
        // 靠近结尾时，适当向下偏移，给后面的字幕留出空间
        targetScrollTop = Math.min(maxScrollTop, targetScrollTop + listHeight * 0.1)
      }

      // 检查是否需要滚动 - 减少容差提高精确度
      const currentScrollTop = listElement.scrollTop
      const scrollDifference = Math.abs(targetScrollTop - currentScrollTop)
      const minScrollThreshold = 8 // 最小滚动阈值，避免微小的滚动

      console.log('📊 Scroll calculation:', {
        currentScrollTop,
        targetScrollTop,
        scrollDifference,
        minScrollThreshold,
        willScroll: scrollDifference > minScrollThreshold
      })

      if (scrollDifference > minScrollThreshold) {
        console.log('🚀 Scrolling to:', targetScrollTop)
        listElement.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        })
      } else {
        console.log('⏸️ No scroll needed, difference too small')
      }

      // 自动滚动完成后，短暂延迟再解除标记，避免立即触发用户滚动检测
      setTimeout(() => {
        isAutoScrollingRef.current = false
        console.log('🤖 Auto scroll completed, clearing flag')
      }, 500) // 增加延迟时间，确保滚动动画完全完成
    }, 50) // 减少节流时间，提高响应性
  }, [subtitles.length, getActualDOMIndex, isAutoScrollEnabled])

  // 重置用户滚动定时器
  const resetUserScrollTimer = useCallback(() => {
    if (userScrollTimerRef.current) {
      clearTimeout(userScrollTimerRef.current)
    }

    userScrollTimerRef.current = setTimeout(() => {
      console.log('⏰ 5秒超时，重新启用自动滚动')
      setIsAutoScrollEnabled(true)
    }, 5000) // 5秒后重新启用自动滚动
  }, [])

  // 处理用户滚动事件
  const handleUserScroll = useCallback(() => {
    // 如果正在执行自动滚动，忽略此次滚动事件
    if (isAutoScrollingRef.current) {
      console.log('🤖 Ignoring scroll event during auto scroll')
      return
    }

    console.log('👆 User manual scroll detected - current auto scroll state:', isAutoScrollEnabled)

    // 立即禁用自动滚动（如果当前是启用状态）
    if (isAutoScrollEnabled) {
      console.log('🔒 Immediately disabling auto scroll due to user interaction')
      setIsAutoScrollEnabled(false)
    }

    // 重置定时器
    resetUserScrollTimer()
  }, [isAutoScrollEnabled, resetUserScrollTimer])

  // 监听字幕索引变化并自动滚动
  useEffect(() => {
    if (currentSubtitleIndexMemo !== currentSubtitleIndex) {
      setCurrentSubtitleIndex(currentSubtitleIndexMemo)
      // 只有在启用自动滚动时才执行滚动操作
      if (currentSubtitleIndexMemo >= 0 && isAutoScrollEnabled) {
        console.log('📺 Auto scroll triggered for subtitle index:', currentSubtitleIndexMemo)
        // 使用双重 requestAnimationFrame 确保 DOM 完全更新后再滚动
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToCurrentSubtitle(currentSubtitleIndexMemo)
          })
        })
      } else if (currentSubtitleIndexMemo >= 0 && !isAutoScrollEnabled) {
        console.log('🔒 Auto scroll skipped - disabled by user')
      }
    }
  }, [currentSubtitleIndexMemo, currentSubtitleIndex, scrollToCurrentSubtitle, isAutoScrollEnabled])

  // 监听用户滚动事件
  useEffect(() => {
    const subtitleListContainer = subtitleListRef.current
    if (!subtitleListContainer) {
      console.log('❌ No subtitle list container found')
      return
    }

    // 尝试找到实际的滚动容器
    const listElement = subtitleListContainer.querySelector('.subtitle-list')
    if (!listElement) {
      console.log('❌ No .subtitle-list element found')
      return
    }

    console.log('📜 Adding scroll event listener to:', listElement.className)

    // 添加滚动事件监听器
    listElement.addEventListener('scroll', handleUserScroll, { passive: true })

    return () => {
      console.log('📜 Removing scroll event listener')
      listElement.removeEventListener('scroll', handleUserScroll)
    }
  }, [handleUserScroll, subtitles.length]) // 依赖subtitles.length确保在列表重新渲染后重新绑定

  // 清理定时器
  useEffect(() => {
    return () => {
      if (userScrollTimerRef.current) {
        clearTimeout(userScrollTimerRef.current)
        userScrollTimerRef.current = null
      }
    }
  }, [])

  // 处理拖拽调整侧边栏宽度 - 添加节流优化
  const handleMouseMove = useMemo(() => {
    return throttle((e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newSidebarWidth = containerRect.right - e.clientX
      const minWidth = 280
      const maxWidth = Math.min(600, containerRect.width * 0.6)

      setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, newSidebarWidth)))
    }, 16) // 60fps
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 拖拽事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  // 组件卸载时清理 URL
  useEffect(() => {
    return () => {
      if (videoFile) {
        URL.revokeObjectURL(videoFile)
      }
    }
  }, [videoFile])

  // 手动定位到当前字幕的函数
  const handleCenterCurrentSubtitle = useCallback(() => {
    console.log('🎯 Manual center called, currentSubtitleIndex:', currentSubtitleIndex)
    if (currentSubtitleIndex >= 0) {
      // 手动定位时重新启用自动滚动
      setIsAutoScrollEnabled(true)

      // 清除现有的用户滚动定时器
      if (userScrollTimerRef.current) {
        clearTimeout(userScrollTimerRef.current)
        userScrollTimerRef.current = null
      }

      scrollToCurrentSubtitle(currentSubtitleIndex)
    }
  }, [currentSubtitleIndex, scrollToCurrentSubtitle])

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-left">
          <Title level={4} style={{ color: '#ffffff', margin: 0 }}>
            🎬 EchoLab
          </Title>
          {videoFileName && (
            <Space style={{ marginLeft: 16 }}>
              <VideoCameraOutlined style={{ color: '#ffffff', opacity: 0.8 }} />
              <Text style={{ color: '#ffffff', opacity: 0.8, fontSize: 12 }}>{videoFileName}</Text>
              {isVideoLoaded && <Text style={{ color: '#52c41a', fontSize: 12 }}>✓ 已就绪</Text>}
            </Space>
          )}
        </div>
        <Space size="middle">
          <Upload accept="video/*" beforeUpload={handleVideoUpload} showUploadList={false}>
            <Tooltip title="支持 MP4, AVI, MOV 等格式">
              <Button
                icon={<UploadOutlined />}
                style={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#ffffff',
                  background: 'transparent'
                }}
              >
                打开视频
              </Button>
            </Tooltip>
          </Upload>
          <Upload
            accept=".json,.srt,.vtt"
            beforeUpload={handleSubtitleUpload}
            showUploadList={false}
          >
            <Tooltip title="支持 JSON, SRT, VTT 格式">
              <Button
                icon={<FileAddOutlined />}
                style={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#ffffff',
                  background: 'transparent'
                }}
              >
                导入字幕
              </Button>
            </Tooltip>
          </Upload>
          {subtitles.length > 0 && (
            <Space>
              <MessageOutlined style={{ color: '#ffffff', opacity: 0.8 }} />
              <Text style={{ color: '#ffffff', opacity: 0.8 }}>{subtitles.length} 条字幕</Text>
            </Space>
          )}
        </Space>
      </Header>

      <Content className="app-content">
        <div className="main-container" ref={containerRef}>
          {/* 左侧：视频播放区域 */}
          <div className="video-section" style={{ width: `calc(100% - ${sidebarWidth}px)` }}>
            <div
              className="video-container"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              {videoFile ? (
                <>
                  <ReactPlayer
                    ref={playerRef}
                    url={videoFile}
                    className="video-player"
                    width="100%"
                    height="100%"
                    playing={isPlaying}
                    volume={volume}
                    playbackRate={playbackRate}
                    onProgress={handleProgress}
                    onDuration={handleVideoDuration}
                    onReady={handleVideoReady}
                    onError={handleVideoError}
                    controls={false}
                    progressInterval={100}
                    config={{
                      file: {
                        attributes: {
                          controlsList: 'nodownload',
                          disablePictureInPicture: false,
                          preload: 'metadata',
                          crossOrigin: 'anonymous'
                        },
                        forceHLS: false,
                        forceDASH: false,
                        forceVideo: true
                      }
                    }}
                  />

                  {/* 加载状态提示 */}
                  {!isVideoLoaded && !videoError && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#ffffff',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '16px 24px',
                        borderRadius: '8px',
                        zIndex: 10
                      }}
                    >
                      <Space>
                        <div className="loading-spinner" />
                        <Text style={{ color: '#ffffff' }}>正在加载视频...</Text>
                      </Space>
                    </div>
                  )}

                  {/* 错误状态提示 */}
                  {videoError && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#ff4d4f',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '16px 24px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        zIndex: 10
                      }}
                    >
                      <Text style={{ color: '#ff4d4f' }}>{videoError}</Text>
                    </div>
                  )}

                  {/* 悬浮控制条 */}
                  <div className={`video-controls-overlay ${showControls ? 'show' : ''}`}>
                    {/* 进度条 */}
                    <div className="video-progress-bar">
                      <Slider
                        min={0}
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        tooltip={{ formatter: (value) => formatTime(value || 0) }}
                        className="progress-slider-overlay"
                        disabled={!isVideoLoaded}
                      />
                      <div className="time-display">
                        <Text className="time-text">{formatTime(currentTime)}</Text>
                        <Text className="time-text">{formatTime(duration)}</Text>
                      </div>
                    </div>

                    {/* 控制按钮 */}
                    <div className="video-controls-buttons">
                      <Space size="middle">
                        <Button
                          icon={<StepBackwardOutlined />}
                          onClick={handleStepBackward}
                          size="large"
                          type="text"
                          className="control-btn"
                          disabled={!isVideoLoaded}
                        />
                        <Button
                          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                          onClick={handlePlayPause}
                          size="large"
                          type="primary"
                          className="control-btn play-btn"
                          disabled={!isVideoLoaded && !videoError}
                        />
                        <Button
                          icon={<StepForwardOutlined />}
                          onClick={handleStepForward}
                          size="large"
                          type="text"
                          className="control-btn"
                          disabled={!isVideoLoaded}
                        />
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={handleRestart}
                          size="large"
                          type="text"
                          className="control-btn"
                          disabled={!isVideoLoaded}
                        />
                      </Space>

                      <Space size="middle" className="secondary-controls">
                        {/* 播放速度 */}
                        <div className="control-group">
                          <ThunderboltOutlined className="control-icon" />
                          <Text className="control-label">{playbackRate}x</Text>
                          <Slider
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={playbackRate}
                            onChange={handlePlaybackRateChange}
                            className="control-slider"
                            disabled={!isVideoLoaded}
                          />
                        </div>

                        {/* 音量 */}
                        <div className="control-group">
                          <SoundOutlined className="control-icon" />
                          <Text className="control-label">{Math.round(volume * 100)}%</Text>
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={volume}
                            onChange={handleVolumeChange}
                            className="control-slider"
                          />
                        </div>

                        {/* 字幕切换 */}
                        <Button
                          icon={showSubtitles ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                          onClick={() => setShowSubtitles(!showSubtitles)}
                          type={showSubtitles ? 'primary' : 'default'}
                          className="control-btn subtitle-btn"
                        >
                          字幕
                        </Button>
                      </Space>
                    </div>
                  </div>
                </>
              ) : (
                <div className="video-placeholder">
                  <Space direction="vertical" align="center" size="large">
                    <VideoCameraOutlined style={{ fontSize: 48, color: 'var(--accent-color)' }} />
                    <Text
                      style={{ color: 'var(--text-secondary)', fontSize: 16, textAlign: 'center' }}
                    >
                      拖拽视频文件到此处或点击&ldquo;打开视频&rdquo;按钮
                    </Text>
                    <Text style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                      支持 MP4, AVI, MOV, MKV 等格式
                    </Text>
                  </Space>
                </div>
              )}
            </div>
          </div>

          {/* 拖拽分割线 */}
          <div
            className={`resize-handle ${isDragging ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
          />

          {/* 右侧：字幕列表区域 */}
          <div className="sidebar-section" style={{ width: `${sidebarWidth}px` }}>
            {/* 字幕列表显示 */}
            <div className="subtitle-list-container-no-header">
              {subtitles.length > 0 && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
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
                    {/* 测试滚动按钮 */}
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        console.log('🧪 Test scroll to middle')

                        // 获取实际可见的字幕项目数量
                        if (!subtitleListRef.current) {
                          console.log('❌ No subtitle list ref')
                          return
                        }

                        const listElement = subtitleListRef.current.querySelector('.subtitle-list')
                        if (!listElement) {
                          console.log('❌ No list element found')
                          return
                        }

                        // 检查Ant Design的实际容器
                        const antListContainer = listElement.querySelector('.ant-list-items')
                        const actualContainer = antListContainer || listElement
                        const actualItemsCount = actualContainer.children.length

                        console.log('🧪 Test analysis:', {
                          totalSubtitles: subtitles.length,
                          actualDOMItems: actualItemsCount
                        })

                        if (actualItemsCount === 0) {
                          console.log('❌ No items in DOM')
                          return
                        }

                        // 使用实际DOM项目数量的一半
                        const middleIndex = Math.floor(actualItemsCount / 2)
                        console.log(
                          '🧪 Scrolling to middle index:',
                          middleIndex,
                          'of',
                          actualItemsCount
                        )
                        scrollToCurrentSubtitle(middleIndex)
                      }}
                      title="测试滚动到中间"
                      style={{ fontSize: 11, padding: '2px 6px' }}
                    >
                      🧪 测试
                    </Button>
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
              <div className="subtitle-list-content" ref={subtitleListRef}>
                {subtitles.length > 0 ? (
                  <List
                    size="small"
                    dataSource={subtitles}
                    className="subtitle-list"
                    renderItem={(item, index) => {
                      const isActive = currentTime >= item.startTime && currentTime <= item.endTime
                      return (
                        <SubtitleListItem
                          key={`subtitle-${item.startTime}-${index}`}
                          item={item}
                          index={index}
                          isActive={isActive}
                          onSeek={handleSeek}
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
          </div>
        </div>

        {/* 快捷键提示 */}
        <div className="shortcuts-hint">
          <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            💡 快捷键: 空格-播放/暂停 | ←→-快退/快进 | ↑↓-音量 | Ctrl+H-字幕切换
          </Text>
        </div>
      </Content>
    </Layout>
  )
}

export default App
