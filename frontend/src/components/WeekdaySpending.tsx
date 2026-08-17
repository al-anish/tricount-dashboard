import { Card, Col, Row, Statistic, Tag, Typography } from 'antd'
import { CalendarOutlined, RiseOutlined } from '@ant-design/icons'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Expense } from '../types'
import { formatCurrency } from '../utils/format'

const { Text } = Typography

interface WeekdaySpendingProps {
  expenses: Expense[]
  currency: string
}

interface DayData {
  day: string
  fullDay: string
  amount: number
  count: number
}

const DAYS = [
  { key: 0, name: 'Sunday' },
  { key: 1, name: 'Monday' },
  { key: 2, name: 'Tuesday' },
  { key: 3, name: 'Wednesday' },
  { key: 4, name: 'Thursday' },
  { key: 5, name: 'Friday' },
  { key: 6, name: 'Saturday' },
]

export default function WeekdaySpending({
  expenses,
  currency,
}: WeekdaySpendingProps) {
  const weekdayData: DayData[] = DAYS.map(({ key, name }) => {
    const dayExpenses = expenses.filter((expense) => {
      if (!expense.date) return false

      // Use noon to avoid timezone shifting the date.
      const date = new Date(`${expense.date}T12:00:00`)
      return date.getDay() === key
    })

    const amount = dayExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    )

    return {
      day: name.slice(0, 3),
      fullDay: name,
      amount,
      count: dayExpenses.length,
    }
  })

  const totalSpending = weekdayData.reduce(
    (sum, day) => sum + day.amount,
    0
  )

  const activeDays = weekdayData.filter((day) => day.count > 0)

  const highestDay =
    activeDays.length > 0
      ? activeDays.reduce((highest, day) =>
          day.amount > highest.amount ? day : highest
        )
      : null

  const averagePerTransaction =
    expenses.length > 0
      ? totalSpending / expenses.length
      : 0

  const highestDayPercentage =
    highestDay && totalSpending > 0
      ? (highestDay.amount / totalSpending) * 100
      : 0

  const getBarColor = (day: DayData) => {
    if (!highestDay) return '#2f54eb'

    return day.fullDay === highestDay.fullDay
      ? '#fa541c'
      : '#2f54eb'
  }

  if (!expenses.length) {
    return (
      <Card title="Spending by day of week">
        <Text type="secondary">
          No expense data available.
        </Text>
      </Card>
    )
  }

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Highest spending day"
              value={highestDay?.fullDay ?? '—'}
              prefix={<RiseOutlined />}
            />

            {highestDay && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  {formatCurrency(highestDay.amount, currency)} spent
                </Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Average expense"
              value={formatCurrency(
                averagePerTransaction,
                currency
              )}
              prefix={<CalendarOutlined />}
            />

            <Text type="secondary">
              Across all recorded transactions
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Highest day share"
              value={`${highestDayPercentage.toFixed(1)}%`}
              prefix={<RiseOutlined />}
            />

            {highestDay && (
              <Tag color="orange" style={{ marginTop: 8 }}>
                {highestDay.fullDay}
              </Tag>
            )}
          </Card>
        </Col>
      </Row>

      <Card>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={weekdayData}
            margin={{
              top: 10,
              right: 20,
              left: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis dataKey="day" />

            <YAxis
              tickFormatter={(value: number) =>
                formatCurrency(value, currency)
              }
              width={90}
            />

            <Tooltip
              formatter={(value: number) =>
                formatCurrency(value, currency)
              }
              labelFormatter={(label) => {
                const day = weekdayData.find(
                  (item) => item.day === label
                )

                return day?.fullDay ?? label
              }}
            />

            <Bar
              dataKey="amount"
              radius={[6, 6, 0, 0]}
            >
              {weekdayData.map((day) => (
                <Cell
                  key={day.fullDay}
                  fill={getBarColor(day)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {highestDay && (
        <Card
          size="small"
          style={{
            marginTop: 16,
            background: '#fff7e6',
            borderColor: '#ffd591',
          }}
        >
          <Text>
            💡 You spend the most on{' '}
            <Text strong>{highestDay.fullDay}</Text>, with{' '}
            <Text strong>
              {formatCurrency(
                highestDay.amount,
                currency
              )}
            </Text>{' '}
            across {highestDay.count}{' '}
            {highestDay.count === 1
              ? 'expense'
              : 'expenses'}.
          </Text>

          <div style={{ marginTop: 6 }}>
            <Text type="secondary">
              If weekends or specific days are discretionary,
              this could be an area worth watching for savings.
            </Text>
          </div>
        </Card>
      )}
    </div>
  )
}