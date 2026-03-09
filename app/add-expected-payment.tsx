import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useBudgetStore } from '@/stores/budgetStore';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function AddExpectedPaymentScreen() {
  const router = useRouter();
  const { addExpectedPayment } = useBudgetStore();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('cat-essentials');
  const [date, setDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const canSave = description.trim().length > 0 && amount.trim().length > 0 && date.trim().length > 0;

  function handleSave() {
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return;

    addExpectedPayment({
      description: description.trim(),
      amount: numAmount,
      category_id: categoryId,
      expected_date: date,
      is_recurring: isRecurring,
      status: 'pending',
      created_by: 'user',
    });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Beskrivelse</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="F.eks. Strømregning"
            placeholderTextColor={Colors.gray400}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Beløp (kr)</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Colors.gray400}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Forventet dato (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2026-03-20"
            placeholderTextColor={Colors.gray400}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Kategori</Text>
          <View style={styles.categoryGrid}>
            {DEFAULT_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryChip,
                  categoryId === cat.id && { backgroundColor: cat.color + '25', borderColor: cat.color },
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                <Text
                  style={[
                    styles.categoryChipText,
                    categoryId === cat.id && { color: cat.color, fontWeight: '600' },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={styles.recurringToggle}
          onPress={() => setIsRecurring(!isRecurring)}
        >
          <View style={[styles.checkbox, isRecurring && styles.checkboxActive]}>
            {isRecurring && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.recurringText}>Gjentar seg månedlig</Text>
        </Pressable>

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveButtonText}>Lagre forventet betaling</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: Spacing.lg },
  field: { gap: Spacing.sm },
  label: {
    fontSize: FontSize.sm, fontWeight: '600', color: Colors.gray600,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    fontSize: FontSize.md, color: Colors.gray900,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
  },
  amountInput: {
    fontSize: 36, fontWeight: '700', color: Colors.gray900,
    textAlign: 'center', paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.gray200, gap: 6,
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryChipText: { fontSize: FontSize.sm, color: Colors.gray600 },
  recurringToggle: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.gray300,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  recurringText: { fontSize: FontSize.md, color: Colors.gray900, fontWeight: '500' },
  saveButton: {
    backgroundColor: Colors.accent, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg, alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
});
