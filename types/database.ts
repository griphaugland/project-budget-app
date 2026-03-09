// Database types matching the Budget Guardian architecture document

export type CategoryType = 'fixed' | 'variable' | 'discretionary';

export interface User {
  id: string;
  email: string;
  push_token: string | null;
  last_synced_at: string | null;
  created_at: string;
}

export interface BankConnection {
  id: string;
  user_id: string;
  aggregator_ref: string;
  bank_name: string;
  account_iban: string;
  connected_at: string;
  consent_expires: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  sort_order: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  external_id: string;
  amount: number;
  merchant_name: string;
  raw_description: string;
  category_id: string;
  is_recurring: boolean;
  ai_confidence: number;
  manually_edited: boolean;
  expected_payment_id?: string | null;
  transaction_date: string;
  synced_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: string;
  total_income: number;
  total_fixed_costs: number;
}

export interface CategoryBudget {
  id: string;
  budget_id: string;
  category_id: string;
  allocated_amount: number;
}

export interface MerchantMapping {
  id: string;
  user_id: string;
  merchant_pattern: string;
  category_id: string;
  created_at: string;
}

export interface ExpectedPayment {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category_id: string;
  expected_date: string;
  is_recurring: boolean;
  status: 'pending' | 'fulfilled' | 'overdue' | 'cancelled';
  actual_transaction_id: string | null;
  reconciled_at: string | null;
  created_by: 'user' | 'ai_assistant' | 'system';
  created_at: string;
}

// Computed / display types used in the app

export interface EnvelopeStatus {
  category: Category;
  allocated: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface WeeklyBudgetState {
  weeklyPocketMoney: number;
  dailyPocketMoney: number;
  pocketMoneyRemaining: number;
  daysRemainingInWeek: number;
  weeksRemainingInMonth: number;
  percentUsedThisWeek: number;
}

export interface MonthlyBudgetState {
  month: string;
  totalIncome: number;
  totalFixedCosts: number;
  totalVariableSpent: number;
  pocketMoneyBudget: number;
  pocketMoneySpent: number;
  pocketMoneyRemaining: number;
  envelopes: EnvelopeStatus[];
  weekly: WeeklyBudgetState;
}

export interface HomeScreenData {
  pocketMoneyRemaining: number;
  dailyAllowance: number;
  daysRemaining: number;
  weekSpentVsTarget: { spent: number; target: number };
  monthSpentVsTarget: { spent: number; target: number };
  recentTransactions: Transaction[];
  visualState: 'green' | 'yellow' | 'red';
}

export type NotificationTrigger =
  | 'morning_briefing'
  | 'transaction_alert'
  | 'threshold_25'
  | 'threshold_10'
  | 'weekly_summary'
  | 'new_recurring'
  | 'budget_reset';

export interface NotificationPreferences {
  morning_briefing: boolean;
  transaction_alerts: boolean;
  threshold_warnings: boolean;
  weekly_summary: boolean;
  recurring_detection: boolean;
}
