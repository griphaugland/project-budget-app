import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTransactionStore } from '@/stores/transactionStore';
import { parseCsv, guessCategory, CsvRow } from '@/lib/csv';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { formatNOK } from '@/lib/format';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function ImportCsvScreen() {
  const router = useRouter();
  const { addTransactions } = useTransactionStore();
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      const rows = parseCsv(content);

      if (rows.length === 0) {
        Alert.alert('Ingen transaksjoner funnet', 'Filen kunne ikke tolkes. Sjekk formatet.');
        return;
      }
      setParsedRows(rows);
    } catch (err) {
      Alert.alert('Feil', 'Kunne ikke lese filen.');
    }
  }

  function handleParsePaste() {
    if (!pasteContent.trim()) return;
    const rows = parseCsv(pasteContent);
    if (rows.length === 0) {
      Alert.alert('Ingen transaksjoner funnet', 'Sjekk formatet. Forventet: dato, beskrivelse, beløp');
      return;
    }
    setParsedRows(rows);
  }

  function handleImport() {
    const txs = parsedRows.map((row) => ({
      amount: row.amount,
      merchant_name: row.description,
      raw_description: row.description,
      category_id: guessCategory(row.description),
      is_recurring: false,
      ai_confidence: 0.5,
      manually_edited: false,
      transaction_date: row.date,
    }));

    addTransactions(txs);
    Alert.alert(
      'Importert!',
      `${txs.length} transaksjoner ble lagt til. Du kan endre kategorier i transaksjonslisten.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }

  const getCategoryName = (desc: string) => {
    const catId = guessCategory(desc);
    return DEFAULT_CATEGORIES.find((c) => c.id === catId)?.name ?? 'Ukjent';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {parsedRows.length === 0 ? (
        <>
          <View style={styles.infoCard}>
            <Ionicons name="document-text-outline" size={48} color={Colors.accent} />
            <Text style={styles.infoTitle}>Importer transaksjoner</Text>
            <Text style={styles.infoText}>
              Last opp en CSV-fil fra banken din, eller lim inn data direkte.
              Forventet format: dato, beskrivelse, beløp.
            </Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={handlePickFile}>
            <Ionicons name="folder-open-outline" size={22} color={Colors.white} />
            <Text style={styles.primaryButtonText}>Velg CSV-fil</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => setPasteMode(!pasteMode)}
          >
            <Text style={styles.secondaryButtonText}>
              {pasteMode ? 'Skjul' : 'Eller lim inn CSV-data'}
            </Text>
          </Pressable>

          {pasteMode && (
            <View style={styles.pasteSection}>
              <TextInput
                style={styles.pasteInput}
                multiline
                value={pasteContent}
                onChangeText={setPasteContent}
                placeholder={'dato;beskrivelse;beløp\n08.03.2026;REMA 1000;-342\n07.03.2026;Spotify;-159'}
                placeholderTextColor={Colors.gray400}
              />
              <Pressable
                style={[styles.primaryButton, !pasteContent.trim() && styles.buttonDisabled]}
                onPress={handleParsePaste}
                disabled={!pasteContent.trim()}
              >
                <Text style={styles.primaryButtonText}>Analyser data</Text>
              </Pressable>
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>
              {parsedRows.length} transaksjoner funnet
            </Text>
            <Pressable onPress={() => setParsedRows([])}>
              <Text style={styles.resetText}>Start på nytt</Text>
            </Pressable>
          </View>

          {parsedRows.slice(0, 50).map((row, i) => (
            <View key={i} style={styles.previewRow}>
              <View style={styles.previewLeft}>
                <Text style={styles.previewDate}>{row.date}</Text>
                <Text style={styles.previewDesc} numberOfLines={1}>{row.description}</Text>
                <Text style={styles.previewCategory}>{getCategoryName(row.description)}</Text>
              </View>
              <Text style={[styles.previewAmount, row.amount > 0 && styles.previewIncome]}>
                {formatNOK(row.amount, true)}
              </Text>
            </View>
          ))}
          {parsedRows.length > 50 && (
            <Text style={styles.moreText}>...og {parsedRows.length - 50} til</Text>
          )}

          <Pressable style={styles.importButton} onPress={handleImport}>
            <Ionicons name="cloud-download-outline" size={22} color={Colors.white} />
            <Text style={styles.primaryButtonText}>
              Importer {parsedRows.length} transaksjoner
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: Spacing.md },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.gray900 },
  infoText: { fontSize: FontSize.md, color: Colors.gray500, textAlign: 'center', lineHeight: 22 },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
  secondaryButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: FontSize.md, color: Colors.accent, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  pasteSection: { gap: Spacing.md },
  pasteInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.gray900,
    minHeight: 150,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.gray900 },
  resetText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: '600' },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  previewLeft: { flex: 1, gap: 2, marginRight: Spacing.md },
  previewDate: { fontSize: FontSize.xs, color: Colors.gray400 },
  previewDesc: { fontSize: FontSize.md, color: Colors.gray900, fontWeight: '500' },
  previewCategory: { fontSize: FontSize.xs, color: Colors.accent },
  previewAmount: { fontSize: FontSize.md, fontWeight: '600', color: Colors.gray900 },
  previewIncome: { color: Colors.green },
  moreText: { fontSize: FontSize.sm, color: Colors.gray400, textAlign: 'center' },
  importButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
