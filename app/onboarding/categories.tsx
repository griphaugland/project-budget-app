import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setOnboarded } = useAuthStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.step}>Steg 3 av 4</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.title}>Dine konvolutter</Text>
      <Text style={styles.description}>
        Hver krone f\u00e5r en konvolutt. Du kan endre navnene senere.
      </Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {DEFAULT_CATEGORIES.map((cat) => (
          <View key={cat.id} style={styles.categoryRow}>
            <View style={[styles.dot, { backgroundColor: cat.color }]} />
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryType}>{cat.type}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.gray600} />
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={styles.button}
        onPress={() => {
          setOnboarded(true);
          router.replace('/(tabs)');
        }}
      >
        <Text style={styles.buttonText}>Ferdig — start budsjett!</Text>
        <Ionicons name="checkmark" size={20} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceDark,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  step: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    fontWeight: '500',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.gray400,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  categoryType: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textTransform: 'capitalize',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  buttonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
