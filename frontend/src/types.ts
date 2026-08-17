export interface Member {
  id?: number | null
  uuid: string
  name: string
  status: string
}

export interface TricountInfo {
  title: string
  description: string
  currency: string
  members: Member[]
}

export interface Expense {
  id?: number | null
  uuid: string
  description: string
  amount: number
  currency: string
  payer: string
  date: string
  type: string
  category: string | null
}

export interface ExpenseList {
  items: Expense[]
  total: number
}

export interface ExpenseFilters {
  search?: string
  category?: string
  member?: string
  start_date?: string
  end_date?: string
}

export interface HighestExpense {
  description: string
  amount: number
}

export interface CategorySpending {
  category: string
  amount: number
  count: number
}

export interface DailySpending {
  date: string
  amount: number
}

export interface MemberSpending {
  member: string
  amount: number
}

export interface Dashboard {
  total_expenses: number
  expense_count: number
  average_daily: number
  highest_expense: HighestExpense | null
  categories: CategorySpending[]
  daily_spending: DailySpending[]
  member_spending: MemberSpending[]
}

export interface Balance {
  member: string
  uuid: string
  amount: number
  status: 'owed' | 'owes' | 'settled'
}

export interface Balances {
  currency: string
  balances: Balance[]
}
