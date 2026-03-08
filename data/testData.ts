import { Transaction, Budget, CategoryBudget, BankConnection, MonthlyBudgetState, EnvelopeStatus } from '@/types/database';
import { DEFAULT_CATEGORIES } from '@/constants/categories';

// ─── Test User ───────────────────────────────────────────────

export const TEST_USER = {
  id: 'test-user',
  email: 'eirik@example.com',
  push_token: null,
  last_synced_at: '2026-03-08T06:00:00Z',
  created_at: '2026-01-15T10:00:00Z',
};

// ─── Bank Connection ─────────────────────────────────────────

export const TEST_BANK_CONNECTION: BankConnection = {
  id: 'bc-1',
  user_id: 'test-user',
  aggregator_ref: 'neo-ref-123',
  bank_name: 'SpareBank 1 SR-Bank',
  account_iban: 'NO93 8601 1117 947',
  connected_at: '2026-01-15T10:30:00Z',
  consent_expires: '2026-04-15T10:30:00Z',
};

// ─── Current Month Budget ────────────────────────────────────

export const TEST_BUDGET: Budget = {
  id: 'budget-march-2026',
  user_id: 'test-user',
  month: '2026-03-01',
  total_income: 42000,
  total_fixed_costs: 18500,
};

export const TEST_CATEGORY_BUDGETS: CategoryBudget[] = [
  { id: 'cb-1', budget_id: 'budget-march-2026', category_id: 'cat-essentials', allocated_amount: 12500 },
  { id: 'cb-2', budget_id: 'budget-march-2026', category_id: 'cat-groceries', allocated_amount: 5000 },
  { id: 'cb-3', budget_id: 'budget-march-2026', category_id: 'cat-transport', allocated_amount: 2500 },
  { id: 'cb-4', budget_id: 'budget-march-2026', category_id: 'cat-food-drink', allocated_amount: 3000 },
  { id: 'cb-5', budget_id: 'budget-march-2026', category_id: 'cat-subscriptions', allocated_amount: 1500 },
  { id: 'cb-6', budget_id: 'budget-march-2026', category_id: 'cat-pocket-money', allocated_amount: 4000 },
];

// ─── Transactions (March 2026) ───────────────────────────────

export const TEST_TRANSACTIONS: Transaction[] = [
  // Week 1 (Mar 1-7)
  {
    id: 'tx-001', user_id: 'test-user', external_id: 'ext-001',
    amount: -12500, merchant_name: 'Utleier AS', raw_description: 'HUSLEIE MARS 2026',
    category_id: 'cat-essentials', is_recurring: true, ai_confidence: 0.99,
    manually_edited: false, transaction_date: '2026-03-01', synced_at: '2026-03-01T06:00:00Z',
  },
  {
    id: 'tx-002', user_id: 'test-user', external_id: 'ext-002',
    amount: -599, merchant_name: 'Telenor', raw_description: 'TELENOR MOBILABONNEMENT',
    category_id: 'cat-essentials', is_recurring: true, ai_confidence: 0.95,
    manually_edited: false, transaction_date: '2026-03-01', synced_at: '2026-03-01T06:00:00Z',
  },
  {
    id: 'tx-003', user_id: 'test-user', external_id: 'ext-003',
    amount: -342, merchant_name: 'REMA 1000 Marken', raw_description: 'REMA 1000 MARKEN BERGEN',
    category_id: 'cat-groceries', is_recurring: false, ai_confidence: 0.97,
    manually_edited: false, transaction_date: '2026-03-02', synced_at: '2026-03-02T06:00:00Z',
  },
  {
    id: 'tx-004', user_id: 'test-user', external_id: 'ext-004',
    amount: -89, merchant_name: 'Skyss', raw_description: 'SKYSS PERIODEBILLETT',
    category_id: 'cat-transport', is_recurring: true, ai_confidence: 0.92,
    manually_edited: false, transaction_date: '2026-03-02', synced_at: '2026-03-02T06:00:00Z',
  },
  {
    id: 'tx-005', user_id: 'test-user', external_id: 'ext-005',
    amount: -189, merchant_name: 'Espresso House', raw_description: 'ESPRESSO HOUSE TORGALLMENNINGEN',
    category_id: 'cat-food-drink', is_recurring: false, ai_confidence: 0.94,
    manually_edited: false, transaction_date: '2026-03-03', synced_at: '2026-03-03T06:00:00Z',
  },
  {
    id: 'tx-006', user_id: 'test-user', external_id: 'ext-006',
    amount: -159, merchant_name: 'Spotify', raw_description: 'SPOTIFY PREMIUM',
    category_id: 'cat-subscriptions', is_recurring: true, ai_confidence: 0.99,
    manually_edited: false, transaction_date: '2026-03-03', synced_at: '2026-03-03T06:00:00Z',
  },
  {
    id: 'tx-007', user_id: 'test-user', external_id: 'ext-007',
    amount: -267, merchant_name: 'Meny Lagunen', raw_description: 'MENY LAGUNEN BERGEN',
    category_id: 'cat-groceries', is_recurring: false, ai_confidence: 0.96,
    manually_edited: false, transaction_date: '2026-03-04', synced_at: '2026-03-04T06:00:00Z',
  },
  {
    id: 'tx-008', user_id: 'test-user', external_id: 'ext-008',
    amount: -450, merchant_name: 'Bergen Kino', raw_description: 'BERGEN KINO MAGNUS BARFOT',
    category_id: 'cat-pocket-money', is_recurring: false, ai_confidence: 0.88,
    manually_edited: false, transaction_date: '2026-03-05', synced_at: '2026-03-05T06:00:00Z',
  },
  {
    id: 'tx-009', user_id: 'test-user', external_id: 'ext-009',
    amount: -129, merchant_name: 'Netflix', raw_description: 'NETFLIX.COM',
    category_id: 'cat-subscriptions', is_recurring: true, ai_confidence: 0.99,
    manually_edited: false, transaction_date: '2026-03-05', synced_at: '2026-03-05T06:00:00Z',
  },
  {
    id: 'tx-010', user_id: 'test-user', external_id: 'ext-010',
    amount: -523, merchant_name: 'Pizzabakeren', raw_description: 'PIZZABAKEREN BERGEN SENTRUM',
    category_id: 'cat-food-drink', is_recurring: false, ai_confidence: 0.91,
    manually_edited: false, transaction_date: '2026-03-06', synced_at: '2026-03-06T06:00:00Z',
  },
  {
    id: 'tx-011', user_id: 'test-user', external_id: 'ext-011',
    amount: -198, merchant_name: 'Kiwi Nygård', raw_description: 'KIWI NYGARD BERGEN',
    category_id: 'cat-groceries', is_recurring: false, ai_confidence: 0.96,
    manually_edited: false, transaction_date: '2026-03-07', synced_at: '2026-03-07T06:00:00Z',
  },
  {
    id: 'tx-012', user_id: 'test-user', external_id: 'ext-012',
    amount: -349, merchant_name: 'Clas Ohlson', raw_description: 'CLAS OHLSON GALLERIET BERGEN',
    category_id: 'cat-pocket-money', is_recurring: false, ai_confidence: 0.85,
    manually_edited: false, transaction_date: '2026-03-07', synced_at: '2026-03-07T06:00:00Z',
  },
  // Week 2 (Mar 8 - today)
  {
    id: 'tx-013', user_id: 'test-user', external_id: 'ext-013',
    amount: -412, merchant_name: 'REMA 1000 Åsane', raw_description: 'REMA 1000 ASANE BERGEN',
    category_id: 'cat-groceries', is_recurring: false, ai_confidence: 0.97,
    manually_edited: false, transaction_date: '2026-03-08', synced_at: '2026-03-08T06:00:00Z',
  },
  {
    id: 'tx-014', user_id: 'test-user', external_id: 'ext-014',
    amount: -75, merchant_name: 'Circle K', raw_description: 'CIRCLE K BERGEN SENTRUM',
    category_id: 'cat-transport', is_recurring: false, ai_confidence: 0.83,
    manually_edited: true, transaction_date: '2026-03-08', synced_at: '2026-03-08T06:00:00Z',
  },
  // Income
  {
    id: 'tx-100', user_id: 'test-user', external_id: 'ext-100',
    amount: 42000, merchant_name: 'Arbeidsgiver AS', raw_description: 'LØNN MARS 2026',
    category_id: 'cat-essentials', is_recurring: true, ai_confidence: 0.99,
    manually_edited: false, transaction_date: '2026-03-01', synced_at: '2026-03-01T06:00:00Z',
  },
];

// ─── Computed Budget State ───────────────────────────────────

export function computeTestBudgetState(): MonthlyBudgetState {
  const categories = DEFAULT_CATEGORIES;
  const transactions = TEST_TRANSACTIONS;
  const categoryBudgets = TEST_CATEGORY_BUDGETS;

  const envelopes: EnvelopeStatus[] = categories.map((cat) => {
    const budget = categoryBudgets.find((cb) => cb.category_id === cat.id);
    const allocated = budget?.allocated_amount ?? 0;
    const spent = Math.abs(
      transactions
        .filter((t) => t.category_id === cat.id && t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );
    const remaining = allocated - spent;
    const percentUsed = allocated > 0 ? (spent / allocated) * 100 : 0;

    return { category: cat, allocated, spent, remaining, percentUsed };
  });

  const pocketMoneyEnvelope = envelopes.find((e) => e.category.id === 'cat-pocket-money')!;
  const pocketMoneyBudget = pocketMoneyEnvelope.allocated;
  const pocketMoneySpent = pocketMoneyEnvelope.spent;
  const pocketMoneyRemaining = pocketMoneyEnvelope.remaining;

  // Calculate weekly/daily amounts
  // March 2026: 31 days, currently day 8
  const dayOfMonth = 8;
  const daysInMonth = 31;
  const daysRemaining = daysInMonth - dayOfMonth;
  const currentWeekDay = 7; // Sunday = 7 (Mar 8 is a Sunday)
  const daysRemainingInWeek = 7 - currentWeekDay; // 0 left today
  const weeksRemaining = Math.ceil(daysRemaining / 7);

  const weeklyPocketMoney = weeksRemaining > 0
    ? pocketMoneyRemaining / weeksRemaining
    : pocketMoneyRemaining;
  const dailyPocketMoney = daysRemaining > 0
    ? pocketMoneyRemaining / daysRemaining
    : pocketMoneyRemaining;

  const totalVariableSpent = envelopes
    .filter((e) => e.category.type === 'variable')
    .reduce((sum, e) => sum + e.spent, 0);

  return {
    month: '2026-03-01',
    totalIncome: TEST_BUDGET.total_income,
    totalFixedCosts: TEST_BUDGET.total_fixed_costs,
    totalVariableSpent,
    pocketMoneyBudget,
    pocketMoneySpent,
    pocketMoneyRemaining,
    envelopes,
    weekly: {
      weeklyPocketMoney,
      dailyPocketMoney,
      pocketMoneyRemaining,
      daysRemainingInWeek: Math.max(daysRemainingInWeek, 1),
      weeksRemainingInMonth: weeksRemaining,
      percentUsedThisWeek: (pocketMoneySpent / pocketMoneyBudget) * 100,
    },
  };
}

// Helper to get visual state based on remaining percentage
export function getVisualState(remaining: number, total: number): 'green' | 'yellow' | 'red' {
  const percent = total > 0 ? (remaining / total) * 100 : 0;
  if (percent > 50) return 'green';
  if (percent > 25) return 'yellow';
  return 'red';
}
