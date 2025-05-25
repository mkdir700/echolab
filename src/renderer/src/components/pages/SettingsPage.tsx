import React, { useState } from 'react'
import { Typography, Row, Col } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { ShortcutsSection } from '@renderer/components/settings/ShortcutsSection'
import { DataManagementSection } from '@renderer/components/settings/DataManagementSection'
import { SettingsNavigation } from '@renderer/components/settings/SettingsNavigation'
import { PlaceholderSection } from '@renderer/components/settings/PlaceholderSection'

const { Title } = Typography

export function SettingsPage(): React.JSX.Element {
  const [activeSection, setActiveSection] = useState('shortcuts')

  const renderMainContent = (): React.JSX.Element => {
    switch (activeSection) {
      case 'shortcuts':
        return (
          <>
            <ShortcutsSection />
            <div style={{ marginTop: 24 }}>
              <DataManagementSection />
            </div>
          </>
        )
      case 'appearance':
        return <PlaceholderSection title="外观设置" description="主题、字体大小等外观相关设置" />
      case 'dictionary':
        return (
          <PlaceholderSection title="查单词设置" description="配置欧陆词典 API Key 等查词功能" />
        )
      case 'about':
        return <PlaceholderSection title="关于应用" description="版本信息、更新检查等" />
      default:
        return <ShortcutsSection />
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <SettingOutlined className="settings-icon" />
        <Title level={2} style={{ color: 'var(--text-primary)', margin: 0 }}>
          设置
        </Title>
      </div>

      <div className="settings-content">
        <Row gutter={24}>
          <Col span={6}>
            <SettingsNavigation activeSection={activeSection} onSectionChange={setActiveSection} />
          </Col>

          <Col span={18}>
            <div className="settings-main">{renderMainContent()}</div>
          </Col>
        </Row>
      </div>
    </div>
  )
}
