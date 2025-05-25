import React from 'react'
import { Card, Typography } from 'antd'

const { Text } = Typography

interface PlaceholderSectionProps {
  title: string
  description: string
  className?: string
}

export function PlaceholderSection({
  title,
  description,
  className
}: PlaceholderSectionProps): React.JSX.Element {
  return (
    <Card title={title} className={`settings-section-card ${className || ''}`}>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Text style={{ color: 'var(--text-muted)' }}>{description}</Text>
      </div>
    </Card>
  )
}
