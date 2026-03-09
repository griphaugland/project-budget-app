import { create } from 'zustand';
import { MonthlyBudgetState, Category, CategoryBudget, Budget, Transaction, ExpectedPayment } from '@/types/database';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { computeBudgetState, getCurrentMonthKey, generateId } from '@/lib/budget';
import { saveData, loadData, KEYS } from '@/lib/storage';

interface BudgetStore {
  budget: Budget;
  categories: Category[];
  categoryBudgets: CategoryBudget[];
  expectedPayments: ExpectedPayment[];
  monthlyState: MonthlyBudgetState;
  isLoading: boolean;

  // Core actions
  loadBudget: () => Promise<void>;
  recompute: (transactions: Transaction[]) => void;

  // Budget management
  setIncome: (income: number) => void;
  updateCategoryBudget: (categoryId: string, amount: number) => void;

  // Expected payments
  addExpectedPayment: (payment: Omit<ExpectedPayment, 'id' | 'user_id' | 'actual_transaction_id' | 'reconciled_at' | 'created_at'>) => void;
  updateExpectedPayment: (id: string, updates: Partial<ExpectedPayment>) => void;
  deleteExpectedPayment: (id: string) => void;
}

const emptyBudget: Budget = {
  id: 'budget-current',
  user_id: 'local-user',
  month: getCurrentMonthKey(),
  total_income: 0,
  total_fixed_costs: 0,
};

const defaultCategoryBudgets: CategoryBudget[] = DEFAULT_CATEGORIES.map((cat) => ({
  id: `cb-${cat.id}`,
  budget_id: 'budget-current',
  category_id: cat.id,
  allocated_amount: 0,
}));

function emptyState(): MonthlyBudgetState {
  return computeBudgetState(DEFAULT_CATEGORIES, defaultCategoryBudgets, [], 0, []);
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  budget: emptyBudget,
  categories: DEFAULT_CATEGORIES,
  categoryBudgets: defaultCategoryBudgets,
  expectedPayments: [],
  monthlyState: emptyState(),
  isLoading: false,

  loadBudget: async () => {
    set({ isLoading: true });
    const [savedBudgets, savedExpected] = await Promise.all([
      loadData<CategoryBudget[]>(KEYS.CATEGORY_BUDGETS),
      loadData<ExpectedPayment[]>(KEYS.EXPECTED_PAYMENTS),
    ]);
    const savedIncome = await loadData<number>(KEYS.INCOME);

    const income = savedIncome ?? 0;
    const categoryBudgets = savedBudgets ?? defaultCategoryBudgets;
    const expectedPayments = savedExpected ?? [];

    const budget: Budget = {
      ...emptyBudget,
      total_income: income,
    };

    set({ budget, categoryBudgets, expectedPayments, isLoading: false });
  },

  recompute: (transactions: Transaction[]) => {
    const { categories, categoryBudgets, budget, expectedPayments } = get();
    const state = computeBudgetState(categories, categoryBudgets, transactions, budget.total_income, expectedPayments);
    set({ monthlyState: state });
  },

  setIncome: (income: number) => {
    const budget = { ...get().budget, total_income: income };
    set({ budget });
    saveData(KEYS.INCOME, income);
  },

  updateCategoryBudget: (categoryId: string, amount: number) => {
    const { categoryBudgets } = get();
    const updated = categoryBudgets.map((cb) =>
      cb.category_id === categoryId ? { ...cb, allocated_amount: amount } : cb
    );
    set({ categoryBudgets: updated });
    saveData(KEYS.CATEGORY_BUDGETS, updated);
  },

  addExpectedPayment: (payment) => {
    const ep: ExpectedPayment = {
      ...payment,
      id: `ep-${generateId()}`,
      user_id: 'local-user',
      actual_transaction_id: null,
      reconciled_at: null,
      created_at: new Date().toISOString(),
    };
    const updated = [...get().expectedPayments, ep];
    set({ expectedPayments: updated });
    saveData(KEYS.EXPECTED_PAYMENTS, updated);
  },

  updateExpectedPayment: (id, updates) => {
    const updated = get().expectedPayments.map((ep) =>
      ep.id === id ? { ...ep, ...updates } : ep
    );
    set({ expectedPayments: updated });
    saveData(KEYS.EXPECTED_PAYMENTS, updated);
  },

  deleteExpectedPayment: (id) => {
    const updated = get().expectedPayments.filter((ep) => ep.id !== id);
    set({ expectedPayments: updated });
    saveData(KEYS.EXPECTED_PAYMENTS, updated);
  },
}));
