import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '@/stores/budgetStore';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function SetIncomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setIncome } = useBudgetStore();
  const [income, setIncomeLocal] = useState('');

  function handleNext() {
    const num = parseFloat(income);
    if (!isNaN(num) && num > 0) {
      setIncome(num);
    }
    router.push('/onboarding/categories');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.step}>Steg 1 av 2</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Hva er månedlig inntekt?</Text>
        <Text style={styles.description}>
          Oppgi nettoinntekt (etter skatt). Dette er grunnlaget for budsjettet ditt.
          Du kan endre dette senere.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={income}
            onChangeText={setIncomeLocal}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.gray600}
            autoFocus
          />
          <Text style={styles.inputSuffix}>kr/måned</Text>
        </View>
      </View>

      <Pressable
        style={styles.button}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>Neste</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.surfaceDark, paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.xl,
  },
  step: { fontSize: FontSize.sm, color: Colors.gray400, fontWeight: '500' },
  content: { flex: 1, justifyContent: 'center', gap: Spacing.lg },
  title: {
    fontSize: FontSize.xxl, fontWeight: '700', color: Colors.white, textAlign: 'center',
  },
  description: {
    fontSize: FontSize.md, color: Colors.gray400, textAlign: 'center', lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
  },
  input: {
    fontSize: 48, fontWeight: '700', color: Colors.white,
    textAlign: 'center', minWidth: 200,
  },
  inputSuffix: { fontSize: FontSize.lg, color: Colors.gray400, fontWeight: '500' },
  button: {
    flexDirection: 'row', backgroundColor: Colors.accent,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg, alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
  },
  buttonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
});
