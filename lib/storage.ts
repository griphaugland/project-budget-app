import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TRANSACTIONS: 'bg_transactions',
  BUDGET: 'bg_budget',
  CATEGORY_BUDGETS: 'bg_category_budgets',
  EXPECTED_PAYMENTS: 'bg_expected_payments',
  ONBOARDED: 'bg_onboarded',
  INCOME: 'bg_income',
} as const;

export async function saveData<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function loadData<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function clearAll(): Promise<void> {
  const keys = Object.values(KEYS);
  for (const key of keys) {
    await AsyncStorage.removeItem(key);
  }
}

export { KEYS };
