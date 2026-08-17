// Display labels for tricount-api's standard Category enum values.
// Falls back to the raw category string for custom categories.
export const CATEGORY_LABELS: Record<string, string> = {
  TRAVEL: '🛏️ Accommodation',
  ENTERTAINMENT: '🎤 Entertainment',
  GROCERIES: '🛒 Groceries',
  HEALTHCARE: '🦷 Healthcare',
  INSURANCE: '🧯 Insurance',
  RENT_AND_UTILITIES: '🏠 Rent & Utilities',
  FOOD_AND_DRINK: '🍔 Restaurants',
  SHOPPING: '🛍️ Shopping',
  TRANSPORT: '🚕 Transport',
  OTHER: '✋ Other',
}

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
