import { Card, Col, Row, Statistic, Tooltip } from 'antd'
import { ArrowUpOutlined, CalendarOutlined, RiseOutlined, WalletOutlined } from '@ant-design/icons'
import type { Dashboard } from '../types'
import { formatCurrency } from '../utils/format'

interface SummaryCardsProps {
  dashboard: Dashboard
  currency: string
}

export default function SummaryCards({ dashboard, currency }: SummaryCardsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Spending"
            value={formatCurrency(dashboard.total_expenses, currency)}
            prefix={<WalletOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="Expense Count" value={dashboard.expense_count} prefix={<CalendarOutlined />} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Average Daily"
            value={formatCurrency(dashboard.average_daily, currency)}
            prefix={<RiseOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Tooltip title={dashboard.highest_expense?.description}>
            <Statistic
              title={dashboard.highest_expense ? `Highest: ${dashboard.highest_expense.description}` : 'Highest Expense'}
              value={dashboard.highest_expense ? formatCurrency(dashboard.highest_expense.amount, currency) : '—'}
              prefix={<ArrowUpOutlined />}
            />
          </Tooltip>
        </Card>
      </Col>
    </Row>
  )
}
