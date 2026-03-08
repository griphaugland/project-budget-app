import { create } from 'zustand';
import { Transaction } from '@/types/database';
import { TEST_TRANSACTIONS } from '@/data/testData';

type FilterCategory = string | null;
type SortOrder = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

interface TransactionStore {
  // Data
  transactions: Transaction[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Filters
  filterCategory: FilterCategory;
  searchQuery: string;
  sortOrder: SortOrder;

  // Actions
  loadTransactions: () => void;
  syncTransactions: () => Promise<void>;
  setFilterCategory: (categoryId: FilterCategory) => void;
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: SortOrder) => void;
  updateTransactionCategory: (transactionId: string, categoryId: string) => void;

  // Computed
  filteredTransactions: () => Transaction[];
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: TEST_TRANSACTIONS,
  isLoading: false,
  isSyncing: false,
  lastSyncedAt: '2026-03-08T06:00:00Z',

  filterCategory: null,
  searchQuery: '',
  sortOrder: 'newest',

  loadTransactions: () => {
    set({ isLoading: true });
    // In production: fetch from Supabase
    set({ transactions: TEST_TRANSACTIONS, isLoading: false });
  },

  syncTransactions: async () => {
    const { lastSyncedAt } = get();
    // 15-minute cooldown check
    if (lastSyncedAt) {
      const lastSync = new Date(lastSyncedAt).getTime();
      const now = Date.now();
      if (now - lastSync < 15 * 60 * 1000) {
        return; // Within cooldown
      }
    }

    set({ isSyncing: true });
    // In production: POST /bank/sync via Supabase Edge Function
    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
  },

  setFilterCategory: (categoryId) => set({ filterCategory: categoryId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortOrder: (order) => set({ sortOrder: order }),

  updateTransactionCategory: (transactionId, categoryId) => {
    const { transactions } = get();
    set({
      transactions: transactions.map((t) =>
        t.id === transactionId
          ? { ...t, category_id: categoryId, manually_edited: true }
          : t
      ),
    });
  },

  filteredTransactions: () => {
    const { transactions, filterCategory, searchQuery, sortOrder } = get();

    let filtered = [...transactions];

    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter((t) => t.category_id === filterCategory);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.merchant_name.toLowerCase().includes(q) ||
          t.raw_description.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortOrder) {
      case 'newest':
        filtered.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
        break;
      case 'oldest':
        filtered.sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
        break;
      case 'amount_high':
        filtered.sort((a, b) => a.amount - b.amount); // Most negative first
        break;
      case 'amount_low':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
    }

    return filtered;
  },
}));
