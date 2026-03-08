import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { EnvelopeStatus } from '@/types/database';
import { formatNOK } from '@/lib/format';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

interface EnvelopeCardProps {
  envelope: EnvelopeStatus;
  onPress?: () => void;
}

export function EnvelopeCard({ envelope, onPress }: EnvelopeCardProps) {
  const { category, allocated, spent, remaining, percentUsed } = envelope;
  const barPercent = Math.min(percentUsed, 100);

  const barColor =
    percentUsed < 80 ? category.color :
    percentUsed < 95 ? Colors.yellow :
    Colors.red;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: category.color }]} />
          <Text style={styles.name}>{category.name}</Text>
          <Text style={styles.type}>{category.type}</Text>
        </View>
        <Text style={[styles.remaining, remaining < 0 && styles.overBudget]}>
          {formatNOK(remaining)}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${barPercent}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {formatNOK(spent)} av {formatNOK(allocated)}
        </Text>
        <Text style={styles.footerText}>{Math.round(percentUsed)}%</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
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
  pressed: {
    opacity: 0.95,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.gray900,
  },
  type: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textTransform: 'capitalize',
  },
  remaining: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.gray900,
  },
  overBudget: {
    color: Colors.red,
  },
  barBackground: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },
});
