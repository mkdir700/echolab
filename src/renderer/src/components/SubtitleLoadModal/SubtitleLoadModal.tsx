import React, { useState, useEffect } from 'react'
import { Modal, Button, Typography, Spin, Alert, message } from 'antd'
import {
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { FileSystemHelper } from '@renderer/utils/fileSystemHelper'
import { parseSubtitles } from '@renderer/utils/subtitleParser'
import type { SubtitleItem } from '@renderer/types/shared'
import styles from './SubtitleLoadModal.module.css'

const { Text } = Typography

interface SubtitleLoadModalProps {
  visible: boolean
  videoFilePath: string
  onCancel: () => void
  onSkip: () => void
  onSubtitlesLoaded: (subtitles: SubtitleItem[]) => void
}

interface SubtitleFileInfo {
  path: string
  name: string
  exists: boolean
}

export function SubtitleLoadModal({
  visible,
  videoFilePath,
  onCancel,
  onSkip,
  onSubtitlesLoaded
}: SubtitleLoadModalProps): React.JSX.Element {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [subtitleFiles, setSubtitleFiles] = useState<SubtitleFileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState<SubtitleFileInfo | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // 检查同目录下的字幕文件
  const checkSubtitleFiles = async (): Promise<void> => {
    if (!videoFilePath) return

    setChecking(true)
    try {
      const videoDir = FileSystemHelper.getDirectoryPath(videoFilePath)
      const videoBaseName = FileSystemHelper.getFileName(videoFilePath).replace(/\.[^/.]+$/, '')

      // 支持的字幕文件扩展名
      const subtitleExtensions = ['srt', 'vtt', 'json']
      const possibleFiles: SubtitleFileInfo[] = []

      for (const ext of subtitleExtensions) {
        // 使用正确的路径分隔符
        const isWindows = navigator.userAgent.toLowerCase().includes('win')
        const separator = isWindows ? '\\' : '/'
        const subtitlePath = `${videoDir}${separator}${videoBaseName}.${ext}`
        const exists = await FileSystemHelper.checkFileExists(subtitlePath)

        possibleFiles.push({
          path: subtitlePath,
          name: `${videoBaseName}.${ext}`,
          exists
        })
      }

      const existingFiles = possibleFiles.filter((file) => file.exists)
      setSubtitleFiles(existingFiles)

      if (existingFiles.length > 0) {
        setSelectedFile(existingFiles[0]) // 默认选择第一个找到的字幕文件
      }
    } catch (error) {
      console.error('检查字幕文件失败:', error)
      message.error('检查字幕文件失败')
    } finally {
      setChecking(false)
    }
  }

  // 加载选中的字幕文件
  const loadSelectedSubtitle = async (): Promise<void> => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const content = await FileSystemHelper.readSubtitleFile(selectedFile.path)
      if (!content) {
        throw new Error('无法读取字幕文件内容')
      }

      const subtitles = parseSubtitles(content, selectedFile.name)
      if (subtitles.length === 0) {
        throw new Error('字幕文件解析失败或为空')
      }

      message.success(`成功加载字幕文件：${selectedFile.name}，共 ${subtitles.length} 条字幕`)
      onSubtitlesLoaded(subtitles)
    } catch (error) {
      console.error('加载字幕文件失败:', error)
      message.error(`加载字幕文件失败：${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  // 处理手动选择字幕文件
  const handleManualFileSelect = (): void => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.srt,.vtt,.json'
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      setLoading(true)
      setUploadError(null)

      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => reject(new Error('读取文件失败'))
          reader.readAsText(file)
        })

        const subtitles = parseSubtitles(content, file.name)
        if (subtitles.length === 0) {
          throw new Error('字幕文件解析失败或为空')
        }

        message.success(`成功加载字幕文件：${file.name}，共 ${subtitles.length} 条字幕`)
        onSubtitlesLoaded(subtitles)
      } catch (error) {
        console.error('加载字幕文件失败:', error)
        const errorMessage = `加载字幕文件失败：${(error as Error).message}`
        setUploadError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    input.click()
  }

  // 当Modal显示时检查字幕文件
  useEffect(() => {
    if (visible && videoFilePath) {
      checkSubtitleFiles()
    }
  }, [visible, videoFilePath])

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <FileTextOutlined className={styles.titleIcon} />
          字幕文件检查
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      className={styles.subtitleModal}
    >
      <div className={styles.modalContent}>
        {checking ? (
          <div className={styles.checkingSection}>
            <Spin size="large" />
            <Text className={styles.checkingText}>正在检查同目录下的字幕文件...</Text>
          </div>
        ) : (
          <>
            {subtitleFiles.length > 0 ? (
              <div className={styles.foundSection}>
                <Alert
                  message="找到字幕文件"
                  description={`在视频文件同目录下找到 ${subtitleFiles.length} 个字幕文件`}
                  type="success"
                  icon={<CheckCircleOutlined />}
                  className={styles.alert}
                />

                <div className={styles.subtitleList}>
                  {subtitleFiles.map((file) => (
                    <div
                      key={file.path}
                      className={`${styles.subtitleItem} ${
                        selectedFile?.path === file.path ? styles.selected : ''
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <FileTextOutlined className={styles.fileIcon} />
                      <Text className={styles.subtitleName}>{file.name}</Text>
                      {selectedFile?.path === file.path && (
                        <CheckCircleOutlined className={styles.selectedIcon} />
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.actionButtons}>
                  <Button
                    type="primary"
                    size="large"
                    loading={loading}
                    onClick={loadSelectedSubtitle}
                    disabled={!selectedFile}
                    className={styles.loadButton}
                  >
                    加载选中的字幕文件
                  </Button>
                  <Button size="large" onClick={onSkip} className={styles.skipButton}>
                    稍后添加
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.notFoundSection}>
                <Alert
                  message="未找到字幕文件"
                  description="在视频文件同目录下未找到匹配的字幕文件（.srt, .vtt, .json）"
                  type="warning"
                  icon={<ExclamationCircleOutlined />}
                  className={styles.alert}
                />

                {uploadError && (
                  <Alert
                    message="加载失败"
                    description={uploadError}
                    type="error"
                    closable
                    onClose={() => setUploadError(null)}
                    className={styles.alert}
                    style={{ marginBottom: 16 }}
                  />
                )}

                <div className={styles.actionButtons}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<UploadOutlined />}
                    loading={loading}
                    onClick={handleManualFileSelect}
                    className={styles.uploadButton}
                  >
                    手动添加字幕文件
                  </Button>
                  <Button size="large" onClick={onSkip} className={styles.skipButton}>
                    稍后添加
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
