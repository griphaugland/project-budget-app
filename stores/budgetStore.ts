import { create } from 'zustand';
import { MonthlyBudgetState, Category, CategoryBudget, Budget } from '@/types/database';
import { computeTestBudgetState } from '@/data/testData';
import { TEST_BUDGET, TEST_CATEGORY_BUDGETS } from '@/data/testData';
import { DEFAULT_CATEGORIES } from '@/constants/categories';

interface BudgetStore {
  // Data
  budget: Budget;
  categories: Category[];
  categoryBudgets: CategoryBudget[];
  monthlyState: MonthlyBudgetState;
  isLoading: boolean;

  // Actions
  loadBudget: () => void;
  updateCategoryBudget: (categoryId: string, amount: number) => void;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  budget: TEST_BUDGET,
  categories: DEFAULT_CATEGORIES,
  categoryBudgets: TEST_CATEGORY_BUDGETS,
  monthlyState: computeTestBudgetState(),
  isLoading: false,

  loadBudget: () => {
    set({ isLoading: true });
    // In production: fetch from Supabase
    // For now, compute from test data
    const state = computeTestBudgetState();
    set({ monthlyState: state, isLoading: false });
  },

  updateCategoryBudget: (categoryId: string, amount: number) => {
    const { categoryBudgets } = get();
    const updated = categoryBudgets.map((cb) =>
      cb.category_id === categoryId ? { ...cb, allocated_amount: amount } : cb
    );
    set({ categoryBudgets: updated });
    // Recompute monthly state
    const state = computeTestBudgetState();
    set({ monthlyState: state });
  },
}));
