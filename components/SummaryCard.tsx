import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { formatNOK } from '@/lib/format';

interface SummaryCardProps {
  title: string;
  spent: number;
  target: number;
  compact?: boolean;
}

export function SummaryCard({ title, spent, target, compact = false }: SummaryCardProps) {
  const percent = target > 0 ? (spent / target) * 100 : 0;
  const barColor =
    percent < 80 ? Colors.green :
    percent < 95 ? Colors.yellow :
    Colors.red;

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.amounts}>
        <Text style={styles.spent}>{formatNOK(spent)}</Text>
        <Text style={styles.separator}>/</Text>
        <Text style={styles.target}>{formatNOK(target)}</Text>
      </View>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.min(percent, 100)}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  compact: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  spent: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.gray900,
  },
  separator: {
    fontSize: FontSize.sm,
    color: Colors.gray300,
  },
  target: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
  },
  barBackground: {
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
