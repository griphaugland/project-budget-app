import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTransactionStore } from '@/stores/transactionStore';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { addTransaction } = useTransactionStore();

  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('cat-pocket-money');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isIncome, setIsIncome] = useState(false);

  const canSave = merchant.trim().length > 0 && amount.trim().length > 0 && parseFloat(amount) > 0;

  function handleSave() {
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return;

    addTransaction({
      amount: isIncome ? numAmount : -numAmount,
      merchant_name: merchant.trim(),
      raw_description: merchant.trim(),
      category_id: categoryId,
      is_recurring: false,
      ai_confidence: 1.0,
      manually_edited: true,
      transaction_date: date,
    });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Income/Expense toggle */}
        <View style={styles.typeToggle}>
          <Pressable
            style={[styles.typeButton, !isIncome && styles.typeButtonActive]}
            onPress={() => setIsIncome(false)}
          >
            <Ionicons name="arrow-down" size={18} color={!isIncome ? Colors.white : Colors.gray500} />
            <Text style={[styles.typeText, !isIncome && styles.typeTextActive]}>Utgift</Text>
          </Pressable>
          <Pressable
            style={[styles.typeButton, isIncome && styles.typeButtonActiveIncome]}
            onPress={() => setIsIncome(true)}
          >
            <Ionicons name="arrow-up" size={18} color={isIncome ? Colors.white : Colors.gray500} />
            <Text style={[styles.typeText, isIncome && styles.typeTextActive]}>Inntekt</Text>
          </Pressable>
        </View>

        {/* Amount */}
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

        {/* Merchant */}
        <View style={styles.field}>
          <Text style={styles.label}>Butikk / beskrivelse</Text>
          <TextInput
            style={styles.input}
            value={merchant}
            onChangeText={setMerchant}
            placeholder="F.eks. REMA 1000"
            placeholderTextColor={Colors.gray400}
          />
        </View>

        {/* Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Dato (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2026-03-09"
            placeholderTextColor={Colors.gray400}
          />
        </View>

        {/* Category picker */}
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

        {/* Save button */}
        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveButtonText}>Lagre transaksjon</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
  },
  typeButtonActive: {
    backgroundColor: Colors.gray900,
  },
  typeButtonActiveIncome: {
    backgroundColor: Colors.green,
  },
  typeText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.gray500,
  },
  typeTextActive: {
    color: Colors.white,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.gray600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInput: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.gray900,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
  },
  input: {
    fontSize: FontSize.md,
    color: Colors.gray900,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: 6,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryChipText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
