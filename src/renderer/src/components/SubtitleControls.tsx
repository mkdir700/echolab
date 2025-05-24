import React from 'react'
import { Button, Switch, Space, Tooltip } from 'antd'
import {
  StepBackwardOutlined,
  StepForwardOutlined,
  ReloadOutlined,
  SyncOutlined
} from '@ant-design/icons'

interface SubtitleControlsProps {
  isSingleLoop: boolean
  isAutoLoop: boolean
  isVideoLoaded: boolean
  subtitlesLength: number
  onToggleSingleLoop: () => void
  onToggleAutoLoop: () => void
  onGoToPrevious: () => void
  onGoToNext: () => void
}

export function SubtitleControls({
  isSingleLoop,
  isAutoLoop,
  isVideoLoaded,
  subtitlesLength,
  onToggleSingleLoop,
  onToggleAutoLoop,
  onGoToPrevious,
  onGoToNext
}: SubtitleControlsProps): React.JSX.Element {
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
              <Tooltip title="开启后，所有字幕播放完毕会从第一句重新开始">
                <Space align="center" size="small">
                  <SyncOutlined style={{ color: isAutoLoop ? '#1890ff' : '#8c8c8c' }} />
                  <span className="control-label">自动循环</span>
                  <Switch
                    checked={isAutoLoop}
                    onChange={onToggleAutoLoop}
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
}
