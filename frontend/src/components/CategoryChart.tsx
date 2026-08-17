import { Card, Empty } from 'antd'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { CategorySpending } from '../types'
import { formatCurrency } from '../utils/format'
import { CATEGORY_LABELS, CHART_COLORS } from '../constants'

interface CategoryChartProps {
  data: CategorySpending[]
  currency: string
}

export default function CategoryChart({ data, currency }: CategoryChartProps) {
  return (
    <Card title="Spending by category" className="chart-card">
      {data.length === 0 ? (
        <Empty description="No categorized spending yet" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={data} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={95} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
            <Legend formatter={(value: string) => CATEGORY_LABELS[value] ?? value} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
