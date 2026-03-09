import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { useBudgetStore } from '@/stores/budgetStore';
import { useAuthStore } from '@/stores/authStore';
import { formatNOK } from '@/lib/format';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setOnboarded } = useAuthStore();
  const { budget, updateCategoryBudget } = useBudgetStore();

  const [allocations, setAllocations] = useState<Record<string, string>>(
    Object.fromEntries(DEFAULT_CATEGORIES.map((cat) => [cat.id, '']))
  );

  const totalAllocated = Object.values(allocations).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );
  const remaining = budget.total_income - totalAllocated;

  function handleFinish() {
    for (const [catId, value] of Object.entries(allocations)) {
      const num = parseFloat(value) || 0;
      updateCategoryBudget(catId, num);
    }
    setOnboarded(true);
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.step}>Steg 2 av 2</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.title}>Fordel budsjettet</Text>
      <Text style={styles.description}>
        Fordel inntekten din ({formatNOK(budget.total_income)}) til konvolutter.
        Du kan justere dette senere.
      </Text>

      <View style={styles.remainingBanner}>
        <Text style={styles.remainingLabel}>Gjenstående å fordele</Text>
        <Text style={[styles.remainingAmount, remaining < 0 && styles.overBudget]}>
          {formatNOK(remaining)}
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {DEFAULT_CATEGORIES.map((cat) => (
          <View key={cat.id} style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <View>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryType}>{cat.type}</Text>
              </View>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={allocations[cat.id]}
                onChangeText={(v) => setAllocations({ ...allocations, [cat.id]: v })}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.gray600}
              />
              <Text style={styles.krSuffix}>kr</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable style={styles.button} onPress={handleFinish}>
        <Text style={styles.buttonText}>Ferdig — start budsjett!</Text>
        <Ionicons name="checkmark" size={20} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.surfaceDark, paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  step: { fontSize: FontSize.sm, color: Colors.gray400, fontWeight: '500' },
  title: {
    fontSize: FontSize.xxl, fontWeight: '700', color: Colors.white, textAlign: 'center',
  },
  description: {
    fontSize: FontSize.md, color: Colors.gray400,
    textAlign: 'center', lineHeight: 24,
    marginTop: Spacing.sm, marginBottom: Spacing.md,
  },
  remainingBanner: {
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md,
    padding: Spacing.md, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  remainingLabel: { fontSize: FontSize.md, color: Colors.gray400 },
  remainingAmount: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.accent },
  overBudget: { color: Colors.red },
  list: { flex: 1 },
  listContent: { gap: Spacing.sm },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight, padding: Spacing.md, borderRadius: BorderRadius.md,
  },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dot: { width: 16, height: 16, borderRadius: 8 },
  categoryName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
  categoryType: { fontSize: FontSize.xs, color: Colors.gray400, textTransform: 'capitalize' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    fontSize: FontSize.lg, fontWeight: '600', color: Colors.white,
    textAlign: 'right', minWidth: 80,
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary + '60', borderRadius: BorderRadius.sm,
  },
  krSuffix: { fontSize: FontSize.sm, color: Colors.gray400 },
  button: {
    flexDirection: 'row', backgroundColor: Colors.accent,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg, alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.md,
  },
  buttonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
});
