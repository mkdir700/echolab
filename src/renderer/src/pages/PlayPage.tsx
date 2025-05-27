import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { VideoPlayer } from '@renderer/components/VideoPlayer/VideoPlayer'
import { VideoControlsCompact } from '@renderer/components/VideoPlayer/VideoControlsCompact'
import { SidebarSection } from '@renderer/components/SidebarSection'
import { PlayPageHeader } from '@renderer/components/PlayPageHeader'
import { SubtitleLoadModal } from '@renderer/components/SubtitleLoadModal'

// 导入所需的 hooks
import { useVideoPlayer } from '@renderer/hooks/useVideoPlayer'
import { useSubtitles } from '@renderer/hooks/useSubtitles'
import { usePlayingVideoContext } from '@renderer/contexts/usePlayingVideoContext'
import { useSidebarResize } from '@renderer/hooks/useSidebarResize'
import { useSubtitleDisplayMode } from '@renderer/hooks/useSubtitleDisplayMode'
import { useAutoScroll } from '@renderer/hooks/useAutoScroll'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts'
import { useRecentPlays } from '@renderer/hooks/useRecentPlays'
import { usePlaybackSettings } from '@renderer/hooks/usePlaybackSettings'

import type { SubtitleItem } from '@types_/shared'
import styles from './PlayPage.module.css'
import { FileSystemHelper } from '@renderer/utils/fileSystemHelper'
import { parseSubtitles } from '@renderer/utils/subtitleParser'

interface PlayPageProps {
  onBack: () => void
}

export const PlayPage = React.memo<PlayPageProps>(function PlayPage({ onBack }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 使用 hooks 获取所需的状态和方法
  const videoPlayer = useVideoPlayer()
  const subtitles = useSubtitles()
  const playingVideoContext = usePlayingVideoContext()
  const sidebarResize = useSidebarResize(containerRef)
  const subtitleDisplayMode = useSubtitleDisplayMode()
  const { updateRecentPlay, getRecentPlayByPath, addRecentPlay } = useRecentPlays()
  const playbackSettings = usePlaybackSettings()

  // 计算当前字幕索引
  const currentSubtitleIndex = subtitles.getCurrentSubtitleIndex(videoPlayer.currentTime)

  // 缓存字幕长度，避免频繁重新计算
  const subtitlesLength = useMemo(() => {
    return subtitles.subtitles.length
  }, [subtitles.subtitles.length])

  // 缓存获取字幕的函数，避免频繁重新创建
  const getSubtitle = useCallback(
    (index: number) => {
      return subtitles.subtitles[index]
    },
    [subtitles.subtitles]
  )

  // 字幕控制 Hook - 在 PlayPage 中管理
  const subtitleControl = useSubtitleControl({
    subtitlesLength,
    currentSubtitleIndex,
    currentTime: videoPlayer.currentTime,
    isPlaying: videoPlayer.isPlaying,
    isVideoLoaded: videoPlayer.isVideoLoaded,
    onSeek: videoPlayer.handleSeek,
    onPause: videoPlayer.handlePlayPause,
    // 传递获取字幕的函数而不是整个数组
    getSubtitle,
    // 传递获取所有字幕的函数，用于时间查找
    getAllSubtitles: () => subtitles.subtitles
  })

  // 保存进度的函数 - 提取到组件级别以便在 handleBack 中使用
  const saveProgressRef = useRef<((force?: boolean) => Promise<void>) | null>(null)

  const handleBack = useCallback(async () => {
    console.log('🔙 处理返回操作')
    // 退出前保存一次进度
    if (saveProgressRef.current) {
      await saveProgressRef.current(true)
    }
    onBack()
  }, [onBack])

  // 自动滚动 Hook
  const autoScroll = useAutoScroll({
    currentSubtitleIndex,
    subtitlesLength: subtitles.subtitles.length,
    isAutoScrollEnabled: playbackSettings.playbackSettings?.isAutoScrollEnabled ?? true,
    onAutoScrollChange: playbackSettings.setAutoScrollEnabled
  })

  // 快捷键处理 - 在 PlayPage 中处理字幕控制相关的快捷键
  useKeyboardShortcuts({
    onPlayPause: videoPlayer.handlePlayPause,
    onStepBackward: videoPlayer.handleStepBackward,
    onStepForward: videoPlayer.handleStepForward,
    onToggleSubtitleMode: subtitleDisplayMode.toggleDisplayMode,
    onVolumeChange: videoPlayer.handleVolumeChange,
    currentVolume: videoPlayer.volume,
    onToggleSingleLoop: subtitleControl.toggleSingleLoop,
    onToggleAutoPause: subtitleControl.toggleAutoPause,
    onGoToPreviousSubtitle: subtitleControl.goToPreviousSubtitle,
    onGoToNextSubtitle: subtitleControl.goToNextSubtitle
  })

  // 同步当前字幕索引 - 在 PlayPage 中处理
  useEffect(() => {
    if (currentSubtitleIndex !== subtitles.currentSubtitleIndex) {
      subtitles.setCurrentSubtitleIndex(currentSubtitleIndex)
    }
  }, [
    currentSubtitleIndex,
    subtitles,
    subtitles.currentSubtitleIndex,
    subtitles.setCurrentSubtitleIndex
  ])

  // 全屏状态管理
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenToggle, setFullscreenToggle] = useState<(() => void) | null>(null)

  // 字幕检查Modal状态
  const [showSubtitleModal, setShowSubtitleModal] = useState(false)
  const [pendingVideoInfo, setPendingVideoInfo] = useState<{
    filePath: string
    fileName: string
  } | null>(null)

  // 处理全屏切换函数准备就绪
  const handleFullscreenToggleReady = (toggleFn: () => void): void => {
    setFullscreenToggle(() => toggleFn)
  }

  // 全屏切换处理函数
  const handleFullscreenToggle = (): void => {
    if (fullscreenToggle) {
      fullscreenToggle()
    }
  }

  // 处理字幕Modal的回调
  const handleSubtitleModalCancel = useCallback(() => {
    setShowSubtitleModal(false)
    setPendingVideoInfo(null)
  }, [])

  const handleSubtitleModalSkip = useCallback(() => {
    setShowSubtitleModal(false)
    setPendingVideoInfo(null)
  }, [])

  const handleSubtitlesLoaded = useCallback(
    async (loadedSubtitles: SubtitleItem[]) => {
      // 加载字幕到应用状态
      subtitles.restoreSubtitles(loadedSubtitles, 0, true)
      setShowSubtitleModal(false)
      setPendingVideoInfo(null)

      // 立即保存字幕数据
      if (saveProgressRef.current) {
        console.log('📝 字幕加载完成，立即保存字幕数据')
        await saveProgressRef.current(true)
      }
    },
    [subtitles]
  )

  // 恢复保存的字幕数据和状态，或添加新视频到最近播放
  useEffect(() => {
    const initialize = async (): Promise<void> => {
      if (!playingVideoContext.originalFilePath || !playingVideoContext.videoFile) return

      try {
        // 获取保存的播放记录
        const recent = await getRecentPlayByPath(playingVideoContext.originalFilePath)
        if (recent) {
          console.log('🔄 恢复保存的数据:', recent)
          console.log('🔍 检查字幕数据:', {
            hasSubtitles: !!recent.subtitles,
            subtitlesLength: recent.subtitles?.length || 0,
            subtitleIndex: recent.subtitleIndex,
            firstSubtitle: recent.subtitles?.[0]
          })

          // 恢复播放进度
          if (recent.currentTime && recent.currentTime > 0) {
            console.log('⏰ 恢复播放进度:', recent.currentTime)
            videoPlayer.restoreVideoState(
              recent.currentTime,
              1, // 使用默认播放速度
              0.8 // 使用默认音量
            )
          }

          // 恢复字幕数据
          let hasRestoredSubtitles = false
          if (recent.subtitles && recent.subtitles.length > 0) {
            console.log('📝 恢复字幕数据:', recent.subtitles.length, '条字幕')
            subtitles.restoreSubtitles(
              recent.subtitles,
              recent.subtitleIndex || 0,
              playbackSettings.playbackSettings?.isAutoScrollEnabled ?? true
            )
            hasRestoredSubtitles = true
          }

          // 如果恢复了字幕数据，就不需要自动检测字幕文件了
          if (hasRestoredSubtitles) {
            return
          }
        } else {
          // 如果没有找到保存的记录，说明这是一个新选择的视频文件，添加到最近播放列表
          console.log('📹 检测到新视频文件，添加到最近播放:', {
            originalFilePath: playingVideoContext.originalFilePath,
            videoFileName: playingVideoContext.videoFileName
          })

          await addRecentPlay({
            filePath: playingVideoContext.originalFilePath,
            fileName: playingVideoContext.videoFileName || '',
            duration: 0,
            currentTime: 0,
            subtitleFile: undefined,
            subtitleIndex: 0
          })
        }
      } catch (error) {
        console.error('恢复保存数据失败:', error)
      }

      // 如果没有保存的字幕数据，则自动检测并导入同名字幕文件
      if (subtitles.subtitles.length === 0 && !showSubtitleModal) {
        const videoPath = playingVideoContext.originalFilePath
        const videoName = playingVideoContext.videoFileName || ''
        const videoDir = FileSystemHelper.getDirectoryPath(videoPath)
        const videoBaseName = FileSystemHelper.getFileName(videoPath).replace(/\.[^/.]+$/, '')
        const subtitleExtensions = ['srt', 'vtt', 'json']
        let found = false

        for (const ext of subtitleExtensions) {
          const isWindows = navigator.platform.toLowerCase().includes('win')
          const separator = isWindows ? '\\' : '/'
          const subtitlePath = `${videoDir}${separator}${videoBaseName}.${ext}`
          const exists = await FileSystemHelper.checkFileExists(subtitlePath)
          if (exists) {
            const content = await FileSystemHelper.readSubtitleFile(subtitlePath)
            if (content) {
              const parsed = parseSubtitles(content, `${videoBaseName}.${ext}`)
              if (parsed.length > 0) {
                console.log('📁 自动加载同名字幕文件:', subtitlePath)
                subtitles.restoreSubtitles(parsed, 0, true)
                found = true

                // 立即保存字幕数据
                setTimeout(async () => {
                  if (saveProgressRef.current) {
                    console.log('📝 自动检测字幕完成，立即保存字幕数据')
                    await saveProgressRef.current(true)
                  }
                }, 100) // 稍微延迟以确保字幕状态已更新

                break
              }
            }
          }
        }

        if (!found) {
          setPendingVideoInfo({
            filePath: videoPath,
            fileName: videoName
          })
          setShowSubtitleModal(true)
        }
      }
    }

    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    playingVideoContext.originalFilePath,
    playingVideoContext.videoFile,
    getRecentPlayByPath,
    addRecentPlay
  ])

  // 自动保存播放进度和字幕索引到最近播放
  useEffect(() => {
    // 只有当有原始文件路径时才保存进度（本地文件）
    if (!playingVideoContext.originalFilePath || !playingVideoContext.videoFile) return

    let timer: NodeJS.Timeout | null = null
    let isUnmounted = false
    let lastSavedTime = -1
    let lastSavedSubtitleIndex = -1
    let lastSavedSubtitlesLength = -1
    let recentId: string | undefined

    async function saveProgress(force = false): Promise<void> {
      if (!playingVideoContext.originalFilePath) return

      // 查找当前视频的 recentPlay 项（使用原始文件路径）
      if (!recentId) {
        const recent = await getRecentPlayByPath(playingVideoContext.originalFilePath)
        if (recent && recent.id) {
          recentId = recent.id
        } else {
          console.log('未找到对应的最近播放记录，跳过保存进度')
          return
        }
      }

      // 计算当前实际的字幕索引
      const actualCurrentSubtitleIndex = subtitles.getCurrentSubtitleIndex(videoPlayer.currentTime)

      // 只在进度有明显变化时才保存，或强制保存
      if (
        force ||
        Math.abs(videoPlayer.currentTime - lastSavedTime) > 2 ||
        actualCurrentSubtitleIndex !== lastSavedSubtitleIndex ||
        subtitles.subtitles.length !== lastSavedSubtitlesLength
      ) {
        console.log('保存播放进度:', {
          recentId,
          currentTime: videoPlayer.currentTime,
          subtitleIndex: actualCurrentSubtitleIndex,
          subtitlesCount: subtitles.subtitles.length,
          filePath: playingVideoContext.originalFilePath
        })

        const success = await updateRecentPlay(recentId, {
          currentTime: videoPlayer.currentTime,
          subtitleIndex:
            actualCurrentSubtitleIndex >= 0
              ? actualCurrentSubtitleIndex
              : subtitles.currentSubtitleIndex,
          duration: videoPlayer.duration > 0 ? videoPlayer.duration : undefined,
          subtitles: subtitles.subtitles.length > 0 ? subtitles.subtitles : undefined
        })

        if (success) {
          lastSavedTime = videoPlayer.currentTime
          lastSavedSubtitleIndex = actualCurrentSubtitleIndex
          lastSavedSubtitlesLength = subtitles.subtitles.length
        } else {
          console.error('保存播放进度失败')
        }
      }
    }

    // 将 saveProgress 函数赋值给 ref，以便在 handleBack 中使用
    saveProgressRef.current = saveProgress

    // 每5秒保存一次进度
    timer = setInterval(() => {
      if (!isUnmounted) saveProgress(false)
    }, 5000)

    return () => {
      isUnmounted = true
      if (timer) clearInterval(timer)
      // 卸载时强制保存一次
      if (!isUnmounted) {
        saveProgress(true)
      }
    }
  }, [
    playingVideoContext.originalFilePath,
    playingVideoContext.videoFile,
    videoPlayer.currentTime,
    videoPlayer.duration,
    subtitles.currentSubtitleIndex,
    subtitles.subtitles,
    getRecentPlayByPath,
    updateRecentPlay
  ])

  return (
    <div ref={containerRef} className={styles.playPageContainer}>
      {/* 播放页面独立Header */}
      <PlayPageHeader videoFileName={playingVideoContext.videoFileName} onBack={handleBack} />

      <div className={styles.playPageContent}>
        <div
          className={styles.mainContentArea}
          style={{ width: `calc(100% - ${sidebarResize.sidebarWidth}px)` }}
        >
          {/* 视频播放区域 - 占据主要空间 */}
          <div className={styles.videoPlayerSection}>
            <VideoPlayer
              videoFile={playingVideoContext.videoFile}
              playerRef={videoPlayer.playerRef}
              isPlaying={videoPlayer.isPlaying}
              volume={videoPlayer.volume}
              playbackRate={videoPlayer.playbackRate}
              currentTime={videoPlayer.currentTime}
              duration={videoPlayer.duration}
              isVideoLoaded={videoPlayer.isVideoLoaded}
              videoError={videoPlayer.videoError}
              currentSubtitle={subtitles.getCurrentSubtitle(videoPlayer.currentTime)}
              displayMode={subtitleDisplayMode.displayMode}
              onProgress={videoPlayer.handleProgress}
              onDuration={videoPlayer.handleVideoDuration}
              onReady={videoPlayer.handleVideoReady}
              onError={videoPlayer.handleVideoError}
              onSeek={videoPlayer.handleSeek}
              onStepBackward={videoPlayer.handleStepBackward}
              onPlayPause={videoPlayer.handlePlayPause}
              onStepForward={videoPlayer.handleStepForward}
              onPlaybackRateChange={videoPlayer.handlePlaybackRateChange}
              onVolumeChange={videoPlayer.handleVolumeChange}
              onFullscreenChange={setIsFullscreen}
              onFullscreenToggleReady={handleFullscreenToggleReady}
            />
          </div>

          {/* 视频控制区域 - 仅在非全屏模式下显示 */}
          {playingVideoContext.videoFile && !isFullscreen && (
            <div className={styles.videoControlsSection}>
              <VideoControlsCompact
                duration={videoPlayer.duration}
                currentTime={videoPlayer.currentTime}
                isVideoLoaded={videoPlayer.isVideoLoaded}
                isPlaying={videoPlayer.isPlaying}
                videoError={videoPlayer.videoError}
                playbackRate={videoPlayer.playbackRate}
                volume={videoPlayer.volume}
                isLooping={subtitleControl.isSingleLoop}
                autoSkipSilence={subtitleControl.isAutoPause}
                subtitlePosition="bottom"
                displayMode={subtitleDisplayMode.displayMode}
                onSeek={videoPlayer.handleSeek}
                onStepBackward={videoPlayer.handleStepBackward}
                onPlayPause={videoPlayer.handlePlayPause}
                onStepForward={videoPlayer.handleStepForward}
                onPlaybackRateChange={videoPlayer.handlePlaybackRateChange}
                onVolumeChange={videoPlayer.handleVolumeChange}
                onLoopToggle={subtitleControl.toggleSingleLoop}
                onAutoSkipToggle={subtitleControl.toggleAutoPause}
                onSubtitlePositionToggle={() => {}}
                onFullscreenToggle={handleFullscreenToggle}
                onPreviousSubtitle={subtitleControl.goToPreviousSubtitle}
                onNextSubtitle={subtitleControl.goToNextSubtitle}
                onDisplayModeChange={subtitleDisplayMode.setDisplayMode}
              />
            </div>
          )}
        </div>

        {/* 分割线 - 更细更现代 */}
        <div
          className={`${styles.resizeHandle} ${sidebarResize.isDragging ? styles.dragging : ''}`}
          onMouseDown={sidebarResize.handleMouseDown}
        />

        {/* 字幕列表区域 - 无缝集成 */}
        <div className={styles.sidebarSection} style={{ width: `${sidebarResize.sidebarWidth}px` }}>
          <SidebarSection
            subtitles={subtitles.subtitles}
            isAutoScrollEnabled={playbackSettings.playbackSettings?.isAutoScrollEnabled ?? true}
            currentSubtitleIndex={subtitles.currentSubtitleIndex}
            currentTime={videoPlayer.currentTime}
            subtitleListRef={autoScroll.subtitleListRef}
            onSeek={videoPlayer.handleSeek}
            onCenterCurrentSubtitle={autoScroll.handleCenterCurrentSubtitle}
          />
          {/* 调试信息 */}
          {process.env.NODE_ENV === 'development' && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '5px',
                fontSize: '10px',
                borderRadius: '3px',
                zIndex: 1000
              }}
            >
              字幕数量: {subtitles.subtitles.length} | 当前索引: {subtitles.currentSubtitleIndex}
            </div>
          )}
        </div>
      </div>

      {/* 字幕检查Modal - 移入PlayPage */}
      <SubtitleLoadModal
        visible={showSubtitleModal}
        videoFilePath={pendingVideoInfo?.filePath || ''}
        onCancel={handleSubtitleModalCancel}
        onSkip={handleSubtitleModalSkip}
        onSubtitlesLoaded={handleSubtitlesLoaded}
      />
    </div>
  )
})
