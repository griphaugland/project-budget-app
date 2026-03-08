import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BudgetRing } from '@/components/BudgetRing';
import { SummaryCard } from '@/components/SummaryCard';
import { TransactionRow } from '@/components/TransactionRow';
import { useBudgetStore } from '@/stores/budgetStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { formatNOK, formatDateNO, formatTimeAgo } from '@/lib/format';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { monthlyState } = useBudgetStore();
  const { transactions, isSyncing, lastSyncedAt, syncTransactions } = useTransactionStore();

  const { weekly, pocketMoneyRemaining, pocketMoneyBudget } = monthlyState;

  // Get recent transactions (last 5 expenses)
  const recentTransactions = [...transactions]
    .filter((t) => t.amount < 0)
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 5);

  // Compute week and month summary
  const weekSpent = monthlyState.envelopes
    .filter((e) => e.category.type !== 'fixed')
    .reduce((sum, e) => sum + e.spent, 0);
  const weekTarget = monthlyState.envelopes
    .filter((e) => e.category.type !== 'fixed')
    .reduce((sum, e) => sum + e.allocated, 0);

  const getCategoryForTransaction = (categoryId: string) =>
    DEFAULT_CATEGORIES.find((c) => c.id === categoryId);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      refreshControl={
        <RefreshControl refreshing={isSyncing} onRefresh={syncTransactions} />
      }
    >
      {/* Sync status */}
      {lastSyncedAt && (
        <Text style={styles.syncStatus}>
          Sist oppdatert: {formatTimeAgo(lastSyncedAt)}
        </Text>
      )}

      {/* Hero: Pocket Money Ring */}
      <View style={styles.heroSection}>
        <BudgetRing
          remaining={pocketMoneyRemaining}
          total={pocketMoneyBudget}
        />
        <Text style={styles.dailyAllowance}>
          {formatNOK(weekly.dailyPocketMoney)} per dag de neste {weekly.daysRemainingInWeek} dagene
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <SummaryCard
          title="Denne uken"
          spent={weekSpent}
          target={weekTarget}
          compact
        />
        <SummaryCard
          title="Denne m\u00e5neden"
          spent={monthlyState.totalVariableSpent + monthlyState.pocketMoneySpent}
          target={monthlyState.totalIncome - monthlyState.totalFixedCosts}
          compact
        />
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Siste transaksjoner</Text>
          <Text
            style={styles.seeAll}
            onPress={() => router.push('/transactions')}
          >
            Se alle
          </Text>
        </View>
        <View style={styles.transactionList}>
          {recentTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              category={getCategoryForTransaction(tx.category_id)}
              onPress={() => router.push(`/transaction/${tx.id}`)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.md,
  },
  syncStatus: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textAlign: 'center',
    paddingTop: Spacing.sm,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  dailyAllowance: {
    fontSize: FontSize.md,
    color: Colors.gray500,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.gray900,
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.accent,
  },
  transactionList: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
});
