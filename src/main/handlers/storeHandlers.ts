/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcMain } from 'electron'
import Store from 'electron-store'
import type { PlayItem, StoreSchema, ApiResponse, ApiResponseWithCount } from '../../types/shared'

// 创建 store 实例
const store = new Store<StoreSchema>({
  name: 'echolab-recent-plays',
  defaults: {
    recentPlays: [],
    settings: {
      maxRecentItems: 20
    }
  }
})

// 生成唯一 ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 设置最近播放列表相关的 IPC 处理器
export function setupStoreHandlers(): void {
  // 获取所有最近播放项
  ipcMain.handle('store:get-recent-plays', (): PlayItem[] => {
    try {
      const recentPlays = (store as any).get('recentPlays', []) as PlayItem[]
      // 按最后打开时间降序排序
      return recentPlays.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
    } catch (error) {
      console.error('获取最近播放列表失败:', error)
      return []
    }
  })

  // 添加或更新最近播放项
  ipcMain.handle(
    'store:add-recent-play',
    (_, item: Omit<PlayItem, 'id' | 'lastOpenedAt'>): ApiResponse => {
      try {
        const recentPlays = (store as any).get('recentPlays', []) as PlayItem[]
        const settings = (store as any).get('settings', { maxRecentItems: 20 }) as {
          maxRecentItems: number
        }
        const maxItems = settings.maxRecentItems

        // 检查是否已存在相同文件路径的项
        const existingIndex = recentPlays.findIndex((play) => play.filePath === item.filePath)

        const newItem: PlayItem = {
          ...item,
          id: existingIndex >= 0 ? recentPlays[existingIndex].id : generateId(),
          lastOpenedAt: Date.now()
        }

        if (existingIndex >= 0) {
          // 更新现有项
          recentPlays[existingIndex] = newItem
        } else {
          // 添加新项
          recentPlays.unshift(newItem)
        }

        // 限制列表长度
        if (recentPlays.length > maxItems) {
          recentPlays.splice(maxItems)
        }

        ;(store as any).set('recentPlays', recentPlays)
        return { success: true }
      } catch (error) {
        console.error('添加最近播放项失败:', error)
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  )

  // 更新最近播放项
  ipcMain.handle(
    'store:update-recent-play',
    (_, id: string, updates: Partial<Omit<PlayItem, 'id'>>): ApiResponse => {
      try {
        const recentPlays = (store as any).get('recentPlays', []) as PlayItem[]
        const index = recentPlays.findIndex((play) => play.id === id)

        if (index === -1) {
          return { success: false, error: '未找到指定的播放项' }
        }

        // 更新项目，但保持 lastOpenedAt 不变（除非明确指定）
        recentPlays[index] = {
          ...recentPlays[index],
          ...updates
        }
        ;(store as any).set('recentPlays', recentPlays)
        return { success: true }
      } catch (error) {
        console.error('更新最近播放项失败:', error)
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  )

  // 删除最近播放项
  ipcMain.handle('store:remove-recent-play', (_, id: string): ApiResponse => {
    try {
      const recentPlays = (store as any).get('recentPlays', []) as PlayItem[]
      const filteredPlays = recentPlays.filter((play) => play.id !== id)

      if (filteredPlays.length === recentPlays.length) {
        return { success: false, error: '未找到指定的播放项' }
      }

      ;(store as any).set('recentPlays', filteredPlays)
      return { success: true }
    } catch (error) {
      console.error('删除最近播放项失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 清空最近播放列表
  ipcMain.handle('store:clear-recent-plays', (): ApiResponse => {
    try {
      ;(store as any).set('recentPlays', [])
      return { success: true }
    } catch (error) {
      console.error('清空最近播放列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 根据文件路径获取最近播放项
  ipcMain.handle('store:get-recent-play-by-path', (_, filePath: string): PlayItem | null => {
    try {
      const recentPlays = (store as any).get('recentPlays', []) as PlayItem[]
      return recentPlays.find((play) => play.filePath === filePath) || null
    } catch (error) {
      console.error('根据路径获取最近播放项失败:', error)
      return null
    }
  })

  // 获取设置
  ipcMain.handle('store:get-settings', () => {
    try {
      return (store as any).get('settings', { maxRecentItems: 20 })
    } catch (error) {
      console.error('获取设置失败:', error)
      return { maxRecentItems: 20 }
    }
  })

  // 更新设置
  ipcMain.handle(
    'store:update-settings',
    (_, settings: Partial<StoreSchema['settings']>): ApiResponse => {
      try {
        const currentSettings = (store as any).get('settings', { maxRecentItems: 20 }) as {
          maxRecentItems: number
        }
        const newSettings = { ...currentSettings, ...settings }
        ;(store as any).set('settings', newSettings)

        // 如果更新了最大项目数，需要裁剪现有列表
        if (settings.maxRecentItems !== undefined) {
          const recentPlays = (store as any).get('recentPlays', []) as PlayItem[]
          if (recentPlays.length > settings.maxRecentItems) {
            const trimmedPlays = recentPlays.slice(0, settings.maxRecentItems)
            ;(store as any).set('recentPlays', trimmedPlays)
          }
        }

        return { success: true }
      } catch (error) {
        console.error('更新设置失败:', error)
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  )

  // 批量操作：删除多个项目
  ipcMain.handle('store:remove-multiple-recent-plays', (_, ids: string[]): ApiResponseWithCount => {
    try {
      const recentPlays = (store as any).get('recentPlays', []) as PlayItem[]
      const filteredPlays = recentPlays.filter((play) => !ids.includes(play.id))
      const removedCount = recentPlays.length - filteredPlays.length

      ;(store as any).set('recentPlays', filteredPlays)
      return { success: true, removedCount }
    } catch (error) {
      console.error('批量删除最近播放项失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        removedCount: 0
      }
    }
  })

  // 搜索最近播放项
  ipcMain.handle('store:search-recent-plays', (_, query: string): PlayItem[] => {
    try {
      const recentPlays = (store as any).get('recentPlays', []) as PlayItem[]
      const lowerQuery = query.toLowerCase()

      return recentPlays
        .filter(
          (play) =>
            play.fileName.toLowerCase().includes(lowerQuery) ||
            play.filePath.toLowerCase().includes(lowerQuery)
        )
        .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
    } catch (error) {
      console.error('搜索最近播放项失败:', error)
      return []
    }
  })
}

// 导出类型供其他模块使用
export type { PlayItem as RecentPlayItem, StoreSchema }
