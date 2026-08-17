import { Collapse } from 'antd'
import type { ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export default function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
  className = '',
}: CollapsibleSectionProps) {
  return (
    <Collapse
      className={`dashboard-section collapsible-section ${className}`}
      defaultActiveKey={defaultOpen ? ['section'] : []}
      items={[
        {
          key: 'section',
          label: (
            <span className="collapsible-section-title">
              {icon} {' '}
              <span>{title}</span>
            </span>
          ),
          children,
        },
      ]}
    />
  )
}