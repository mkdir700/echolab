import React from 'react'
import { Button, Slider, Space, Typography, Select } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SoundOutlined,
  ThunderboltOutlined
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
  return (
    <div className={`video-controls-overlay ${showControls ? 'show' : ''}`}>
      {/* 进度条 */}
      <div className="video-progress-bar">
        <Slider
          min={0}
          max={duration}
          value={currentTime}
          onChange={onSeek}
          tooltip={{ formatter: (value) => formatTime(value || 0) }}
          className="progress-slider-overlay"
          disabled={!isVideoLoaded}
        />
        <div className="time-display">
          <Text className="time-text">{formatTime(currentTime)}</Text>
          <Text className="time-text">{formatTime(duration)}</Text>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="video-controls-buttons">
        {/* 主要播放控制 */}
        <div className="primary-controls">
          <Space size="large">
            <Button
              icon={<StepBackwardOutlined />}
              onClick={onStepBackward}
              size="large"
              type="text"
              className="control-btn"
              disabled={!isVideoLoaded}
            />
            <Button
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={onPlayPause}
              size="large"
              type="primary"
              className="control-btn play-btn"
              disabled={!isVideoLoaded && !videoError}
            />
            <Button
              icon={<StepForwardOutlined />}
              onClick={onStepForward}
              size="large"
              type="text"
              className="control-btn"
              disabled={!isVideoLoaded}
            />
          </Space>
        </div>

        {/* 次要控制 */}
        <div className="secondary-controls">
          {/* 播放速度 */}
          <div className="control-group">
            <ThunderboltOutlined className="control-icon" />
            <Select
              value={playbackRate}
              onChange={onPlaybackRateChange}
              className="control-select"
              disabled={!isVideoLoaded}
              size="small"
              style={{ width: 80 }}
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

          {/* 音量 */}
          <div className="control-group volume-control">
            <SoundOutlined className="control-icon" />
            <Text className="control-label">{Math.round(volume * 100)}%</Text>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={onVolumeChange}
              className="control-slider"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
