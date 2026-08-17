export interface CategoryMeta {
  label: string
  color: string
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  TRAVEL: {
    label: '🛏️ Accommodation',
    color: '#faad14',
  },
  ENTERTAINMENT: {
    label: '🎤 Entertainment',
    color: '#eb2f96',
  },
  GROCERIES: {
    label: '🛒 Groceries',
    color: '#52c41a',
  },
  HEALTHCARE: {
    label: '🦷 Healthcare',
    color: '#f5222d',
  },
  INSURANCE: {
    label: '🧯 Insurance',
    color: '#c41d7f',
  },
  RENT_AND_UTILITIES: {
    label: '🏠 Rent & Utilities',
    color: '#13c2c2',
  },
  FOOD_AND_DRINK: {
    label: '🍔 Restaurants',
    color: '#fa8c16',
  },
  SHOPPING: {
    label: '🛍️ Shopping',
    color: '#1677ff',
  },
  TRANSPORT: {
    label: '🚕 Transport',
    color: '#722ed1',
  },
  OTHER: {
    label: '✋ Other',
    color: '#8c8c8c',
  },
}

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([key, value]) => [key, value.label])
)

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([key, value]) => [key, value.color])
)

export const CHART_COLORS = [
  '#2f54eb',
  '#13c2c2',
  '#fa8c16',
  '#52c41a',
  '#eb2f96',
  '#722ed1',
  '#faad14',
  '#1677ff',
  '#a0d911',
  '#f5222d',
]

export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return 'Uncategorized'
  return CATEGORY_META[category]?.label ?? category
}

export function getCategoryColor(category: string | null | undefined): string {
  if (!category) return '#8c8c8c'
  return CATEGORY_META[category]?.color ?? '#8c8c8c'
}