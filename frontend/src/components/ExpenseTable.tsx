import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, DatePicker, Empty, Input, Select, Space, Table, Tag, Modal, Form, InputNumber, Popconfirm, message } from 'antd'
import { ReloadOutlined, SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses'
import { getErrorMessage } from '../api/client'
import type { Expense, ExpenseFilters, Member } from '../types'
import { formatCurrency } from '../utils/format'
import { getCategoryColor, getCategoryLabel } from '../constants'

const { RangePicker } = DatePicker

interface ExpenseTableProps {
  categories: string[]
  members: Member[]
  currency: string
  /** Bump this from the parent's Refresh button to force a refetch. */
  refreshSignal: number
  onMutated: () => Promise<void>
}

export default function ExpenseTable({ categories, members, currency, refreshSignal, onMutated }: ExpenseTableProps) {
  const [form] = Form.useForm()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [member, setMember] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  // Populate values before opening the modal. Keep the Form mounted so AntD
  // cannot discard values during the Modal's open animation.
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
      {
        title: 'Actions',
        key: 'actions',
        width: 150,
        render: (_: unknown, expense: Expense) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} disabled={!expense.id} onClick={() => openEdit(expense)}>Edit</Button>
            <Popconfirm
              title="Delete expense?"
              description={`Delete “${expense.description}” (${formatCurrency(expense.amount, currency)}) from Tricount?`}
              okText="Delete"
              okButtonProps={{ danger: true, loading: deletingId === expense.id, disabled: deletingId !== null }}
              cancelButtonProps={{ disabled: deletingId !== null }}
              onConfirm={() => handleDelete(expense)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} disabled={!expense.id || deletingId !== null}>Delete</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [currency, deletingId]
  )

  const openAdd = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ date: undefined, category: categories[0] ?? 'OTHER', split_member_uuids: [] })
    setModalOpen(true)
  }

  const openEdit = (expense: Expense) => {
    setEditing(expense)
    form.resetFields()
    form.setFieldsValue({
      description: expense.description ?? '',
      amount: Number(expense.amount),
      date: expense.date ? dayjs(expense.date) : undefined,
      category: expense.category ?? 'OTHER',
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      if (editing) {
        if (!editing.id) throw new Error('This expense has no Tricount transaction ID and cannot be edited.')
        await updateExpense(editing.id, {
          description: values.description,
          amount: values.amount,
          date: values.date.format('YYYY-MM-DD'),
          category: values.category,
        })
        message.success('Expense updated in Tricount.')
      } else {
        await createExpense({
          description: values.description,
          amount: values.amount,
          date: values.date.format('YYYY-MM-DD'),
          category: values.category,
          payer_uuid: values.payer_uuid,
          split_member_uuids: values.split_member_uuids,
        })
        message.success('Expense added to Tricount.')
      }
      setModalOpen(false)
      await onMutated()
      setRetryToken((n) => n + 1)
    } catch (err) {
      if ((err as { errorFields?: unknown }).errorFields) return
      message.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (expense: Expense) => {
    if (!expense.id || deletingId !== null) return
    setDeletingId(expense.id)
    try {
      await deleteExpense(expense.id)
      message.success('Expense deleted from Tricount.')
      await onMutated()
      setRetryToken((n) => n + 1)
    } catch (err) {
      message.error(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setCategory(undefined)
    setMember(undefined)
    setDateRange(null)
  }

  const hasFilters = Boolean(search || category || member || dateRange)

  return (
    <>
    <Card title="All expenses" className="dashboard-card" extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Expense</Button>}>
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
          options={members.map((m) => ({ value: m.name, label: m.name }))}
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
        scroll={{ x: 850 }}
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
      <Modal
        title={editing ? 'Edit expense' : 'Add expense'}
        open={modalOpen}
        onCancel={() => { if (!saving) setModalOpen(false) }}
        onOk={handleSubmit}
        okText={editing ? 'Save changes' : 'Add expense'}
        confirmLoading={saving}
        okButtonProps={{ disabled: saving }}
        cancelButtonProps={{ disabled: saving }}
      >
        {editing && <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Payer and split allocations are preserved and cannot be edited." />}
        <Form form={form} layout="vertical">
          <Form.Item name="description" label="Description" rules={[{ required: true, whitespace: true, message: 'Enter a description.' }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Enter an amount.' }, { type: 'number', min: 0.01, message: 'Amount must be greater than zero.' }]}>
            <InputNumber min={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Choose a date.' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Choose a category.' }]}>
            <Select options={[...new Set([...categories, 'TRAVEL','ENTERTAINMENT','GROCERIES','HEALTHCARE','INSURANCE','RENT_AND_UTILITIES','FOOD_AND_DRINK','SHOPPING','TRANSPORT','OTHER'])].map(c => ({ value: c, label: getCategoryLabel(c) }))} />
          </Form.Item>
          {!editing && <>
            <Form.Item name="payer_uuid" label="Paid by" rules={[{ required: true, message: 'Select who paid.' }]}>
              <Select placeholder="Select payer" options={members.map(m => ({ value: m.uuid, label: m.name }))} />
            </Form.Item>
            <Form.Item name="split_member_uuids" label="Split between (equal)" rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one member.' }]}>
              <Select mode="multiple" placeholder="Select members" options={members.map(m => ({ value: m.uuid, label: m.name }))} />
            </Form.Item>
          </>}
        </Form>
      </Modal>
    </>
  )
}
