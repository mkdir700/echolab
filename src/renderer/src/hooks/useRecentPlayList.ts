import { useState, useEffect, useCallback } from 'react'
import type { RecentPlayItem, StoreSettings } from '@renderer/types'

export interface UseRecentPlayListReturn {
  // 状态
  recentPlays: RecentPlayItem[]
  settings: StoreSettings
  loading: boolean
  error: string | null

  // 操作方法
  refreshRecentPlays: () => Promise<void>
  addRecentPlay: (item: Omit<RecentPlayItem, 'id' | 'lastOpenedAt'>) => Promise<boolean>
  updateRecentPlay: (id: string, updates: Partial<Omit<RecentPlayItem, 'id'>>) => Promise<boolean>
  removeRecentPlay: (id: string) => Promise<boolean>
  clearRecentPlays: () => Promise<boolean>
  getRecentPlayByPath: (filePath: string) => Promise<RecentPlayItem | null>
  updateSettings: (settings: Partial<StoreSettings>) => Promise<boolean>
  removeMultipleRecentPlays: (ids: string[]) => Promise<{ success: boolean; removedCount: number }>
  searchRecentPlays: (query: string) => Promise<RecentPlayItem[]>
}

export function useRecentPlayList(): UseRecentPlayListReturn {
  const [recentPlays, setRecentPlays] = useState<RecentPlayItem[]>([])
  const [settings, setSettings] = useState<StoreSettings>({ maxRecentItems: 20 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 刷新最近播放列表
  const refreshRecentPlays = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const plays = await window.api.store.getRecentPlays()
      setRecentPlays(plays)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取最近播放列表失败'
      setError(errorMessage)
      console.error('获取最近播放列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取设置
  const refreshSettings = useCallback(async () => {
    try {
      const storeSettings = await window.api.store.getSettings()
      setSettings(storeSettings)
    } catch (err) {
      console.error('获取设置失败:', err)
    }
  }, [])

  // 初始化数据
  useEffect(() => {
    const initializeData = async (): Promise<void> => {
      await Promise.all([refreshRecentPlays(), refreshSettings()])
    }
    initializeData()
  }, [refreshRecentPlays, refreshSettings])

  // 添加最近播放项
  const addRecentPlay = useCallback(
    async (item: Omit<RecentPlayItem, 'id' | 'lastOpenedAt'>): Promise<boolean> => {
      try {
        setError(null)
        const result = await window.api.store.addRecentPlay(item)
        if (result.success) {
          await refreshRecentPlays()
          return true
        } else {
          setError(result.error || '添加失败')
          return false
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '添加最近播放项失败'
        setError(errorMessage)
        console.error('添加最近播放项失败:', err)
        return false
      }
    },
    [refreshRecentPlays]
  )

  // 更新最近播放项
  const updateRecentPlay = useCallback(
    async (id: string, updates: Partial<Omit<RecentPlayItem, 'id'>>): Promise<boolean> => {
      try {
        setError(null)
        const result = await window.api.store.updateRecentPlay(id, updates)
        if (result.success) {
          await refreshRecentPlays()
          return true
        } else {
          setError(result.error || '更新失败')
          return false
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '更新最近播放项失败'
        setError(errorMessage)
        console.error('更新最近播放项失败:', err)
        return false
      }
    },
    [refreshRecentPlays]
  )

  // 删除最近播放项
  const removeRecentPlay = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null)
        const result = await window.api.store.removeRecentPlay(id)
        if (result.success) {
          await refreshRecentPlays()
          return true
        } else {
          setError(result.error || '删除失败')
          return false
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '删除最近播放项失败'
        setError(errorMessage)
        console.error('删除最近播放项失败:', err)
        return false
      }
    },
    [refreshRecentPlays]
  )

  // 清空最近播放列表
  const clearRecentPlays = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      const result = await window.api.store.clearRecentPlays()
      if (result.success) {
        await refreshRecentPlays()
        return true
      } else {
        setError(result.error || '清空失败')
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '清空最近播放列表失败'
      setError(errorMessage)
      console.error('清空最近播放列表失败:', err)
      return false
    }
  }, [refreshRecentPlays])

  // 根据文件路径获取最近播放项
  const getRecentPlayByPath = useCallback(
    async (filePath: string): Promise<RecentPlayItem | null> => {
      try {
        setError(null)
        return await window.api.store.getRecentPlayByPath(filePath)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '获取最近播放项失败'
        setError(errorMessage)
        console.error('根据路径获取最近播放项失败:', err)
        return null
      }
    },
    []
  )

  // 更新设置
  const updateSettings = useCallback(
    async (newSettings: Partial<StoreSettings>): Promise<boolean> => {
      try {
        setError(null)
        const result = await window.api.store.updateSettings(newSettings)
        if (result.success) {
          await refreshSettings()
          await refreshRecentPlays() // 如果更改了最大项目数，需要刷新列表
          return true
        } else {
          setError(result.error || '更新设置失败')
          return false
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '更新设置失败'
        setError(errorMessage)
        console.error('更新设置失败:', err)
        return false
      }
    },
    [refreshSettings, refreshRecentPlays]
  )

  // 批量删除多个项目
  const removeMultipleRecentPlays = useCallback(
    async (ids: string[]): Promise<{ success: boolean; removedCount: number }> => {
      try {
        setError(null)
        const result = await window.api.store.removeMultipleRecentPlays(ids)
        if (result.success) {
          await refreshRecentPlays()
          return { success: true, removedCount: result.removedCount }
        } else {
          setError(result.error || '批量删除失败')
          return { success: false, removedCount: 0 }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '批量删除最近播放项失败'
        setError(errorMessage)
        console.error('批量删除最近播放项失败:', err)
        return { success: false, removedCount: 0 }
      }
    },
    [refreshRecentPlays]
  )

  // 搜索最近播放项
  const searchRecentPlays = useCallback(async (query: string): Promise<RecentPlayItem[]> => {
    try {
      setError(null)
      return await window.api.store.searchRecentPlays(query)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '搜索最近播放项失败'
      setError(errorMessage)
      console.error('搜索最近播放项失败:', err)
      return []
    }
  }, [])

  return {
    // 状态
    recentPlays,
    settings,
    loading,
    error,

    // 操作方法
    refreshRecentPlays,
    addRecentPlay,
    updateRecentPlay,
    removeRecentPlay,
    clearRecentPlays,
    getRecentPlayByPath,
    updateSettings,
    removeMultipleRecentPlays,
    searchRecentPlays
  }
}
