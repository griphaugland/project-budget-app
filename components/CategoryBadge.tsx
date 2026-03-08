import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';

interface CategoryBadgeProps {
  name: string;
  color: string;
  small?: boolean;
}

export function CategoryBadge({ name, color, small = false }: CategoryBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }, small && styles.badgeSmall]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, small && styles.textSmall]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  badgeSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: FontSize.xs,
  },
});
