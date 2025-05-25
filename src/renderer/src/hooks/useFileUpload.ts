import { useState, useCallback, useEffect } from 'react'
import { message } from 'antd'
import { VideoFileState } from '../types'
import { isValidVideoFile, cleanupBlobUrl } from '../utils/helpers'
import { FileSystemHelper } from '../utils/fileSystemHelper'

interface UseFileUploadReturn extends VideoFileState {
  handleVideoUpload: (file: File) => boolean
  handleVideoFileSelect: () => Promise<boolean>
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
  const handleVideoFileSelect = useCallback(async (): Promise<boolean> => {
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
        message.error('无法访问选择的视频文件')
        return false
      }

      // 清理之前的 URL
      cleanupBlobUrl(state.videoFile)

      const fileName = FileSystemHelper.getFileName(filePath)

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
  }, [state.videoFile])

  // 视频文件上传处理（拖拽或选择文件）
  const handleVideoUpload = useCallback(
    (file: File): boolean => {
      // 检查文件类型
      if (!isValidVideoFile(file)) {
        message.error('不支持的视频格式，请选择 MP4、AVI、MOV、MKV、WebM 或 OGG 格式的视频文件')
        return false
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
