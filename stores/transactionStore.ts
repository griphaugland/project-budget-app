import { create } from 'zustand';
import { Transaction } from '@/types/database';
import { saveData, loadData, KEYS } from '@/lib/storage';
import { generateId } from '@/lib/budget';

type FilterCategory = string | null;
type SortOrder = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Filters
  filterCategory: FilterCategory;
  searchQuery: string;
  sortOrder: SortOrder;

  // Actions
  loadTransactions: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'external_id' | 'synced_at'>) => void;
  addTransactions: (txs: Omit<Transaction, 'id' | 'user_id' | 'external_id' | 'synced_at'>[]) => void;
  deleteTransaction: (id: string) => void;
  syncTransactions: () => Promise<void>;
  setFilterCategory: (categoryId: FilterCategory) => void;
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: SortOrder) => void;
  updateTransactionCategory: (transactionId: string, categoryId: string) => void;

  // Computed
  filteredTransactions: () => Transaction[];
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  isSyncing: false,
  lastSyncedAt: null,

  filterCategory: null,
  searchQuery: '',
  sortOrder: 'newest',

  loadTransactions: async () => {
    set({ isLoading: true });
    const saved = await loadData<Transaction[]>(KEYS.TRANSACTIONS);
    set({ transactions: saved ?? [], isLoading: false });
  },

  addTransaction: (txData) => {
    const id = generateId();
    const tx: Transaction = {
      ...txData,
      id: `tx-${id}`,
      user_id: 'local-user',
      external_id: `manual-${id}`,
      synced_at: new Date().toISOString(),
    };
    const updated = [tx, ...get().transactions];
    set({ transactions: updated });
    saveData(KEYS.TRANSACTIONS, updated);
  },

  addTransactions: (txsData) => {
    const newTxs = txsData.map((txData) => {
      const id = generateId();
      return {
        ...txData,
        id: `tx-${id}`,
        user_id: 'local-user',
        external_id: `import-${id}`,
        synced_at: new Date().toISOString(),
      } as Transaction;
    });
    const updated = [...newTxs, ...get().transactions];
    set({ transactions: updated });
    saveData(KEYS.TRANSACTIONS, updated);
  },

  deleteTransaction: (id) => {
    const updated = get().transactions.filter((t) => t.id !== id);
    set({ transactions: updated });
    saveData(KEYS.TRANSACTIONS, updated);
  },

  syncTransactions: async () => {
    const { lastSyncedAt } = get();
    if (lastSyncedAt) {
      const lastSync = new Date(lastSyncedAt).getTime();
      if (Date.now() - lastSync < 15 * 60 * 1000) return;
    }
    set({ isSyncing: true });
    // In production: POST /bank/sync via Supabase Edge Function
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
  },

  setFilterCategory: (categoryId) => set({ filterCategory: categoryId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortOrder: (order) => set({ sortOrder: order }),

  updateTransactionCategory: (transactionId, categoryId) => {
    const { transactions } = get();
    const updated = transactions.map((t) =>
      t.id === transactionId
        ? { ...t, category_id: categoryId, manually_edited: true }
        : t
    );
    set({ transactions: updated });
    saveData(KEYS.TRANSACTIONS, updated);
  },

  filteredTransactions: () => {
    const { transactions, filterCategory, searchQuery, sortOrder } = get();
    let filtered = [...transactions];

    if (filterCategory) {
      filtered = filtered.filter((t) => t.category_id === filterCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.merchant_name.toLowerCase().includes(q) ||
          t.raw_description.toLowerCase().includes(q)
      );
    }

    switch (sortOrder) {
      case 'newest':
        filtered.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
        break;
      case 'oldest':
        filtered.sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
        break;
      case 'amount_high':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      case 'amount_low':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
    }

    return filtered;
  },
}));
