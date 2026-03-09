import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark" size={80} color={Colors.accent} />
      </View>

      <View style={styles.textContent}>
        <Text style={styles.title}>Budget Guardian</Text>
        <Text style={styles.subtitle}>
          Din personlige vokter for bedre {'\n'}pengeforståelse
        </Text>
        <Text style={styles.description}>
          Budget Guardian gir deg sanntidsoversikt over forbruket ditt.
          Hver krone får en oppgave — og du ser alltid hvor mye du har igjen.
        </Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: 'wallet-outline' as const, text: 'Konvolutt-budsjett med lommepenger' },
          { icon: 'document-text-outline' as const, text: 'Importer fra CSV eller legg til manuelt' },
          { icon: 'notifications-outline' as const, text: 'Smarte varsler som skaper bevissthet' },
        ].map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons name={feature.icon} size={24} color={Colors.accent} />
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={styles.button}
        onPress={() => router.push('/onboarding/set-income')}
      >
        <Text style={styles.buttonText}>Kom i gang</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.surfaceDark,
    paddingHorizontal: Spacing.lg, justifyContent: 'space-between',
  },
  iconContainer: { alignItems: 'center' },
  textContent: { gap: Spacing.md },
  title: {
    fontSize: 36, fontWeight: '800', color: Colors.white, textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.xl, fontWeight: '500', color: Colors.accentLight,
    textAlign: 'center', lineHeight: 32,
  },
  description: {
    fontSize: FontSize.md, color: Colors.gray400,
    textAlign: 'center', lineHeight: 24,
  },
  features: { gap: Spacing.md },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primaryLight, padding: Spacing.md, borderRadius: BorderRadius.md,
  },
  featureText: {
    fontSize: FontSize.md, color: Colors.white, fontWeight: '500', flex: 1,
  },
  button: {
    flexDirection: 'row', backgroundColor: Colors.accent,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg, alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
  },
  buttonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
});
