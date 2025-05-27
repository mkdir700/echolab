import { useState, useCallback, useEffect } from 'react'
import { message } from 'antd'
import type { VideoFileState } from '../types'
import { isValidVideoFile, cleanupBlobUrl } from '../utils/helpers'
import { FileSystemHelper } from '../utils/fileSystemHelper'

export interface UseFileUploadReturn extends VideoFileState {
  handleVideoUpload: (file: File, resetVideoState?: () => void) => boolean
  handleVideoFileSelect: (resetVideoState?: () => void) => Promise<boolean>
  clearVideoFile: () => void
  setVideoFile: (url: string, fileName: string, filePath?: string) => void
  restoreVideoFile: (filePath: string, fileName: string) => Promise<boolean>
  isLocalFile: boolean
  originalFilePath?: string
}

export function useFileUpload(): UseFileUploadReturn {
  const [state, setState] = useState<VideoFileState>({
    videoFile: null,
    videoFileName: ''
  })

  const [originalFilePath, setOriginalFilePath] = useState<string | undefined>()
  const [isLocalFile, setIsLocalFile] = useState(false)

  // 通过文件对话框选择视频文件
  const handleVideoFileSelect = useCallback(
    async (resetVideoState?: () => void): Promise<boolean> => {
      try {
        const filePaths = await FileSystemHelper.openFileDialog({
          title: '选择视频文件',
          filters: [
            {
              name: '视频文件',
              extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'ogg', 'm4v', 'flv', 'wmv']
            },
            {
              name: '所有文件',
              extensions: ['*']
            }
          ],
          properties: ['openFile']
        })

        if (!filePaths || filePaths.length === 0) {
          return false
        }

        const filePath = filePaths[0]

        // 验证文件格式
        if (!FileSystemHelper.isSupportedVideoFormat(filePath)) {
          message.error('不支持的视频格式，请选择支持的视频文件')
          return false
        }

        // 获取文件 URL
        const fileUrl = await FileSystemHelper.getVideoFileUrl(filePath)
        if (!fileUrl) {
          message.error('无法访问选择的视频文件，请检查文件路径和权限')
          return false
        }

        // 验证生成的 URL 格式
        console.log('生成的视频文件URL:', fileUrl)

        // 检查文件信息
        const fileInfo = await FileSystemHelper.getFileInfo(filePath)
        if (fileInfo) {
          console.log('视频文件信息:', {
            size: `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`,
            isFile: fileInfo.isFile,
            lastModified: new Date(fileInfo.mtime).toLocaleString()
          })
        }

        // 在设置新视频文件之前，先重置视频播放器状态
        if (resetVideoState) {
          console.log('🔄 重置视频播放器状态...')
          resetVideoState()
        }

        // 清理之前的 URL
        cleanupBlobUrl(state.videoFile)

        const fileName = FileSystemHelper.getFileName(filePath)

        // 检查视频兼容性
        const { printCompatibilityReport, supportsH265 } = await import(
          '../utils/videoCompatibility'
        )
        printCompatibilityReport()

        // 如果是 H.265 视频但不支持，给出警告
        if (fileName.toLowerCase().includes('hevc') || fileName.toLowerCase().includes('h265')) {
          if (!supportsH265()) {
            console.warn('⚠️ 检测到 H.265 视频文件，但当前环境可能不支持 H.265 解码')
            message.warning('检测到 H.265 视频文件，如果播放失败，建议转换为 H.264 格式')
          }
        }

        setState({
          videoFile: fileUrl,
          videoFileName: fileName
        })

        setOriginalFilePath(filePath)
        setIsLocalFile(true)

        console.log('✅ 通过文件对话框选择视频文件:', {
          filePath,
          fileName,
          fileUrl
        })

        message.success(`视频文件 ${fileName} 已加载`)
        return true
      } catch (error) {
        console.error('选择视频文件失败:', error)
        message.error('选择视频文件失败')
        return false
      }
    },
    [state.videoFile]
  )

  // 视频文件上传处理（拖拽或选择文件）
  const handleVideoUpload = useCallback(
    (file: File, resetVideoState?: () => void): boolean => {
      // 检查文件类型
      if (!isValidVideoFile(file)) {
        message.error('不支持的视频格式，请选择 MP4、AVI、MOV、MKV、WebM 或 OGG 格式的视频文件')
        return false
      }

      // 在设置新视频文件之前，先重置视频播放器状态
      if (resetVideoState) {
        console.log('🔄 重置视频播放器状态...')
        resetVideoState()
      }

      // 清理之前的 URL
      cleanupBlobUrl(state.videoFile)

      // 创建新的 blob URL
      const url = URL.createObjectURL(file)
      console.log('Created blob URL:', url)
      console.log('File info:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      })

      setState({
        videoFile: url,
        videoFileName: file.name
      })

      setOriginalFilePath(undefined)
      setIsLocalFile(false)

      message.success(`视频文件 ${file.name} 已加载`)
      return true
    },
    [state.videoFile]
  )

  // 清除视频文件
  const clearVideoFile = useCallback((): void => {
    cleanupBlobUrl(state.videoFile)
    setState({
      videoFile: null,
      videoFileName: ''
    })
    setOriginalFilePath(undefined)
    setIsLocalFile(false)
  }, [state.videoFile])

  // 设置视频文件（用于项目恢复）
  const setVideoFile = useCallback((url: string, fileName: string, filePath?: string): void => {
    setState({
      videoFile: url,
      videoFileName: fileName
    })

    setOriginalFilePath(filePath)
    setIsLocalFile(!!filePath && !url.startsWith('blob:'))
  }, [])

  // 恢复视频文件（用于项目恢复）
  const restoreVideoFile = useCallback(
    async (filePath: string, fileName: string): Promise<boolean> => {
      try {
        console.log('🔄 尝试恢复视频文件:', { filePath, fileName })

        // 检查文件是否存在
        const exists = await FileSystemHelper.checkFileExists(filePath)
        if (!exists) {
          console.warn('⚠️ 视频文件不存在:', filePath)
          return false
        }

        // 获取文件 URL
        const fileUrl = await FileSystemHelper.getVideoFileUrl(filePath)
        if (!fileUrl) {
          console.warn('⚠️ 无法获取视频文件 URL:', filePath)
          return false
        }

        // 清理之前的 URL
        cleanupBlobUrl(state.videoFile)

        setState({
          videoFile: fileUrl,
          videoFileName: fileName
        })

        setOriginalFilePath(filePath)
        setIsLocalFile(true)

        console.log('✅ 成功恢复视频文件:', {
          filePath,
          fileName,
          fileUrl
        })

        return true
      } catch (error) {
        console.error('恢复视频文件失败:', error)
        return false
      }
    },
    [state.videoFile]
  )

  // 组件卸载时清理 URL
  useEffect(() => {
    return (): void => {
      cleanupBlobUrl(state.videoFile)
    }
  }, [state.videoFile])

  return {
    ...state,
    handleVideoUpload,
    handleVideoFileSelect,
    clearVideoFile,
    setVideoFile,
    restoreVideoFile,
    isLocalFile,
    originalFilePath
  }
}
