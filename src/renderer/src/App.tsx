import React, { useCallback, useMemo, useState } from 'react'
import { Layout } from 'antd'

// 导入组件
import { AppHeader } from '@renderer/components/AppHeader/AppHeader'
import { HomePage } from '@renderer/pages/HomePage'
import { PlayPage } from '@renderer/pages/PlayPage'
import { FavoritesPage } from '@renderer/pages/FavoritesPage'
import { AboutPage } from '@renderer/pages/AboutPage'
import { SettingsPage } from '@renderer/pages/SettingsPage'

import { ShortcutProvider } from '@renderer/contexts/ShortcutContext'
import { PlaybackSettingsProvider } from '@renderer/contexts/PlaybackSettingsContext'
import { PlayingVideoProvider } from '@renderer/contexts/PlayingVideoContext'
import { SubtitleListProvider } from '@renderer/contexts/SubtitleListContext'

// 导入类型
import { PageType } from '@renderer/types'

// 导入样式
import styles from './App.module.css'

// 导入性能监控工具
import { performanceMonitor } from '@renderer/utils/performance'

const { Content } = Layout

function App(): React.JSX.Element {
  // 页面状态管理
  const [currentPage, setCurrentPage] = useState<PageType>('home')

  // 导航到播放页面
  const handleNavigateToPlay = useCallback(() => {
    setCurrentPage('play')
  }, [])

  // 返回主页回调函数
  const handleBackToHome = useCallback(() => {
    setCurrentPage('home')
    // 在下一个渲染周期结束性能测量
    requestAnimationFrame(() => {
      performanceMonitor.end('page-transition-to-home')
    })
  }, [])

  // 渲染页面内容
  const renderPageContent = useMemo((): React.JSX.Element => {
    return (
      <>
        {/* 主页 */}
        {currentPage === 'home' && (
          <div className={styles.pageContainer}>
            <HomePage onNavigateToPlay={handleNavigateToPlay} />
          </div>
        )}

        {/* 播放页面 - 始终挂载，通过 display 控制显示 */}
        <div
          className={styles.pageContainer}
          style={{
            display: currentPage === 'play' ? 'block' : 'none'
          }}
        >
          {/* 只有在播放页面时才渲染PlayPage组件 */}
          {currentPage === 'play' && <PlayPage onBack={handleBackToHome} />}
        </div>

        {/* 其他页面 - 条件渲染，覆盖在播放页面之上 */}
        {currentPage === 'favorites' && (
          <div className={`${styles.pageContainer} ${styles.otherPage}`}>
            <FavoritesPage />
          </div>
        )}
        {currentPage === 'about' && (
          <div className={`${styles.pageContainer} ${styles.otherPage}`}>
            <AboutPage />
          </div>
        )}
        {currentPage === 'settings' && (
          <div className={`${styles.pageContainer} ${styles.otherPage}`}>
            <SettingsPage />
          </div>
        )}
      </>
    )
  }, [currentPage, handleNavigateToPlay, handleBackToHome])

  return (
    <PlaybackSettingsProvider>
      <ShortcutProvider>
        <PlayingVideoProvider>
          <SubtitleListProvider>
            {currentPage === 'play' ? (
              // 播放页面 - 全屏布局，不显示全局header
              <div className={styles.playPageFullscreen}>{renderPageContent}</div>
            ) : (
              // 其他页面 - 标准布局，显示全局header
              <Layout className={styles.appLayout}>
                <AppHeader currentPage={currentPage} onPageChange={setCurrentPage} />
                <Content className={styles.appContent}>{renderPageContent}</Content>
              </Layout>
            )}
          </SubtitleListProvider>
        </PlayingVideoProvider>
      </ShortcutProvider>
    </PlaybackSettingsProvider>
  )
}

export default App
