import { Card, Col, Progress, Row, Statistic, Tag, Typography } from 'antd'
import {
  ArrowDownOutlined,
  BulbOutlined,
  CalendarOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import type { Dashboard, Expense } from '../types'
import { formatCurrency } from '../utils/format'
import { getCategoryColor, getCategoryLabel } from '../constants'

const { Text } = Typography

interface SavingsCommandCenterProps {
  dashboard: Dashboard
  expenses: Expense[]
  currency: string
}

export default function SavingsCommandCenter({
  dashboard,
  expenses,
  currency,
}: SavingsCommandCenterProps) {
  if (!dashboard.total_expenses || !dashboard.categories.length) {
    return null
  }

  // Biggest spending category
  const biggestCategory = dashboard.categories[0]

  const biggestCategoryPercentage =
    (biggestCategory.amount / dashboard.total_expenses) * 100

  // Hypothetical 10% reduction in biggest category
  const potentialMonthlySaving = biggestCategory.amount * 0.1
  const potentialYearlySaving = potentialMonthlySaving * 12

  // Small expense analysis
  const smallExpenses = expenses.filter((expense) => expense.amount <= 300)

  const smallExpenseTotal = smallExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  )

  const smallExpensePercentage =
    (smallExpenseTotal / dashboard.total_expenses) * 100

  // Determine whether a category is dominating spending
  const isCategoryDominating = biggestCategoryPercentage >= 30

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* Current spending */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total spending"
              value={formatCurrency(
                dashboard.total_expenses,
                currency
              )}
              prefix={<CalendarOutlined />}
            />

            <Text type="secondary">
              {dashboard.expense_count} expenses recorded
            </Text>
          </Card>
        </Col>

        {/* Biggest category */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Biggest spending area"
              value={formatCurrency(
                biggestCategory.amount,
                currency
              )}
              prefix={<WarningOutlined />}
            />

            <Tag
              style={{
                marginTop: 8,
                color: getCategoryColor(biggestCategory.category),
                borderColor: getCategoryColor(biggestCategory.category),
              }}
            >
              {getCategoryLabel(biggestCategory.category)}
            </Tag>

            <div style={{ marginTop: 10 }}>
              <Progress
                percent={Number(biggestCategoryPercentage.toFixed(1))}
                size="small"
                strokeColor={getCategoryColor(biggestCategory.category)}
                format={(percent) => `${percent}% of spending`}
              />
            </div>
          </Card>
        </Col>

        {/* Potential monthly saving */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Potential monthly saving"
              value={formatCurrency(
                potentialMonthlySaving,
                currency
              )}
              prefix={<ArrowDownOutlined />}
            />

            <Text type="secondary">
              If you reduce your biggest category by 10%
            </Text>
          </Card>
        </Col>

        {/* Yearly impact */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Potential yearly saving"
              value={formatCurrency(
                potentialYearlySaving,
                currency
              )}
              prefix={<BulbOutlined />}
            />

            <Text type="secondary">
              Based on the same 10% reduction
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Insights */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <BulbOutlined style={{ marginRight: 8 }} />
                Saving opportunity
              </span>
            }
          >
            <div style={{ marginBottom: 12 }}>
              <Text strong>
                {getCategoryLabel(biggestCategory.category)}
              </Text>{' '}
              is currently your largest spending category.
            </div>

            <Text type="secondary">
              You spent{' '}
              <Text strong>
                {formatCurrency(
                  biggestCategory.amount,
                  currency
                )}
              </Text>{' '}
              here, which represents{' '}
              <Text strong>
                {biggestCategoryPercentage.toFixed(1)}%
              </Text>{' '}
              of your total spending.
            </Text>

            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: '#f6ffed',
                borderRadius: 8,
              }}
            >
              <Text>
                Reducing this category by just 10% could save you{' '}
                <Text strong>
                  {formatCurrency(
                    potentialMonthlySaving,
                    currency
                  )}
                </Text>{' '}
                over the same spending period.
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <WarningOutlined style={{ marginRight: 8 }} />
                Small expense leak
              </span>
            }
          >
            <div style={{ marginBottom: 12 }}>
              <Text strong>
                {smallExpenses.length}
              </Text>{' '}
              expenses were ₹300 or less.
            </div>

            <Text type="secondary">
              Together, these small purchases account for{' '}
              <Text strong>
                {formatCurrency(
                  smallExpenseTotal,
                  currency
                )}
              </Text>{' '}
              ({smallExpensePercentage.toFixed(1)}% of total spending).
            </Text>

            {smallExpensePercentage >= 15 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: '#fff7e6',
                  borderRadius: 8,
                }}
              >
                <Text>
                  💡 Small purchases are adding up. Reviewing these
                  expenses could reveal an easy place to cut back.
                </Text>
              </div>
            )}

            {smallExpensePercentage < 15 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: '#f6ffed',
                  borderRadius: 8,
                }}
              >
                <Text>
                  👍 Small purchases don't appear to be a major
                  part of your overall spending.
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {isCategoryDominating && (
        <Card
          style={{
            marginTop: 16,
            borderColor: '#faad14',
          }}
        >
          <Text strong>
            ⚠️ Your spending is concentrated in{' '}
            {getCategoryLabel(biggestCategory.category)}.
          </Text>

          <div style={{ marginTop: 6 }}>
            <Text type="secondary">
              More than 30% of your recorded spending is going
              toward this category. This is the first place I'd
              look for potential savings.
            </Text>
          </div>
        </Card>
      )}
    </div>
  )
}