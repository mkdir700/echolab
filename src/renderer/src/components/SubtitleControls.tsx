import React from 'react'
import { Button, Switch, Space, Tooltip } from 'antd'
import {
  StepBackwardOutlined,
  StepForwardOutlined,
  ReloadOutlined,
  PauseCircleOutlined
} from '@ant-design/icons'

interface SubtitleControlsProps {
  isSingleLoop: boolean
  isAutoPause: boolean
  isVideoLoaded: boolean
  subtitlesLength: number
  onToggleSingleLoop: () => void
  onToggleAutoPause: () => void
  onGoToPrevious: () => void
  onGoToNext: () => void
}

// 使用React.memo优化组件，避免不必要的重新渲染
export const SubtitleControls = React.memo<SubtitleControlsProps>(function SubtitleControls({
  isSingleLoop,
  isAutoPause,
  isVideoLoaded,
  subtitlesLength,
  onToggleSingleLoop,
  onToggleAutoPause,
  onGoToPrevious,
  onGoToNext
}) {
  const hasSubtitles = subtitlesLength > 0
  const isDisabled = !isVideoLoaded || !hasSubtitles

  return (
    <div className="subtitle-controls">
      <div className="subtitle-controls-content">
        {/* 左侧：循环控制开关 */}
        <div className="loop-controls">
          <Space size="large">
            <div className="control-item">
              <Tooltip title="开启后，当前字幕播放完毕会自动重复播放">
                <Space align="center" size="small">
                  <ReloadOutlined style={{ color: isSingleLoop ? '#1890ff' : '#8c8c8c' }} />
                  <span className="control-label">单句循环</span>
                  <Switch
                    checked={isSingleLoop}
                    onChange={onToggleSingleLoop}
                    disabled={isDisabled}
                    size="small"
                  />
                </Space>
              </Tooltip>
            </div>

            <div className="control-item">
              <Tooltip title="开启后，每句字幕播放完毕会自动暂停视频">
                <Space align="center" size="small">
                  <PauseCircleOutlined style={{ color: isAutoPause ? '#1890ff' : '#8c8c8c' }} />
                  <span className="control-label">自动暂停</span>
                  <Switch
                    checked={isAutoPause}
                    onChange={onToggleAutoPause}
                    disabled={isDisabled}
                    size="small"
                  />
                </Space>
              </Tooltip>
            </div>
          </Space>
        </div>

        {/* 右侧：字幕导航按钮 */}
        <div className="navigation-controls">
          <Space size="small">
            <Tooltip title="跳转到上一句字幕">
              <Button
                type="default"
                icon={<StepBackwardOutlined />}
                onClick={onGoToPrevious}
                disabled={isDisabled}
                size="small"
              >
                上一句
              </Button>
            </Tooltip>

            <Tooltip title="跳转到下一句字幕">
              <Button
                type="default"
                icon={<StepForwardOutlined />}
                onClick={onGoToNext}
                disabled={isDisabled}
                size="small"
              >
                下一句
              </Button>
            </Tooltip>
          </Space>
        </div>
      </div>
    </div>
  )
})
