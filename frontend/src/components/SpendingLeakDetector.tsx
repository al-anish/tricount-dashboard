import { useMemo } from 'react'
import { Card, Col, Empty, List, Row, Statistic, Tag, Typography } from 'antd'
import {
  AlertOutlined,
  ArrowDownOutlined,
  FireOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'
import type { Expense } from '../types'
import { formatCurrency } from '../utils/format'
import { getCategoryColor, getCategoryLabel } from '../constants'

const { Text } = Typography

interface SpendingLeakDetectorProps {
  expenses: Expense[]
  currency: string
}

interface RepeatedExpense {
  description: string
  count: number
  total: number
  average: number
  category: string | null
}

export default function SpendingLeakDetector({
  expenses,
  currency,
}: SpendingLeakDetectorProps) {
  const analysis = useMemo(() => {
    /*
     * Group expenses by normalized description.
     *
     * "Coffee", "coffee", and " COFFEE "
     * are treated as the same expense.
     */
    const grouped = new Map<
      string,
      {
        description: string
        count: number
        total: number
        category: string | null
      }
    >()

    expenses.forEach((expense) => {
      const normalized = expense.description
        .trim()
        .toLowerCase()

      if (!normalized) return

      const existing = grouped.get(normalized)

      if (existing) {
        existing.count += 1
        existing.total += expense.amount

        // Keep a category if one exists.
        if (!existing.category && expense.category) {
          existing.category = expense.category
        }
      } else {
        grouped.set(normalized, {
          description: expense.description.trim(),
          count: 1,
          total: expense.amount,
          category: expense.category,
        })
      }
    })

    const repeatedExpenses: RepeatedExpense[] = Array.from(
      grouped.values()
    )
      .filter((expense) => expense.count >= 3)
      .map((expense) => ({
        ...expense,
        average: expense.total / expense.count,
      }))
      .sort((a, b) => b.total - a.total)

    /*
     * Small purchases.
     *
     * ₹300 is deliberately used as a simple threshold.
     * We can make this configurable later.
     */
    const smallExpenses = expenses.filter(
      (expense) => expense.amount <= 300
    )

    const smallExpenseTotal = smallExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    )

    /*
     * Find the most expensive repeated purchase.
     */
    const biggestRepeatedExpense =
      repeatedExpenses.length > 0
        ? repeatedExpenses[0]
        : null

    /*
     * Find the category responsible for the most
     * small purchases.
     */
    const smallCategoryMap = new Map<
      string,
      {
        category: string
        amount: number
        count: number
      }
    >()

    smallExpenses.forEach((expense) => {
      const category = expense.category || 'OTHER'

      const existing = smallCategoryMap.get(category)

      if (existing) {
        existing.amount += expense.amount
        existing.count += 1
      } else {
        smallCategoryMap.set(category, {
          category,
          amount: expense.amount,
          count: 1,
        })
      }
    })

    const smallPurchaseCategories = Array.from(
      smallCategoryMap.values()
    ).sort((a, b) => b.amount - a.amount)

    return {
      repeatedExpenses,
      smallExpenses,
      smallExpenseTotal,
      biggestRepeatedExpense,
      smallPurchaseCategories,
    }
  }, [expenses])

  if (!expenses.length) {
    return (
      <Card>
        <Empty description="Not enough expense data to detect spending leaks." />
      </Card>
    )
  }

  const {
    repeatedExpenses,
    smallExpenses,
    smallExpenseTotal,
    biggestRepeatedExpense,
    smallPurchaseCategories,
  } = analysis

  const totalSpending = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  )

  const smallExpensePercentage =
    totalSpending > 0
      ? (smallExpenseTotal / totalSpending) * 100
      : 0

  /*
   * Hypothetical saving:
   *
   * If the user reduces repeated purchases by 15%.
   */
  const repeatedSpending = repeatedExpenses.reduce(
    (sum, expense) => sum + expense.total,
    0
  )

  const potentialSaving = repeatedSpending * 0.15

  return (
    <>
      {/* Summary */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Small purchases"
              value={smallExpenses.length}
              prefix={<ShoppingOutlined />}
            />

            <Text type="secondary">
              Expenses of ₹300 or less
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Small purchase total"
              value={formatCurrency(
                smallExpenseTotal,
                currency
              )}
              prefix={<AlertOutlined />}
            />

            <Text type="secondary">
              {smallExpensePercentage.toFixed(1)}% of total spending
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Repeated purchases"
              value={repeatedExpenses.length}
              prefix={<FireOutlined />}
            />

            <Text type="secondary">
              Bought 3 or more times
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Potential saving"
              value={formatCurrency(
                potentialSaving,
                currency
              )}
              prefix={<ArrowDownOutlined />}
            />

            <Text type="secondary">
              If repeated spending falls by 15%
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Biggest repeated expenses */}
      <Card
        title={
          <span>
            <FireOutlined style={{ marginRight: 8 }} />
            Repeated spending
          </span>
        }
        style={{ marginTop: 16 }}
      >
        {repeatedExpenses.length === 0 ? (
          <Empty
            description="No repeated purchases detected yet."
          />
        ) : (
          <List
            dataSource={repeatedExpenses.slice(0, 8)}
            renderItem={(expense) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <span>
                      {expense.description}{' '}
                      {expense.category && (
                        <Tag
                          style={{
                            color: getCategoryColor(
                              expense.category
                            ),
                            borderColor: getCategoryColor(
                              expense.category
                            ),
                          }}
                        >
                          {getCategoryLabel(expense.category)}
                        </Tag>
                      )}
                    </span>
                  }
                  description={
                    <>
                      {expense.count} purchases ·{' '}
                      Average{' '}
                      {formatCurrency(
                        expense.average,
                        currency
                      )}
                    </>
                  }
                />

                <Text strong>
                  {formatCurrency(
                    expense.total,
                    currency
                  )}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Small purchase categories */}
      <Card
        title={
          <span>
            <AlertOutlined style={{ marginRight: 8 }} />
            Where small purchases are adding up
          </span>
        }
        style={{ marginTop: 16 }}
      >
        {smallPurchaseCategories.length === 0 ? (
          <Empty description="No small purchases found." />
        ) : (
          <List
            dataSource={smallPurchaseCategories.slice(0, 6)}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Tag
                      style={{
                        color: getCategoryColor(
                          item.category
                        ),
                        borderColor: getCategoryColor(
                          item.category
                        ),
                      }}
                    >
                      {getCategoryLabel(item.category)}
                    </Tag>
                  }
                  description={`${item.count} small purchases`}
                />

                <Text strong>
                  {formatCurrency(
                    item.amount,
                    currency
                  )}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Saving suggestion */}
      {biggestRepeatedExpense && (
        <Card
          size="small"
          style={{
            marginTop: 16,
            background: '#fff7e6',
            borderColor: '#ffd591',
          }}
        >
          <Text>
            💡 <Text strong>{biggestRepeatedExpense.description}</Text>{' '}
            is your biggest repeated spending pattern.
            You've spent{' '}
            <Text strong>
              {formatCurrency(
                biggestRepeatedExpense.total,
                currency
              )}
            </Text>{' '}
            across {biggestRepeatedExpense.count} purchases.
          </Text>

          <div style={{ marginTop: 6 }}>
            <Text type="secondary">
              Reducing this type of purchase by 15% could
              potentially save{' '}
              <Text strong>
                {formatCurrency(
                  biggestRepeatedExpense.total * 0.15,
                  currency
                )}
              </Text>
              .
            </Text>
          </div>
        </Card>
      )}
    </>
  )
}