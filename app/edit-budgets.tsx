import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useBudgetStore } from '@/stores/budgetStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { formatNOK } from '@/lib/format';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function EditBudgetsScreen() {
  const router = useRouter();
  const { categories, categoryBudgets, budget, updateCategoryBudget, setIncome, recompute } = useBudgetStore();
  const { transactions } = useTransactionStore();

  const [income, setIncomeLocal] = useState(String(budget.total_income));
  const [allocations, setAllocations] = useState<Record<string, string>>(
    Object.fromEntries(categoryBudgets.map((cb) => [cb.category_id, String(cb.allocated_amount)]))
  );

  const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const incomeNum = parseFloat(income) || 0;
  const remaining = incomeNum - totalAllocated;

  function handleSave() {
    if (remaining < 0) {
      Alert.alert('For mye fordelt', `Du har fordelt ${formatNOK(Math.abs(remaining))} mer enn inntekten.`);
      return;
    }

    setIncome(incomeNum);
    for (const [catId, value] of Object.entries(allocations)) {
      updateCategoryBudget(catId, parseFloat(value) || 0);
    }
    recompute(transactions);
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Income */}
      <View style={styles.field}>
        <Text style={styles.label}>Månedlig inntekt (kr)</Text>
        <TextInput
          style={styles.incomeInput}
          value={income}
          onChangeText={setIncomeLocal}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={Colors.gray400}
        />
      </View>

      {/* Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Inntekt</Text>
          <Text style={styles.overviewIncome}>{formatNOK(incomeNum)}</Text>
        </View>
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Fordelt</Text>
          <Text style={styles.overviewValue}>{formatNOK(totalAllocated)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.overviewRow}>
          <Text style={styles.overviewLabel}>Gjenstående</Text>
          <Text style={[styles.overviewRemaining, remaining < 0 && styles.overBudget]}>
            {formatNOK(remaining)}
          </Text>
        </View>
      </View>

      {/* Category allocations */}
      <Text style={styles.sectionTitle}>Konvolutter</Text>
      {categories.map((cat) => (
        <View key={cat.id} style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View style={[styles.dot, { backgroundColor: cat.color }]} />
            <Text style={styles.categoryName}>{cat.name}</Text>
            <Text style={styles.categoryType}>{cat.type}</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.categoryInput}
              value={allocations[cat.id] ?? '0'}
              onChangeText={(v) => setAllocations({ ...allocations, [cat.id]: v })}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.gray400}
            />
            <Text style={styles.krSuffix}>kr</Text>
          </View>
        </View>
      ))}

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Lagre budsjett</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: Spacing.md },
  field: { gap: Spacing.sm },
  label: {
    fontSize: FontSize.sm, fontWeight: '600', color: Colors.gray600,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  incomeInput: {
    fontSize: 36, fontWeight: '700', color: Colors.gray900,
    textAlign: 'center', paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
  },
  overviewCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.sm,
  },
  overviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  overviewLabel: { fontSize: FontSize.md, color: Colors.gray500 },
  overviewIncome: { fontSize: FontSize.md, fontWeight: '700', color: Colors.green },
  overviewValue: { fontSize: FontSize.md, fontWeight: '600', color: Colors.gray900 },
  overviewRemaining: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.accent },
  overBudget: { color: Colors.red },
  divider: { height: 1, backgroundColor: Colors.gray100 },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.gray900,
    marginTop: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  categoryName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.gray900 },
  categoryType: { fontSize: FontSize.xs, color: Colors.gray400, textTransform: 'capitalize' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  categoryInput: {
    fontSize: FontSize.lg, fontWeight: '600', color: Colors.gray900,
    textAlign: 'right', minWidth: 80,
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.gray50, borderRadius: BorderRadius.sm,
  },
  krSuffix: { fontSize: FontSize.sm, color: Colors.gray400 },
  saveButton: {
    backgroundColor: Colors.accent, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg, alignItems: 'center', marginTop: Spacing.md,
  },
  saveButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
});
