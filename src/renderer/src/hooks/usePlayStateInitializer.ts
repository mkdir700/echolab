import { useEffect, useState, useRef } from 'react'
import { useRecentPlayList } from './useRecentPlayList'
import { FileSystemHelper } from '@renderer/utils/fileSystemHelper'
import { parseSubtitles } from '@renderer/utils/subtitleParser'
import type { SubtitleItem } from '@types_/shared'
import type { PlayingVideoContextType } from '@renderer/contexts/playing-video-context'

interface UsePlayStateInitializerProps {
  /** 播放视频上下文 */
  playingVideoContext: PlayingVideoContextType
  /** 字幕数据 */
  subtitles: SubtitleItem[]
  /** 是否显示提示导入字幕的模态框 */
  showSubtitleModal: boolean
  /** 视频播放器恢复状态函数 */
  restoreVideoState: (currentTime: number, playbackRate: number, volume: number) => void
  /** 字幕恢复函数 */
  restoreSubtitles: (subtitles: SubtitleItem[], index: number) => void
  /** 保存播放状态的函数引用 */
  savePlayStateRef: React.RefObject<((force?: boolean) => Promise<void>) | null>
}

interface UsePlayStateInitializerReturn {
  /** 待处理的视频信息 */
  pendingVideoInfo: { filePath: string; fileName: string } | null
  /** 是否显示字幕模态框 */
  showSubtitleModal: boolean
  /** 设置待处理的视频信息 */
  setPendingVideoInfo: (info: { filePath: string; fileName: string } | null) => void
  /** 设置是否显示字幕模态框 */
  setShowSubtitleModal: (show: boolean) => void
}

/**
 * 播放状态初始化 Hook
 * @description 负责恢复保存的播放进度、字幕数据，以及自动检测字幕文件
 * @param props 参数
 * @param props.playingVideoContext 播放视频上下文
 * @param props.subtitles 字幕数据
 * @param props.restoreVideoState 恢复视频状态
 * @param props.restoreSubtitles 恢复字幕数据
 * @param props.savePlayStateRef 保存播放状态的函数引用
 */
export function usePlayStateInitializer({
  playingVideoContext,
  subtitles,
  restoreVideoState,
  restoreSubtitles,
  savePlayStateRef
}: UsePlayStateInitializerProps): UsePlayStateInitializerReturn {
  const { getRecentPlayByPath, addRecentPlay } = useRecentPlayList()

  const [pendingVideoInfo, setPendingVideoInfo] = useState<{
    filePath: string
    fileName: string
  } | null>(null)

  const [showSubtitleModal, setShowSubtitleModal] = useState(false)

  // 使用 ref 来存储函数引用，避免作为依赖
  const restoreVideoStateRef = useRef(restoreVideoState)
  const restoreSubtitlesRef = useRef(restoreSubtitles)
  const getRecentPlayByPathRef = useRef(getRecentPlayByPath)
  const addRecentPlayRef = useRef(addRecentPlay)

  // 更新 ref 的值
  restoreVideoStateRef.current = restoreVideoState
  restoreSubtitlesRef.current = restoreSubtitles
  getRecentPlayByPathRef.current = getRecentPlayByPath
  addRecentPlayRef.current = addRecentPlay

  // 初始化播放状态
  useEffect(() => {
    console.log('🔍 usePlayStateInitializer useEffect 触发:', {
      originalFilePath: playingVideoContext.originalFilePath,
      videoFile: playingVideoContext.videoFile,
      videoFileName: playingVideoContext.videoFileName,
      subtitlesLength: subtitles.length
    })

    // region 检测并加载同名字幕文件
    const detectAndLoadSubtitles = async (videoPath: string): Promise<boolean> => {
      const videoDir = FileSystemHelper.getDirectoryPath(videoPath)
      const videoBaseName = FileSystemHelper.getFileName(videoPath).replace(/\.[^/.]+$/, '')
      const subtitleExtensions = ['srt', 'vtt', 'json']

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
              restoreSubtitlesRef.current(parsed, 0)

              // 立即保存字幕数据
              setTimeout(async () => {
                if (savePlayStateRef.current) {
                  console.log('📝 自动检测字幕完成，立即保存字幕数据')
                  await savePlayStateRef.current(true)
                }
              }, 100) // 稍微延迟以确保字幕状态已更新

              return true
            }
          }
        }
      }
      return false
    }
    // endregion

    // region 初始化播放状态
    const loadPlayState = async (): Promise<void> => {
      console.log('🚀 loadPlayState 开始执行:', {
        originalFilePath: playingVideoContext.originalFilePath,
        videoFile: playingVideoContext.videoFile,
        hasOriginalFilePath: !!playingVideoContext.originalFilePath,
        hasVideoFile: !!playingVideoContext.videoFile
      })

      if (!playingVideoContext.originalFilePath || !playingVideoContext.videoFile) {
        console.log('❌ loadPlayState 提前返回: 缺少必要的文件信息')
        return
      }

      try {
        // 获取保存的播放记录
        const recent = await getRecentPlayByPathRef.current(playingVideoContext.originalFilePath)
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
            restoreVideoStateRef.current(
              recent.currentTime,
              1, // 使用默认播放速度
              0.8 // 使用默认音量
            )
          }

          // 恢复字幕数据
          let hasRestoredSubtitles = false
          if (recent.subtitles && recent.subtitles.length > 0) {
            console.log('📝 恢复字幕数据:', recent.subtitles.length, '条字幕')
            restoreSubtitlesRef.current(recent.subtitles, recent.subtitleIndex || 0)
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

          await addRecentPlayRef.current({
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
      if (subtitles.length === 0) {
        const found = await detectAndLoadSubtitles(playingVideoContext.originalFilePath)

        if (!found) {
          setPendingVideoInfo({
            filePath: playingVideoContext.originalFilePath,
            fileName: playingVideoContext.videoFileName || ''
          })
          setShowSubtitleModal(true)
        }
      }
    }
    // endregion

    loadPlayState()
  }, [playingVideoContext, subtitles.length, savePlayStateRef])

  return {
    pendingVideoInfo,
    setPendingVideoInfo,
    showSubtitleModal,
    setShowSubtitleModal
  }
}
