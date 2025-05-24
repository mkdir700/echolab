import React from 'react'
import { Button, Slider, Space, Typography } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
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
  showSubtitles: boolean
  onSeek: (value: number) => void
  onStepBackward: () => void
  onPlayPause: () => void
  onStepForward: () => void
  onRestart: () => void
  onPlaybackRateChange: (value: number) => void
  onVolumeChange: (value: number) => void
  onToggleSubtitles: () => void
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
  showSubtitles,
  onSeek,
  onStepBackward,
  onPlayPause,
  onStepForward,
  onRestart,
  onPlaybackRateChange,
  onVolumeChange,
  onToggleSubtitles
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
        <Space size="middle">
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
          <Button
            icon={<ReloadOutlined />}
            onClick={onRestart}
            size="large"
            type="text"
            className="control-btn"
            disabled={!isVideoLoaded}
          />
        </Space>

        <Space size="middle" className="secondary-controls">
          {/* 播放速度 */}
          <div className="control-group">
            <ThunderboltOutlined className="control-icon" />
            <Text className="control-label">{playbackRate}x</Text>
            <Slider
              min={0.5}
              max={2}
              step={0.1}
              value={playbackRate}
              onChange={onPlaybackRateChange}
              className="control-slider"
              disabled={!isVideoLoaded}
            />
          </div>

          {/* 音量 */}
          <div className="control-group">
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

          {/* 字幕切换 */}
          <Button
            icon={showSubtitles ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={onToggleSubtitles}
            type={showSubtitles ? 'primary' : 'default'}
            className="control-btn subtitle-btn"
          >
            字幕
          </Button>
        </Space>
      </div>
    </div>
  )
}
