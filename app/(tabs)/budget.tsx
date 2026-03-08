import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EnvelopeCard } from '@/components/EnvelopeCard';
import { useBudgetStore } from '@/stores/budgetStore';
import { formatNOK, formatDateNO } from '@/lib/format';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

type ViewMode = 'monthly' | 'weekly';

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { monthlyState } = useBudgetStore();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  const {
    totalIncome,
    totalFixedCosts,
    pocketMoneyBudget,
    pocketMoneySpent,
    pocketMoneyRemaining,
    envelopes,
  } = monthlyState;

  const totalAllocated = envelopes.reduce((sum, e) => sum + e.allocated, 0);
  const totalSpent = envelopes.reduce((sum, e) => sum + e.spent, 0);
  const unallocated = totalIncome - totalAllocated;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
    >
      {/* Month header */}
      <View style={styles.monthHeader}>
        <Text style={styles.monthTitle}>Mars 2026</Text>
        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.toggleButton, viewMode === 'monthly' && styles.toggleActive]}
            onPress={() => setViewMode('monthly')}
          >
            <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
              M\u00e5ned
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.gray900,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.sm,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm - 2,
  },
  toggleActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.gray500,
  },
  toggleTextActive: {
    color: Colors.gray900,
  },
  overviewCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: FontSize.md,
    color: Colors.gray500,
  },
  overviewIncome: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.green,
  },
  overviewExpense: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.gray900,
  },
  overviewAvailable: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.accent,
  },
  overviewUnallocated: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.yellow,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray100,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.gray900,
    paddingHorizontal: Spacing.xs,
  },
  envelopeList: {
    gap: Spacing.sm,
  },
});
