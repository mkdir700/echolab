import React from 'react'
import { Typography, Empty } from 'antd'
import { HeartOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export function FavoritesPage(): React.JSX.Element {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <Empty
        image={<HeartOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />}
        description={
          <div>
            <Title level={3} style={{ color: 'var(--text-primary)' }}>
              收藏夹
            </Title>
            <Text style={{ color: 'var(--text-muted)' }}>这里将显示您收藏的视频和字幕片段</Text>
          </div>
        }
      />
    </div>
  )
}
