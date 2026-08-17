import { useCallback, useEffect, useState } from 'react'
import {
  BarChartOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  PieChartOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  WalletOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Alert, Button, Empty, Skeleton, Space, Tag, Typography } from 'antd'
import { fetchTricount } from './api/tricount'
import { fetchDashboard } from './api/dashboard'
import { fetchBalances } from './api/balances'
import { fetchExpenses } from './api/expenses'
import { getErrorMessage } from './api/client'
import type { Balances, Dashboard, Expense, TricountInfo } from './types'
import SummaryCards from './components/SummaryCards'
import SpendingChart from './components/SpendingChart'
import CategoryChart from './components/CategoryChart'
import MemberSpendingChart from './components/MemberSpendingChart'
import RecentExpenses from './components/RecentExpenses'
import ExpenseTable from './components/ExpenseTable'
import BalanceCard from './components/BalanceCard'

import CollapsibleSection from './components/CollapsibleSection'
import SpendingInsights from './components/SpendingInsights'

const { Title, Text } = Typography

export default function App() {
  const [tricount, setTricount] = useState<TricountInfo | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [balances, setBalances] = useState<Balances | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshSignal, setRefreshSignal] = useState(0)

  const loadAll = useCallback(async () => {
    setError(null)
    try {
      const [tricountData, dashboardData, balancesData, expensesData] = await Promise.all([
        fetchTricount(),
        fetchDashboard(),
        fetchBalances(),
        fetchExpenses({}),
      ])
      setTricount(tricountData)
      setDashboard(dashboardData)
      setBalances(balancesData)
      setRecentExpenses(expensesData.items.slice(0, 10))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAll()
    setRefreshSignal((n) => n + 1)
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="dashboard-shell">
        <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
        <Skeleton active paragraph={{ rows: 3 }} style={{ marginBottom: 24 }} />
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    )
  }

  if (error || !tricount || !dashboard || !balances) {
    return (
      <div className="dashboard-shell">
        <Alert
          type="error"
          showIcon
          message="Couldn't load your Tricount data"
          description={error ?? 'Something went wrong while loading the dashboard.'}
          action={
            <Button icon={<ReloadOutlined />} onClick={() => loadAll()}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  const categories = dashboard.categories.map((c) => c.category)
  const memberNames = tricount.members.map((m) => m.name)

  return (
    <div className="dashboard-shell">
      <div className="dashboard-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {tricount.title}
          </Title>
          <Space size="small">
            <Tag color="blue">{tricount.currency}</Tag>
            <Text type="secondary">
              {tricount.members.length} member{tricount.members.length === 1 ? '' : 's'}
            </Text>
          </Space>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing}>
          Refresh
        </Button>
      </div>

      {dashboard.expense_count === 0 ? (
  <Empty
    className="dashboard-section"
    description="No expenses found in this Tricount yet."
  />
) : (
  <>
    <CollapsibleSection
      title="Overview"
      icon={<WalletOutlined />}
      defaultOpen
    >
      <SummaryCards
        dashboard={dashboard}
        currency={tricount.currency}
      />
    </CollapsibleSection>

    <CollapsibleSection
      title="Spending insights"
      icon={<ThunderboltOutlined />}
      defaultOpen
    >
      <SpendingInsights
        dashboard={dashboard}
        currency={tricount.currency}
      />
    </CollapsibleSection>

    <CollapsibleSection
      title="Spending trend"
      icon={<BarChartOutlined />}
      defaultOpen
    >
      <SpendingChart
        data={dashboard.daily_spending}
        currency={tricount.currency}
      />
    </CollapsibleSection>

    <div className="dashboard-section chart-grid">
      <CollapsibleSection
        title="Spending by category"
        icon={<PieChartOutlined />}
        defaultOpen
      >
        <CategoryChart
          data={dashboard.categories}
          currency={tricount.currency}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Spending by member"
        icon={<TeamOutlined />}
        defaultOpen
      >
        <MemberSpendingChart
          data={dashboard.member_spending}
          currency={tricount.currency}
        />
      </CollapsibleSection>
    </div>

    <CollapsibleSection
      title="Recent expenses"
      icon={<FileTextOutlined />}
      defaultOpen
    >
      <RecentExpenses
        expenses={recentExpenses}
        currency={tricount.currency}
      />
    </CollapsibleSection>

    <CollapsibleSection
      title="All expenses"
      icon={<FileTextOutlined />}
      defaultOpen
    >
      <ExpenseTable
        categories={categories}
        members={memberNames}
        currency={tricount.currency}
        refreshSignal={refreshSignal}
      />
    </CollapsibleSection>

    <CollapsibleSection
      title="Balances"
      icon={<CreditCardOutlined />}
      defaultOpen
    >
      <BalanceCard
        balances={balances.balances}
        currency={tricount.currency}
      />
    </CollapsibleSection>
  </>
)}

      <div className="dashboard-section">
        <BalanceCard balances={balances.balances} currency={tricount.currency} />
      </div>
    </div>
  )
}
