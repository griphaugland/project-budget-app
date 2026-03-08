// Budget Guardian design tokens

export const Colors = {
  // Primary palette
  primary: '#0F172A',      // Dark navy - primary background
  primaryLight: '#1E293B', // Slightly lighter navy
  accent: '#10B981',       // Emerald green - positive/on-track
  accentLight: '#34D399',

  // Status colors
  green: '#10B981',        // On track (>50%)
  yellow: '#F59E0B',       // Caution (25-50%)
  red: '#EF4444',          // Critical (<25%)

  // Neutrals
  white: '#FFFFFF',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Category colors
  essentials: '#6366F1',     // Indigo
  groceries: '#10B981',      // Emerald
  transport: '#3B82F6',      // Blue
  foodDrinkOut: '#F59E0B',   // Amber
  subscriptions: '#8B5CF6',  // Violet
  pocketMoney: '#EC4899',    // Pink

  // Backgrounds
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  surfaceDark: '#0F172A',
} as const;

export const CategoryColors: Record<string, string> = {
  'Essentials': Colors.essentials,
  'Groceries': Colors.groceries,
  'Transport': Colors.transport,
  'Food & Drink Out': Colors.foodDrinkOut,
  'Subscriptions': Colors.subscriptions,
  'Pocket Money': Colors.pocketMoney,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
