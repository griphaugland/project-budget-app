import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EnvelopeCard } from '@/components/EnvelopeCard';
import { useBudgetStore } from '@/stores/budgetStore';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { formatNOK, formatDateNO } from '@/lib/format';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

type ViewMode = 'monthly' | 'weekly';

export default function BudgetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { monthlyState, budget, expectedPayments, deleteExpectedPayment } = useBudgetStore();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  const {
    totalIncome,
    totalFixedCosts,
    envelopes,
  } = monthlyState;

  const totalAllocated = envelopes.reduce((sum, e) => sum + e.allocated, 0);
  const totalSpent = envelopes.reduce((sum, e) => sum + e.spent, 0);
  const unallocated = totalIncome - totalAllocated;
  const hasNoBudget = budget.total_income === 0;

  const pendingPayments = expectedPayments.filter((ep) => ep.status === 'pending');

  const getCategoryName = (catId: string) =>
    DEFAULT_CATEGORIES.find((c) => c.id === catId)?.name ?? 'Ukjent';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
    >
      {/* Month header */}
      <View style={styles.monthHeader}>
        <Text style={styles.monthTitle}>
          {new Date().toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable style={styles.editButton} onPress={() => router.push('/edit-budgets')}>
          <Ionicons name="create-outline" size={18} color={Colors.accent} />
          <Text style={styles.editText}>Rediger</Text>
        </Pressable>
      </View>

      {hasNoBudget ? (
        <View style={styles.emptyCard}>
          <Ionicons name="pie-chart-outline" size={48} color={Colors.gray300} />
          <Text style={styles.emptyTitle}>Ingen budsjett satt opp</Text>
          <Text style={styles.emptySubtext}>
            Sett opp inntekt og fordel til konvolutter for å starte
          </Text>
          <Pressable
            style={styles.setupButton}
            onPress={() => router.push('/edit-budgets')}
          >
            <Text style={styles.setupButtonText}>Sett opp budsjett</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* View toggle */}
          <View style={styles.viewToggle}>
            <Pressable
              style={[styles.toggleButton, viewMode === 'monthly' && styles.toggleActive]}
              onPress={() => setViewMode('monthly')}
            >
              <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
                Måned
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, viewMode === 'weekly' && styles.toggleActive]}
              onPress={() => setViewMode('weekly')}
            >
              <Text style={[styles.toggleText, viewMode === 'weekly' && styles.toggleTextActive]}>
                Uke
              </Text>
            </Pressable>
          </View>

          {/* Income & overview */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Inntekt</Text>
              <Text style={styles.overviewIncome}>{formatNOK(totalIncome)}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Faste utgifter</Text>
              <Text style={styles.overviewExpense}>{formatNOK(totalFixedCosts)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Tilgjengelig</Text>
              <Text style={styles.overviewAvailable}>
                {formatNOK(totalIncome - totalFixedCosts)}
              </Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Brukt totalt</Text>
              <Text style={styles.overviewExpense}>{formatNOK(totalSpent)}</Text>
            </View>
            {unallocated > 0 && (
              <View style={styles.overviewRow}>
                <Text style={styles.overviewLabel}>Ufordelt</Text>
                <Text style={styles.overviewUnallocated}>{formatNOK(unallocated)}</Text>
              </View>
            )}
          </View>

          {/* Envelope list */}
          <Text style={styles.sectionTitle}>Konvolutter</Text>
          <View style={styles.envelopeList}>
            {envelopes.map((envelope) => (
              <EnvelopeCard key={envelope.category.id} envelope={envelope} />
            ))}
          </View>
        </>
      )}

      {/* Expected Payments */}
      <View style={styles.expectedHeader}>
        <Text style={styles.sectionTitle}>Forventede betalinger</Text>
        <Pressable onPress={() => router.push('/add-expected-payment')}>
          <Ionicons name="add-circle" size={24} color={Colors.accent} />
        </Pressable>
      </View>

      {pendingPayments.length === 0 ? (
        <View style={styles.emptySmall}>
          <Text style={styles.emptySmallText}>Ingen forventede betalinger</Text>
        </View>
      ) : (
        <View style={styles.paymentList}>
          {pendingPayments.map((ep) => (
            <View key={ep.id} style={styles.paymentRow}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentDesc}>{ep.description}</Text>
                <Text style={styles.paymentMeta}>
                  {getCategoryName(ep.category_id)} · {formatDateNO(ep.expected_date)}
                  {ep.is_recurring ? ' · Gjentar' : ''}
                </Text>
              </View>
              <Text style={styles.paymentAmount}>{formatNOK(ep.amount)}</Text>
              <Pressable onPress={() => deleteExpectedPayment(ep.id)}>
                <Ionicons name="close-circle" size={20} color={Colors.gray400} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: Spacing.md },
  monthHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  monthTitle: {
    fontSize: FontSize.xl, fontWeight: '700', color: Colors.gray900,
    textTransform: 'capitalize',
  },
  editButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  editText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.accent },
  viewToggle: {
    flexDirection: 'row', backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.sm, padding: 2, alignSelf: 'center',
  },
  toggleButton: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.sm - 2,
  },
  toggleActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
  },
  toggleText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.gray500 },
  toggleTextActive: { color: Colors.gray900 },
  overviewCard: {
    backgroundColor: Colors.cardBackground, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  overviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  overviewLabel: { fontSize: FontSize.md, color: Colors.gray500 },
  overviewIncome: { fontSize: FontSize.md, fontWeight: '700', color: Colors.green },
  overviewExpense: { fontSize: FontSize.md, fontWeight: '600', color: Colors.gray900 },
  overviewAvailable: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.accent },
  overviewUnallocated: { fontSize: FontSize.md, fontWeight: '600', color: Colors.yellow },
  divider: { height: 1, backgroundColor: Colors.gray100 },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.gray900,
    paddingHorizontal: Spacing.xs,
  },
  envelopeList: { gap: Spacing.sm },
  expectedHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.md,
  },
  paymentList: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden',
  },
  paymentRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  paymentInfo: { flex: 1, gap: 2 },
  paymentDesc: { fontSize: FontSize.md, fontWeight: '500', color: Colors.gray900 },
  paymentMeta: { fontSize: FontSize.xs, color: Colors.gray400 },
  paymentAmount: { fontSize: FontSize.md, fontWeight: '600', color: Colors.gray900 },
  emptyCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.gray500 },
  emptySubtext: { fontSize: FontSize.md, color: Colors.gray400, textAlign: 'center' },
  setupButton: {
    backgroundColor: Colors.accent, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md,
  },
  setupButtonText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  emptySmall: { padding: Spacing.md, alignItems: 'center' },
  emptySmallText: { fontSize: FontSize.sm, color: Colors.gray400 },
});
