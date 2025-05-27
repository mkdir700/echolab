import React, { useState } from 'react'
import { Button, Slider, Typography, Select, Tooltip } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SoundOutlined,
  SoundFilled,
  ThunderboltOutlined,
  SettingOutlined,
  ReloadOutlined,
  FastForwardOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  FullscreenOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons'

// 导入样式
import styles from './VideoControlsCompact.module.css'

const { Text } = Typography

interface VideoControlsCompactProps {
  duration: number
  currentTime: number
  isVideoLoaded: boolean
  isPlaying: boolean
  videoError: string | null
  playbackRate: number
  volume: number
  isLooping: boolean
  autoSkipSilence: boolean
  subtitlePosition: 'top' | 'bottom'
  onSeek: (value: number) => void
  onStepBackward: () => void
  onPlayPause: () => void
  onStepForward: () => void
  onPlaybackRateChange: (value: number) => void
  onVolumeChange: (value: number) => void
  onLoopToggle: () => void
  onAutoSkipToggle: () => void
  onSubtitlePositionToggle: () => void
  onFullscreenToggle: () => void
  onPreviousSubtitle: () => void
  onNextSubtitle: () => void
}

export function VideoControlsCompact({
  duration,
  currentTime,
  isVideoLoaded,
  isPlaying,
  videoError,
  playbackRate,
  volume,
  isLooping,
  autoSkipSilence,
  subtitlePosition,
  onSeek,
  onStepBackward,
  onPlayPause,
  onStepForward,
  onPlaybackRateChange,
  onVolumeChange,
  onLoopToggle,
  onAutoSkipToggle,
  onSubtitlePositionToggle,
  onFullscreenToggle,
  onPreviousSubtitle,
  onNextSubtitle
}: VideoControlsCompactProps): React.JSX.Element {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // 格式化时间显示
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.compactControlsContainer}>
      {/* 进度条 */}
      <div className={styles.progressSection}>
        <Slider
          min={0}
          max={duration}
          value={currentTime}
          onChange={onSeek}
          className={styles.progressSlider}
          disabled={!isVideoLoaded}
          tooltip={{ formatter: (value) => formatTime(value || 0) }}
        />
        <div className={styles.timeDisplay}>
          <Text className={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </div>
      </div>

      {/* 主控制区 */}
      <div className={styles.mainControls}>
        {/* 左侧功能按钮 */}
        <div className={styles.leftControls}>
          {/* 循环播放 */}
          <Tooltip title={isLooping ? '关闭循环播放' : '开启循环播放'}>
            <Button
              icon={<ReloadOutlined />}
              onClick={onLoopToggle}
              type="text"
              className={`${styles.controlBtn} ${isLooping ? styles.activeBtn : ''}`}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>

          {/* 自动跳过无对话 */}
          <Tooltip title={autoSkipSilence ? '关闭自动跳过' : '开启自动跳过无对话'}>
            <Button
              icon={<FastForwardOutlined />}
              onClick={onAutoSkipToggle}
              type="text"
              className={`${styles.controlBtn} ${autoSkipSilence ? styles.activeBtn : ''}`}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>

          {/* 字幕位置 */}
          <Tooltip title={`字幕显示在${subtitlePosition === 'top' ? '上方' : '下方'}`}>
            <Button
              icon={
                subtitlePosition === 'top' ? (
                  <VerticalAlignTopOutlined />
                ) : (
                  <VerticalAlignBottomOutlined />
                )
              }
              onClick={onSubtitlePositionToggle}
              type="text"
              className={styles.controlBtn}
              size="small"
            />
          </Tooltip>
        </div>

        {/* 中央播放控制 */}
        <div className={styles.centerControls}>
          {/* 上一句字幕 */}
          <Tooltip title="上一句字幕">
            <Button
              icon={<StepBackwardOutlined />}
              onClick={onPreviousSubtitle}
              type="text"
              className={styles.controlBtn}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>

          {/* 后退10秒 */}
          <Tooltip title="后退10秒">
            <Button
              icon={<LeftOutlined />}
              onClick={onStepBackward}
              type="text"
              className={styles.controlBtn}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>

          {/* 播放/暂停 */}
          <Button
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={onPlayPause}
            type="text"
            className={`${styles.controlBtn} ${styles.playPauseBtn}`}
            disabled={!isVideoLoaded && !videoError}
          />

          {/* 前进10秒 */}
          <Tooltip title="前进10秒">
            <Button
              icon={<RightOutlined />}
              onClick={onStepForward}
              type="text"
              className={styles.controlBtn}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>

          {/* 下一句字幕 */}
          <Tooltip title="下一句字幕">
            <Button
              icon={<StepForwardOutlined />}
              onClick={onNextSubtitle}
              type="text"
              className={styles.controlBtn}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>
        </div>

        {/* 右侧系统控制 */}
        <div className={styles.rightControls}>
          {/* 播放倍数 */}
          <div className={styles.playbackRateControl}>
            <Tooltip title="播放速度">
              <Select
                value={playbackRate}
                onChange={onPlaybackRateChange}
                className={styles.playbackRateSelect}
                disabled={!isVideoLoaded}
                size="small"
                suffixIcon={<ThunderboltOutlined />}
                options={[
                  { value: 0.25, label: '0.25x' },
                  { value: 0.5, label: '0.5x' },
                  { value: 0.75, label: '0.75x' },
                  { value: 1, label: '1x' },
                  { value: 1.25, label: '1.25x' },
                  { value: 1.5, label: '1.5x' },
                  { value: 1.75, label: '1.75x' },
                  { value: 2, label: '2x' }
                ]}
              />
            </Tooltip>
          </div>

          {/* 音量控制 */}
          <div
            className={styles.volumeControl}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Tooltip title={`音量: ${Math.round(volume * 100)}%`}>
              <Button
                icon={volume > 0 ? <SoundFilled /> : <SoundOutlined />}
                type="text"
                className={styles.controlBtn}
                size="small"
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

          {/* 全屏按钮 */}
          <Tooltip title="进入全屏">
            <Button
              icon={<FullscreenOutlined />}
              onClick={onFullscreenToggle}
              type="text"
              className={styles.controlBtn}
              size="small"
            />
          </Tooltip>

          {/* 设置按钮 */}
          <div className={styles.settingsControl}>
            <Tooltip title="更多设置">
              <Button
                icon={<SettingOutlined />}
                type="text"
                className={styles.controlBtn}
                onClick={() => setShowSettings(!showSettings)}
                size="small"
              />
            </Tooltip>

            {showSettings && (
              <div className={styles.settingsPopup}>
                <div className={styles.settingsContent}>
                  <Text className={styles.settingsTitle}>播放设置</Text>
                  <div className={styles.settingsItem}>
                    <Text className={styles.settingsLabel}>更多功能即将推出...</Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
