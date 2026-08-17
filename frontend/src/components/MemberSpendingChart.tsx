import { Card, Empty } from 'antd'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MemberSpending } from '../types'
import { formatCurrency } from '../utils/format'

interface MemberSpendingChartProps {
  data: MemberSpending[]
  currency: string
}

export default function MemberSpendingChart({ data, currency }: MemberSpendingChartProps) {
  return (
    <Card title="Spending by member" className="chart-card">
      {data.length === 0 ? (
        <Empty description="No spending data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="member" />
            <YAxis tickFormatter={(v: number) => formatCurrency(v, currency)} width={90} />
            <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
            <Bar dataKey="amount" fill="#2f54eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
