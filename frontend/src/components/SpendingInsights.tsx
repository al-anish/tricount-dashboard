import { Card, Col, Row, Statistic, Tag, Typography } from 'antd'
import {
  ArrowDownOutlined,
  RiseOutlined,
  ShoppingOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import type { Dashboard } from '../types'
import { formatCurrency } from '../utils/format'
import { getCategoryColor, getCategoryLabel } from '../constants'

const { Text } = Typography

interface SpendingInsightsProps {
  dashboard: Dashboard
  currency: string
}

export default function SpendingInsights({
  dashboard,
  currency,
}: SpendingInsightsProps) {
  if (!dashboard.categories.length) return null

  const topCategory = dashboard.categories[0]

  const foodCategories = ['FOOD_AND_DRINK', 'OTHER']
  const foodSpending = dashboard.categories
    .filter((category) => foodCategories.includes(category.category))
    .reduce((sum, category) => sum + category.amount, 0)

  const topCategoryPercentage =
    dashboard.total_expenses > 0
      ? (topCategory.amount / dashboard.total_expenses) * 100
      : 0

  const potentialSaving = topCategory.amount * 0.1

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Biggest category"
            value={formatCurrency(topCategory.amount, currency)}
            prefix={<TrophyOutlined />}
          />
          <Tag
            style={{
              marginTop: 10,
              color: getCategoryColor(topCategory.category),
              borderColor: getCategoryColor(topCategory.category),
            }}
          >
            {getCategoryLabel(topCategory.category)}
          </Tag>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              {topCategoryPercentage.toFixed(1)}% of total spending
            </Text>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Food & snacks"
            value={formatCurrency(foodSpending, currency)}
            prefix={<ShoppingOutlined />}
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              Across food and snack purchases
            </Text>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Potential saving"
            value={formatCurrency(potentialSaving, currency)}
            prefix={<ArrowDownOutlined />}
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              If you reduce your biggest category by 10%
            </Text>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Average daily"
            value={formatCurrency(dashboard.average_daily, currency)}
            prefix={<RiseOutlined />}
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              Based on your recorded spending period
            </Text>
          </div>
        </Card>
      </Col>
    </Row>
  )
}