import { useCallback } from 'react'
import { message } from 'antd'
import { RecentFileItem } from './useAppState'

interface UseRecentFilesReturn {
  addRecentFile: (
    filePath: string,
    fileName: string,
    duration?: number,
    prevFiles?: RecentFileItem[]
  ) => RecentFileItem[]
  removeRecentFile: (filePath: string, recentFiles: RecentFileItem[]) => RecentFileItem[]
  clearRecentFiles: () => RecentFileItem[]
  openRecentFile: (
    filePath: string,
    fileName: string,
    restoreVideoFile: (filePath: string, fileName: string) => Promise<boolean>
  ) => Promise<boolean>
}

export function useRecentFiles(): UseRecentFilesReturn {
  // 添加最近文件
  const addRecentFile = useCallback(
    (
      filePath: string,
      fileName: string,
      duration?: number,
      prevFiles: RecentFileItem[] = []
    ): RecentFileItem[] => {
      // 检查文件是否已存在
      const existingIndex = prevFiles.findIndex((file) => file.filePath === filePath)

      const newFile: RecentFileItem = {
        filePath,
        fileName,
        lastOpenedAt: Date.now(),
        duration
      }

      let updatedFiles: RecentFileItem[]

      if (existingIndex >= 0) {
        // 如果文件已存在，更新时间并移到最前面
        updatedFiles = [newFile, ...prevFiles.filter((_, index) => index !== existingIndex)]
      } else {
        // 如果是新文件，添加到最前面
        updatedFiles = [newFile, ...prevFiles]
      }

      // 限制最近文件数量为20个
      return updatedFiles.slice(0, 20)
    },
    []
  )

  // 移除最近文件
  const removeRecentFile = useCallback(
    (filePath: string, recentFiles: RecentFileItem[]): RecentFileItem[] => {
      const updatedFiles = recentFiles.filter((file) => file.filePath !== filePath)
      message.success('已从最近文件列表中移除')
      return updatedFiles
    },
    []
  )

  // 清空最近文件列表
  const clearRecentFiles = useCallback((): RecentFileItem[] => {
    message.success('已清空最近文件列表')
    return []
  }, [])

  // 打开最近文件
  const openRecentFile = useCallback(
    async (
      filePath: string,
      fileName: string,
      restoreVideoFile: (filePath: string, fileName: string) => Promise<boolean>
    ): Promise<boolean> => {
      try {
        console.log('🔄 尝试打开最近文件:', { filePath, fileName })

        const success = await restoreVideoFile(filePath, fileName)

        if (success) {
          console.log('✅ 成功打开最近文件:', fileName)
          message.success(`已打开视频文件: ${fileName}`)
          return true
        } else {
          console.warn('⚠️ 无法打开最近文件:', fileName)
          message.error(`无法打开文件 ${fileName}，文件可能已被移动或删除`)
          return false
        }
      } catch (error) {
        console.error('❌ 打开最近文件失败:', error)
        message.error(`打开文件失败: ${fileName}`)
        return false
      }
    },
    []
  )

  return {
    addRecentFile,
    removeRecentFile,
    clearRecentFiles,
    openRecentFile
  }
}
