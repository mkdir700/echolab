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
import { formatTime } from '../utils/helpers'

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
        className={`video-progress-container ${showControls || isProgressHovered ? 'enhanced' : ''}`}
        onMouseEnter={() => setIsProgressHovered(true)}
        onMouseLeave={() => setIsProgressHovered(false)}
        onClick={handleProgressClick}
      >
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <div className="progress-handle" style={{ left: `${progress}%` }} />
        </div>

        {(showControls || isProgressHovered) && (
          <div className="progress-time-tooltip">
            <Text className="progress-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </div>
        )}
      </div>

      {/* 中央播放按钮 - 仅在暂停时显示 */}
      {!isPlaying && showControls && (
        <div className="center-play-button">
          <Button
            icon={<PlayCircleOutlined />}
            onClick={onPlayPause}
            size="large"
            type="text"
            className="center-play-btn"
            disabled={!isVideoLoaded && !videoError}
          />
        </div>
      )}

      {/* 主控制栏 - 悬停时显示 */}
      <div className={`video-controls-bar ${showControls ? 'visible' : ''}`}>
        <div className="controls-left">
          <Space size="small">
            <Tooltip title="后退10秒">
              <Button
                icon={<StepBackwardOutlined />}
                onClick={onStepBackward}
                type="text"
                className="control-btn-compact"
                disabled={!isVideoLoaded}
              />
            </Tooltip>

            <Button
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={onPlayPause}
              type="text"
              className="control-btn-compact play-pause-btn"
              disabled={!isVideoLoaded && !videoError}
            />

            <Tooltip title="前进10秒">
              <Button
                icon={<StepForwardOutlined />}
                onClick={onStepForward}
                type="text"
                className="control-btn-compact"
                disabled={!isVideoLoaded}
              />
            </Tooltip>
          </Space>

          <div className="time-display-compact">
            <Text className="time-text-compact">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </div>
        </div>

        <div className="controls-right">
          <Space size="small">
            {/* 音量控制 */}
            <div
              className="volume-control-compact"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Tooltip title={`音量: ${Math.round(volume * 100)}%`}>
                <Button
                  icon={volume > 0 ? <SoundFilled /> : <SoundOutlined />}
                  type="text"
                  className="control-btn-compact"
                />
              </Tooltip>

              {showVolumeSlider && (
                <div className="volume-slider-popup">
                  <Slider
                    vertical
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={onVolumeChange}
                    className="volume-slider-vertical"
                  />
                  <Text className="volume-text">{Math.round(volume * 100)}%</Text>
                </div>
              )}
            </div>

            {/* 设置按钮 */}
            <div className="settings-control-compact">
              <Tooltip title="播放设置">
                <Button
                  icon={<SettingOutlined />}
                  type="text"
                  className="control-btn-compact"
                  onClick={() => setShowSettings(!showSettings)}
                />
              </Tooltip>

              {showSettings && (
                <div className="settings-popup">
                  <div className="settings-item">
                    <ThunderboltOutlined className="settings-icon" />
                    <Text className="settings-label">播放速度</Text>
                    <Select
                      value={playbackRate}
                      onChange={onPlaybackRateChange}
                      className="settings-select"
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
