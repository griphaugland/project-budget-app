import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BudgetRing } from '@/components/BudgetRing';
import { SummaryCard } from '@/components/SummaryCard';
import { TransactionRow } from '@/components/TransactionRow';
import { useBudgetStore } from '@/stores/budgetStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAuthStore } from '@/stores/authStore';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { formatNOK } from '@/lib/format';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isOnboarded } = useAuthStore();
  const { monthlyState, budget } = useBudgetStore();
  const { transactions, isSyncing, syncTransactions } = useTransactionStore();

  useEffect(() => {
    if (!isOnboarded) {
      router.replace('/onboarding');
    }
  }, [isOnboarded]);

  const { weekly, pocketMoneyRemaining, pocketMoneyBudget } = monthlyState;

  const recentTransactions = [...transactions]
    .filter((t) => t.amount < 0)
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 5);

  const variableSpent = monthlyState.envelopes
    .filter((e) => e.category.type !== 'fixed')
    .reduce((sum, e) => sum + e.spent, 0);
  const variableTarget = monthlyState.envelopes
    .filter((e) => e.category.type !== 'fixed')
    .reduce((sum, e) => sum + e.allocated, 0);

  const getCategoryForTransaction = (categoryId: string) =>
    DEFAULT_CATEGORIES.find((c) => c.id === categoryId);

  const hasNoBudget = budget.total_income === 0;
  const hasNoTransactions = transactions.length === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      refreshControl={
        <RefreshControl refreshing={isSyncing} onRefresh={syncTransactions} />
      }
    >
      {hasNoBudget && (
        <Pressable style={styles.setupBanner} onPress={() => router.push('/edit-budgets')}>
          <Ionicons name="build-outline" size={20} color={Colors.white} />
          <Text style={styles.setupBannerText}>Sett opp budsjettet ditt for å komme i gang</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.white} />
        </Pressable>
      )}

      {/* Hero: Pocket Money Ring */}
      <View style={styles.heroSection}>
        <BudgetRing
          remaining={pocketMoneyRemaining}
          total={pocketMoneyBudget}
        />
        {pocketMoneyBudget > 0 && (
          <Text style={styles.dailyAllowance}>
            {formatNOK(weekly.dailyPocketMoney)} per dag de neste {weekly.daysRemainingInWeek} dagene
          </Text>
        )}
      </View>

      {/* Summary Cards */}
      {pocketMoneyBudget > 0 && (
        <View style={styles.summaryRow}>
          <SummaryCard title="Denne uken" spent={variableSpent} target={variableTarget} compact />
          <SummaryCard
            title="Denne måneden"
            spent={monthlyState.totalVariableSpent + monthlyState.pocketMoneySpent}
            target={monthlyState.totalIncome - monthlyState.totalFixedCosts}
            compact
          />
        </View>
      )}

      {/* Quick action buttons */}
      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={() => router.push('/add-transaction')}>
          <Ionicons name="add-circle" size={22} color={Colors.accent} />
          <Text style={styles.actionText}>Legg til</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => router.push('/import-csv')}>
          <Ionicons name="cloud-upload" size={22} color={Colors.accent} />
          <Text style={styles.actionText}>Importer CSV</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => router.push('/edit-budgets')}>
          <Ionicons name="options" size={22} color={Colors.accent} />
          <Text style={styles.actionText}>Budsjett</Text>
        </Pressable>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Siste transaksjoner</Text>
          {transactions.length > 0 && (
            <Text style={styles.seeAll} onPress={() => router.push('/transactions')}>
              Se alle
            </Text>
          )}
        </View>
        {hasNoTransactions ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={36} color={Colors.gray300} />
            <Text style={styles.emptyText}>Ingen transaksjoner ennå</Text>
            <Text style={styles.emptySubtext}>Legg til manuelt eller importer fra CSV</Text>
          </View>
        ) : (
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
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md },
  setupBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.accent, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginTop: Spacing.md,
  },
  setupBannerText: {
    flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.white,
  },
  heroSection: {
    alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md,
  },
  dailyAllowance: {
    fontSize: FontSize.md, color: Colors.gray500, fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  actionText: {
    fontSize: FontSize.xs, fontWeight: '600', color: Colors.gray700,
  },
  section: { gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.xs,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.gray900 },
  seeAll: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.accent },
  transactionList: {
    backgroundColor: Colors.cardBackground, borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  emptyCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
  },
  emptyText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.gray500 },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.gray400, textAlign: 'center' },
});
