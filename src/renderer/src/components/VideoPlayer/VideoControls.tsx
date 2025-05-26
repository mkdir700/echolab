import React, { useState, useEffect } from 'react'
import { Button, Slider, Space, Typography, Select, Tooltip } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SoundOutlined,
  SoundFilled,
  ThunderboltOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { formatTime } from '@renderer/utils/helpers'

// 导入样式
import styles from './VideoControls.module.css'

const { Text } = Typography

interface VideoControlsProps {
  showControls: boolean
  duration: number
  currentTime: number
  isVideoLoaded: boolean
  isPlaying: boolean
  videoError: string | null
  playbackRate: number
  volume: number
  onSeek: (value: number) => void
  onStepBackward: () => void
  onPlayPause: () => void
  onStepForward: () => void
  onPlaybackRateChange: (value: number) => void
  onVolumeChange: (value: number) => void
}

export function VideoControls({
  showControls,
  duration,
  currentTime,
  isVideoLoaded,
  isPlaying,
  videoError,
  playbackRate,
  volume,
  onSeek,
  onStepBackward,
  onPlayPause,
  onStepForward,
  onPlaybackRateChange,
  onVolumeChange
}: VideoControlsProps): React.JSX.Element {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isProgressHovered, setIsProgressHovered] = useState(false)

  // 自动隐藏设置面板
  useEffect(() => {
    if (!showControls) {
      setShowSettings(false)
      setShowVolumeSlider(false)
    }
  }, [showControls])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // 处理进度条点击
  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!isVideoLoaded || duration === 0) return

    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration

    onSeek(Math.max(0, Math.min(duration, newTime)))
  }

  return (
    <>
      {/* 进度条 - 始终显示在底部，悬停时增强 */}
      <div
        className={`${styles.videoProgressContainer} ${showControls || isProgressHovered ? styles.enhanced : ''}`}
        onMouseEnter={() => setIsProgressHovered(true)}
        onMouseLeave={() => setIsProgressHovered(false)}
        onClick={handleProgressClick}
      >
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          <div className={styles.progressHandle} style={{ left: `${progress}%` }} />
        </div>

        {(showControls || isProgressHovered) && (
          <div className={styles.progressTimeTooltip}>
            <Text className={styles.progressTime}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </div>
        )}
      </div>

      {/* 中央播放按钮 - 仅在暂停时显示 */}
      {!isPlaying && showControls && (
        <div className={styles.centerPlayButton}>
          <Button
            icon={<PlayCircleOutlined />}
            onClick={onPlayPause}
            size="large"
            type="text"
            className={styles.centerPlayBtn}
            disabled={!isVideoLoaded && !videoError}
          />
        </div>
      )}

      {/* 主控制栏 - 悬停时显示 */}
      <div className={`${styles.videoControlsBar} ${showControls ? styles.visible : ''}`}>
        <div className={styles.controlsLeft}>
          <Space size="small">
            <Tooltip title="后退10秒">
              <Button
                icon={<StepBackwardOutlined />}
                onClick={onStepBackward}
                type="text"
                className={styles.controlBtnCompact}
                disabled={!isVideoLoaded}
              />
            </Tooltip>

            <Button
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={onPlayPause}
              type="text"
              className={`${styles.controlBtnCompact} ${styles.playPauseBtn}`}
              disabled={!isVideoLoaded && !videoError}
            />

            <Tooltip title="前进10秒">
              <Button
                icon={<StepForwardOutlined />}
                onClick={onStepForward}
                type="text"
                className={styles.controlBtnCompact}
                disabled={!isVideoLoaded}
              />
            </Tooltip>
          </Space>

          <div className={styles.timeDisplayCompact}>
            <Text className={styles.timeTextCompact}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </div>
        </div>

        <div className={styles.controlsRight}>
          <Space size="small">
            {/* 音量控制 */}
            <div
              className={styles.volumeControlCompact}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Tooltip title={`音量: ${Math.round(volume * 100)}%`}>
                <Button
                  icon={volume > 0 ? <SoundFilled /> : <SoundOutlined />}
                  type="text"
                  className={styles.controlBtnCompact}
                />
              </Tooltip>

              {showVolumeSlider && (
                <div className={styles.volumeSliderPopup}>
                  <Slider
                    vertical
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={onVolumeChange}
                    className={styles.volumeSliderVertical}
                  />
                  <Text className={styles.volumeText}>{Math.round(volume * 100)}%</Text>
                </div>
              )}
            </div>

            {/* 设置按钮 */}
            <div className={styles.settingsControlCompact}>
              <Tooltip title="播放设置">
                <Button
                  icon={<SettingOutlined />}
                  type="text"
                  className={styles.controlBtnCompact}
                  onClick={() => setShowSettings(!showSettings)}
                />
              </Tooltip>

              {showSettings && (
                <div className={styles.settingsPopup}>
                  <div className={styles.settingsItem}>
                    <ThunderboltOutlined className={styles.settingsIcon} />
                    <Text className={styles.settingsLabel}>播放速度</Text>
                    <Select
                      value={playbackRate}
                      onChange={onPlaybackRateChange}
                      className={styles.settingsSelect}
                      disabled={!isVideoLoaded}
                      size="small"
                      options={[
                        { value: 0.5, label: '0.5x' },
                        { value: 0.75, label: '0.75x' },
                        { value: 1, label: '1x' },
                        { value: 1.25, label: '1.25x' },
                        { value: 1.5, label: '1.5x' },
                        { value: 2, label: '2x' }
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>
          </Space>
        </div>
      </div>
    </>
  )
}
