import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Transaction, Category } from '@/types/database';
import { CategoryBadge } from './CategoryBadge';
import { formatNOK } from '@/lib/format';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  onPress?: () => void;
}

export function TransactionRow({ transaction, category, onPress }: TransactionRowProps) {
  const isExpense = transaction.amount < 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.left}>
        <Text style={styles.merchant} numberOfLines={1}>
          {transaction.merchant_name}
        </Text>
        {category && (
          <CategoryBadge name={category.name} color={category.color} small />
        )}
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, isExpense ? styles.expense : styles.income]}>
          {formatNOK(transaction.amount, true)}
        </Text>
        {transaction.is_recurring && (
          <Text style={styles.recurringBadge}>Gjentar</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cardBackground,
  },
  pressed: {
    backgroundColor: Colors.gray50,
  },
  left: {
    flex: 1,
    gap: 4,
    marginRight: Spacing.md,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  merchant: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.gray900,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  expense: {
    color: Colors.gray900,
  },
  income: {
    color: Colors.green,
  },
  recurringBadge: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    fontWeight: '500',
  },
});
