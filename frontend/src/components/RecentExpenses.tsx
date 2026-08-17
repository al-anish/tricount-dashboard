import { Card, Empty, List, Tag, Typography } from 'antd'
import type { Expense } from '../types'
import { CATEGORY_LABELS } from '../constants'
import { formatCurrency, formatDate } from '../utils/format'

const { Text } = Typography

interface RecentExpensesProps {
  expenses: Expense[]
  currency: string
}

export default function RecentExpenses({ expenses, currency }: RecentExpensesProps) {
  return (
    <Card title="Recent expenses" className="dashboard-card">
      {expenses.length === 0 ? (
        <Empty description="No expenses yet" />
      ) : (
        <List
          dataSource={expenses}
          renderItem={(item) => (
            <List.Item key={item.uuid}>
              <List.Item.Meta
                title={item.description}
                description={
                  <span>
                    <Text type="secondary">{formatDate(item.date)}</Text>{' '}
                    <Tag>{item.category ? CATEGORY_LABELS[item.category] ?? item.category : 'Uncategorized'}</Tag>
                    <Text type="secondary">paid by {item.payer}</Text>
                  </span>
                }
              />
              <Text strong>{formatCurrency(item.amount, currency)}</Text>
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
