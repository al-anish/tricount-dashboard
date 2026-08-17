import { Card, Col, Empty, Row, Tag, Typography } from 'antd'
import type { Balance } from '../types'
import { formatCurrency } from '../utils/format'

const { Text } = Typography

interface BalanceCardProps {
  balances: Balance[]
  currency: string
}

const STATUS_META: Record<Balance['status'], { color: string; label: string }> = {
  owed: { color: 'green', label: 'is owed' },
  owes: { color: 'red', label: 'owes' },
  settled: { color: 'default', label: 'settled up' },
}

export default function BalanceCard({ balances, currency }: BalanceCardProps) {
  return (
    <Card title="Balances" className="dashboard-card">
      {balances.length === 0 ? (
        <Empty description="No balance data" />
      ) : (
        <Row gutter={[16, 16]}>
          {balances.map((b) => {
            const meta = STATUS_META[b.status]
            return (
              <Col xs={24} sm={12} lg={8} key={b.uuid || b.member}>
                <Card size="small">
                  <Text strong>{b.member}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color={meta.color}>{meta.label}</Tag>
                    <Text>{formatCurrency(Math.abs(b.amount), currency)}</Text>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </Card>
  )
}
