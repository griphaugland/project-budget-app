import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, FontSize } from '@/constants/theme';
import { formatAmount } from '@/lib/format';

interface BudgetRingProps {
  remaining: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function BudgetRing({
  remaining,
  total,
  size = 220,
  strokeWidth = 12,
  label = 'kr igjen denne uken',
}: BudgetRingProps) {
  const percent = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const color =
    percent > 50 ? Colors.green :
    percent > 25 ? Colors.yellow :
    Colors.red;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.gray200}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.amount, { color }]}>{formatAmount(remaining)}</Text>
        <Text style={styles.currency}>kr</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
  },
  amount: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    letterSpacing: -1,
  },
  currency: {
    fontSize: FontSize.lg,
    color: Colors.gray400,
    fontWeight: '500',
    marginTop: -4,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 4,
  },
});
