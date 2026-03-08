import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function ConnectBankScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.step}>Steg 1 av 4</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Ionicons name="business-outline" size={64} color={Colors.accent} />
        <Text style={styles.title}>Koble til banken din</Text>
        <Text style={styles.description}>
          Vi bruker Neonomics og BankID for \u00e5 koble til banken din p\u00e5 en sikker m\u00e5te.
          Vi kan kun lese kontoinformasjon — aldri overf\u00f8re penger.
        </Text>

        <View style={styles.securityPoints}>
          {[
            'Kun lesetilgang (PSD2 AISP)',
            'BankID-verifisering',
            'Samtykke utl\u00f8per etter 90 dager',
            'Du kan koble fra n\u00e5r som helst',
          ].map((point, i) => (
            <View key={i} style={styles.point}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.accent} />
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            // In production: initiate Neonomics BankID flow
            router.push('/onboarding/set-income');
          }}
        >
          <Text style={styles.primaryButtonText}>Koble til med BankID</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/onboarding/set-income')}
        >
          <Text style={styles.secondaryButtonText}>Hopp over foreløpig</Text>
        </Pressable>
      </View>
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
    marginBottom: Spacing.xl,
  },
  step: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
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
  },
  securityPoints: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
    width: '100%',
  },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  pointText: {
    fontSize: FontSize.md,
    color: Colors.white,
    fontWeight: '500',
  },
  buttons: {
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: FontSize.md,
    color: Colors.gray400,
    fontWeight: '500',
  },
});
