import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useTransactionStore } from '@/stores/transactionStore';

export default function RootLayout() {
  const { loadOnboardingState } = useAuthStore();
  const { loadBudget, recompute } = useBudgetStore();
  const { loadTransactions, transactions } = useTransactionStore();

  useEffect(() => {
    async function init() {
      await loadOnboardingState();
      await Promise.all([loadBudget(), loadTransactions()]);
    }
    init();
  }, []);

  // Recompute budget whenever transactions change
  useEffect(() => {
    recompute(transactions);
  }, [transactions]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="onboarding"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="transaction/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Transaksjon',
            headerBackTitle: 'Tilbake',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="add-transaction"
          options={{
            headerShown: true,
            headerTitle: 'Legg til transaksjon',
            headerBackTitle: 'Tilbake',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="import-csv"
          options={{
            headerShown: true,
            headerTitle: 'Importer CSV',
            headerBackTitle: 'Tilbake',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="add-expected-payment"
          options={{
            headerShown: true,
            headerTitle: 'Forventet betaling',
            headerBackTitle: 'Tilbake',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="edit-budgets"
          options={{
            headerShown: true,
            headerTitle: 'Fordel budsjett',
            headerBackTitle: 'Tilbake',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
