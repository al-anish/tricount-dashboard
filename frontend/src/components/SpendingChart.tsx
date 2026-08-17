import { Card, Empty } from 'antd'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailySpending } from '../types'
import { formatCurrency, formatDate } from '../utils/format'

interface SpendingChartProps {
  data: DailySpending[]
  currency: string
}

export default function SpendingChart({ data, currency }: SpendingChartProps) {
  return (
    <Card title="Daily spending trend" className="chart-card">
      {data.length === 0 ? (
        <Empty description="No spending data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2f54eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2f54eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDate} minTickGap={24} />
            <YAxis tickFormatter={(v: number) => formatCurrency(v, currency)} width={90} />
            <Tooltip formatter={(value: number) => formatCurrency(value, currency)} labelFormatter={formatDate} />
            <Area type="monotone" dataKey="amount" stroke="#2f54eb" fill="url(#spendingFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
