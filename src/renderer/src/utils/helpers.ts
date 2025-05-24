import { ThrottledFunction } from '../types'

// 节流函数
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  delay: number
): ThrottledFunction<T> {
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
  }) as ThrottledFunction<T>
}

// 时间格式化函数
export function formatTime(time: number): string {
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.floor(time % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// 媒体错误处理
export function getMediaErrorMessage(error: Error | MediaError | string | null): string {
  if (!error) return '视频加载失败'

  if (typeof error === 'string') {
    return error
  }

  if (error instanceof MediaError) {
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return '视频播放被中止'
      case MediaError.MEDIA_ERR_NETWORK:
        return '网络错误，无法加载视频'
      case MediaError.MEDIA_ERR_DECODE:
        return '视频解码失败，可能是编解码器不支持'
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return '不支持的视频格式或源'
      default:
        return '未知的视频错误'
    }
  }

  if (error instanceof Error) {
    return error.message || '视频加载失败'
  }

  return '视频加载失败'
}

// 验证视频文件格式
export function isValidVideoFile(file: File): boolean {
  const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm', 'video/ogg']
  const validExtensions = /\.(mp4|avi|mov|mkv|webm|ogg)$/i

  return validTypes.includes(file.type) || validExtensions.test(file.name)
}

// 清理 Blob URL
export function cleanupBlobUrl(url: string | null): void {
  if (url) {
    URL.revokeObjectURL(url)
  }
}
