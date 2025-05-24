import { useState, useCallback, useEffect } from 'react'
import { message } from 'antd'
import { VideoFileState } from '../types'
import { isValidVideoFile, cleanupBlobUrl } from '../utils/helpers'

interface UseFileUploadReturn extends VideoFileState {
  handleVideoUpload: (file: File) => boolean
  clearVideoFile: () => void
}

export function useFileUpload(): UseFileUploadReturn {
  const [state, setState] = useState<VideoFileState>({
    videoFile: null,
    videoFileName: ''
  })

  // 视频文件上传处理
  const handleVideoUpload = useCallback(
    (file: File): boolean => {
      // 检查文件类型
      if (!isValidVideoFile(file)) {
        message.error('不支持的视频格式，请选择 MP4、AVI、MOV、MKV、WebM 或 OGG 格式的视频文件')
        return false
      }

      // 清理之前的 URL
      cleanupBlobUrl(state.videoFile)

      // 创建新的 URL
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

      message.success(`视频文件 ${file.name} 已加载`)
      return false
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
  }, [state.videoFile])

  // 组件卸载时清理 URL
  useEffect(() => {
    return (): void => {
      cleanupBlobUrl(state.videoFile)
    }
  }, [state.videoFile])

  return {
    ...state,
    handleVideoUpload,
    clearVideoFile
  }
}
