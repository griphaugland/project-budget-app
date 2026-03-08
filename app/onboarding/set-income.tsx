import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function SetIncomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [income, setIncome] = useState('42000');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.step}>Steg 2 av 4</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Hva er m\u00e5nedlig inntekt?</Text>
        <Text style={styles.description}>
          Oppgi nettoinntekt (etter skatt). Dette er grunnlaget for budsjettet ditt.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={income}
            onChangeText={setIncome}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.gray600}
          />
          <Text style={styles.inputSuffix}>kr/m\u00e5ned</Text>
        </View>
      </View>

      <Pressable
        style={[styles.button, !income && styles.buttonDisabled]}
        onPress={() => router.push('/onboarding/categories')}
        disabled={!income}
      >
        <Text style={styles.buttonText}>Neste</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.white} />
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
    marginBottom: Spacing.xl,
  },
  step: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  input: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    minWidth: 200,
  },
  inputSuffix: {
    fontSize: FontSize.lg,
    color: Colors.gray400,
    fontWeight: '500',
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
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
