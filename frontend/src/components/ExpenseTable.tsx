import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, DatePicker, Empty, Input, Select, Space, Table, Tag } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { fetchExpenses } from '../api/expenses'
import { getErrorMessage } from '../api/client'
import type { Expense, ExpenseFilters } from '../types'
import { formatCurrency } from '../utils/format'
import { getCategoryColor, getCategoryLabel } from '../constants'

const { RangePicker } = DatePicker

interface ExpenseTableProps {
  categories: string[]
  members: string[]
  currency: string
  /** Bump this from the parent's Refresh button to force a refetch. */
  refreshSignal: number
}

export default function ExpenseTable({ categories, members, currency, refreshSignal }: ExpenseTableProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [member, setMember] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  const [items, setItems] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filteredTotal = items.reduce((sum, item) => sum + item.amount, 0)

  const averageExpense = items.length
    ? filteredTotal / items.length
    : 0
  // Debounce the free-text search so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    const filters: ExpenseFilters = {
      search: debouncedSearch || undefined,
      category,
      member,
      start_date: dateRange ? dateRange[0].format('YYYY-MM-DD') : undefined,
      end_date: dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined,
    }
    setLoading(true)
    setError(null)
    fetchExpenses(filters)
      .then((data) => {
        if (!cancelled) setItems(data.items)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, category, member, dateRange, refreshSignal, retryToken])

  const columns: ColumnsType<Expense> = useMemo(
    () => [
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        sorter: (a, b) => a.date.localeCompare(b.date),
        defaultSortOrder: 'descend',
        width: 120,
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        width: 180,
       render: (value: string | null) => (
          <Tag color={getCategoryColor(value)}>
            {getCategoryLabel(value)}
          </Tag>
        ),
      },
      {
        title: 'Payer',
        dataIndex: 'payer',
        key: 'payer',
        width: 140,
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        width: 130,
        sorter: (a, b) => a.amount - b.amount,
        render: (value: number) => formatCurrency(value, currency),
      },
    ],
    [currency]
  )

  const resetFilters = () => {
    setSearch('')
    setCategory(undefined)
    setMember(undefined)
    setDateRange(null)
  }

  const hasFilters = Boolean(search || category || member || dateRange)

  return (
    <Card title="All expenses" className="dashboard-card">
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          allowClear
          placeholder="Search description"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
        <Select
          allowClear
          placeholder="Category"
          style={{ width: 190 }}
          value={category}
          onChange={setCategory}
          options={categories.map((c) => ({
            value: c,
            label: getCategoryLabel(c),
          }))}
        />
        <Select
          allowClear
          placeholder="Member"
          style={{ width: 160 }}
          value={member}
          onChange={setMember}
          options={members.map((m) => ({ value: m, label: m }))}
        />
        <RangePicker value={dateRange ?? undefined} onChange={(values) => setDateRange(values && values[0] && values[1] ? [values[0], values[1]] : null)} />
        {hasFilters && <Button onClick={resetFilters}>Clear filters</Button>}
      </Space>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Couldn't load expenses"
          description={error}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => setRetryToken((t) => t + 1)}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        rowKey="uuid"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
        locale={{
          emptyText: <Empty description={hasFilters ? 'No expenses match these filters.' : 'No expenses yet.'} />,
        }}
        scroll={{ x: 700 }}
      />
      {!loading && items.length > 0 && (
        <div className="expense-table-summary">
          <div>
            <span>Showing {' '}</span>
            <strong>{items.length}</strong>
            <span>{' '}expenses</span>
          </div>

          <div>
            <span>Average{' '}</span>
            <strong>{formatCurrency(averageExpense, currency)}</strong>
          </div>

          <div>
            <span>Total spending{' '}</span>
            <strong>{formatCurrency(filteredTotal, currency)}</strong>
          </div>
        </div>
      )}
    </Card>
  )
}
