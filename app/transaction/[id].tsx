import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBadge } from '@/components/CategoryBadge';
import { useTransactionStore } from '@/stores/transactionStore';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { formatNOK, formatDateNO } from '@/lib/format';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { transactions, updateTransactionCategory, deleteTransaction } = useTransactionStore();
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Transaksjon ikke funnet</Text>
      </View>
    );
  }

  const category = DEFAULT_CATEGORIES.find((c) => c.id === transaction.category_id);

  function handleDelete() {
    Alert.alert('Slett transaksjon', 'Er du sikker?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Slett',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(transaction!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.amountSection}>
        <Text style={[styles.amount, transaction.amount > 0 && styles.income]}>
          {formatNOK(transaction.amount, true)}
        </Text>
        <Text style={styles.merchant}>{transaction.merchant_name}</Text>
        <Text style={styles.date}>{formatDateNO(transaction.transaction_date, true)}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Kategori</Text>
          <Pressable onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
            {category ? (
              <CategoryBadge name={category.name} color={category.color} />
            ) : (
              <Text style={styles.uncategorized}>Ukategorisert</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Beskrivelse</Text>
          <Text style={styles.detailValue} numberOfLines={2}>
            {transaction.raw_description}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Gjentakende</Text>
          <View style={styles.recurringBadge}>
            <Ionicons
              name={transaction.is_recurring ? 'repeat' : 'remove-circle-outline'}
              size={16}
              color={transaction.is_recurring ? Colors.accent : Colors.gray400}
            />
            <Text style={styles.detailValue}>
              {transaction.is_recurring ? 'Ja' : 'Nei'}
            </Text>
          </View>
        </View>
      </View>

      {showCategoryPicker && (
        <View style={styles.card}>
          <Text style={styles.pickerTitle}>Velg kategori</Text>
          {DEFAULT_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.pickerOption,
                cat.id === transaction.category_id && styles.pickerOptionActive,
              ]}
              onPress={() => {
                updateTransactionCategory(transaction.id, cat.id);
                setShowCategoryPicker(false);
              }}
            >
              <View style={[styles.pickerDot, { backgroundColor: cat.color }]} />
              <Text style={styles.pickerOptionText}>{cat.name}</Text>
              {cat.id === transaction.category_id && (
                <Ionicons name="checkmark" size={18} color={Colors.accent} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color={Colors.red} />
        <Text style={styles.deleteText}>Slett transaksjon</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: Spacing.md },
  notFound: {
    textAlign: 'center', padding: Spacing.xxl,
    fontSize: FontSize.md, color: Colors.gray400,
  },
  amountSection: { alignItems: 'center', paddingVertical: Spacing.lg, gap: 4 },
  amount: { fontSize: FontSize.hero, fontWeight: '700', color: Colors.gray900 },
  income: { color: Colors.green },
  merchant: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.gray700 },
  date: { fontSize: FontSize.md, color: Colors.gray400 },
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  detailLabel: { fontSize: FontSize.md, color: Colors.gray500 },
  detailValue: {
    fontSize: FontSize.md, color: Colors.gray900, fontWeight: '500',
    maxWidth: '60%', textAlign: 'right',
  },
  uncategorized: { fontSize: FontSize.md, color: Colors.yellow, fontWeight: '500' },
  recurringBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { height: 1, backgroundColor: Colors.gray100, marginHorizontal: Spacing.md },
  pickerTitle: {
    fontSize: FontSize.md, fontWeight: '600', color: Colors.gray900,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, gap: Spacing.sm,
  },
  pickerOptionActive: { backgroundColor: Colors.gray50 },
  pickerDot: { width: 12, height: 12, borderRadius: 6 },
  pickerOptionText: { flex: 1, fontSize: FontSize.md, color: Colors.gray900 },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md,
    backgroundColor: Colors.red + '10', borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  deleteText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.red },
});
