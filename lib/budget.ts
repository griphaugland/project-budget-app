import { Category, CategoryBudget, Transaction, EnvelopeStatus, MonthlyBudgetState, WeeklyBudgetState, ExpectedPayment } from '@/types/database';

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekDay(date: Date): number {
  // Monday=1 ... Sunday=7
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export function computeBudgetState(
  categories: Category[],
  categoryBudgets: CategoryBudget[],
  transactions: Transaction[],
  totalIncome: number,
  expectedPayments: ExpectedPayment[] = [],
): MonthlyBudgetState {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());
  const daysRemaining = Math.max(daysInMonth - dayOfMonth, 1);
  const weekDay = getWeekDay(now);
  const daysRemainingInWeek = Math.max(7 - weekDay, 1);
  const weeksRemaining = Math.max(Math.ceil(daysRemaining / 7), 1);

  const monthKey = getCurrentMonthKey();

  // Filter transactions to current month expenses only
  const monthPrefix = monthKey.substring(0, 7); // "2026-03"
  const monthTransactions = transactions.filter(
    (t) => t.transaction_date.startsWith(monthPrefix) && t.amount < 0
  );

  // Compute envelope status per category
  const envelopes: EnvelopeStatus[] = categories.map((cat) => {
    const budget = categoryBudgets.find((cb) => cb.category_id === cat.id);
    const allocated = budget?.allocated_amount ?? 0;
    const spent = Math.abs(
      monthTransactions
        .filter((t) => t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    // Include pending expected payments in "effective spent"
    const pendingExpected = expectedPayments
      .filter((ep) => ep.category_id === cat.id && ep.status === 'pending')
      .reduce((sum, ep) => sum + ep.amount, 0);

    const effectiveSpent = spent + pendingExpected;
    const remaining = allocated - effectiveSpent;
    const percentUsed = allocated > 0 ? (effectiveSpent / allocated) * 100 : 0;

    return { category: cat, allocated, spent: effectiveSpent, remaining, percentUsed };
  });

  const pocketMoneyEnvelope = envelopes.find((e) => e.category.type === 'discretionary');
  const pocketMoneyBudget = pocketMoneyEnvelope?.allocated ?? 0;
  const pocketMoneySpent = pocketMoneyEnvelope?.spent ?? 0;
  const pocketMoneyRemaining = pocketMoneyEnvelope?.remaining ?? 0;

  const weeklyPocketMoney = weeksRemaining > 0
    ? pocketMoneyRemaining / weeksRemaining
    : pocketMoneyRemaining;
  const dailyPocketMoney = daysRemaining > 0
    ? pocketMoneyRemaining / daysRemaining
    : pocketMoneyRemaining;

  const totalFixedCosts = envelopes
    .filter((e) => e.category.type === 'fixed')
    .reduce((sum, e) => sum + e.allocated, 0);

  const totalVariableSpent = envelopes
    .filter((e) => e.category.type === 'variable')
    .reduce((sum, e) => sum + e.spent, 0);

  // Weekly pocket money tracking — only pocket money spent this week
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - weekDay + 1);
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  const weekPocketMoneySpent = Math.abs(
    monthTransactions
      .filter(
        (t) =>
          t.category_id === pocketMoneyEnvelope?.category.id &&
          t.transaction_date >= startOfWeekStr
      )
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const weekly: WeeklyBudgetState = {
    weeklyPocketMoney,
    dailyPocketMoney,
    pocketMoneyRemaining,
    daysRemainingInWeek,
    weeksRemainingInMonth: weeksRemaining,
    percentUsedThisWeek: weeklyPocketMoney > 0
      ? (weekPocketMoneySpent / weeklyPocketMoney) * 100
      : 0,
  };

  return {
    month: monthKey,
    totalIncome,
    totalFixedCosts,
    totalVariableSpent,
    pocketMoneyBudget,
    pocketMoneySpent,
    pocketMoneyRemaining,
    envelopes,
    weekly,
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
