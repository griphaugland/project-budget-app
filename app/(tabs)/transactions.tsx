import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TransactionRow } from '@/components/TransactionRow';
import { useTransactionStore } from '@/stores/transactionStore';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { formatDateNO, groupByDate } from '@/lib/format';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    filterCategory,
    searchQuery,
    setFilterCategory,
    setSearchQuery,
    filteredTransactions,
  } = useTransactionStore();

  const transactions = filteredTransactions();
  const grouped = groupByDate(transactions);

  const sections = grouped.map(({ date, items }) => ({
    title: formatDateNO(date),
    data: items,
  }));

  const getCategoryForTransaction = (categoryId: string) =>
    DEFAULT_CATEGORIES.find((c) => c.id === categoryId);

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Søk etter butikk eller beskrivelse..."
          placeholderTextColor={Colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.gray400} />
          </Pressable>
        )}
      </View>

      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <Pressable
          style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
          onPress={() => setFilterCategory(null)}
        >
          <Text style={[styles.filterChipText, !filterCategory && styles.filterChipTextActive]}>
            Alle
          </Text>
        </Pressable>
        {DEFAULT_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.filterChip,
              filterCategory === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color },
            ]}
            onPress={() =>
              setFilterCategory(filterCategory === cat.id ? null : cat.id)
            }
          >
            <View style={[styles.filterDot, { backgroundColor: cat.color }]} />
            <Text
              style={[
                styles.filterChipText,
                filterCategory === cat.id && { color: cat.color },
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Add button */}
      <View style={styles.addRow}>
        <Pressable style={styles.addButton} onPress={() => router.push('/add-transaction')}>
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.addButtonText}>Legg til</Text>
        </Pressable>
        <Pressable style={styles.importButton} onPress={() => router.push('/import-csv')}>
          <Ionicons name="cloud-upload-outline" size={18} color={Colors.accent} />
          <Text style={styles.importButtonText}>Importer</Text>
        </Pressable>
      </View>

      {/* Transaction list */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            category={getCategoryForTransaction(item.category_id)}
            onPress={() => router.push(`/transaction/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>Ingen transaksjoner funnet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, margin: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md, gap: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.gray900 },
  filterScroll: { maxHeight: 44, marginBottom: Spacing.sm },
  filterContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.gray200, gap: 6,
  },
  filterChipActive: { backgroundColor: Colors.accent + '15', borderColor: Colors.accent },
  filterChipText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.gray600 },
  filterChipTextActive: { color: Colors.accent },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  addRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.md,
    gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
  },
  addButtonText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.white },
  importButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.accent,
  },
  importButtonText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.accent },
  sectionHeader: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: '600', color: Colors.gray500,
    textTransform: 'capitalize',
  },
  separator: {
    height: 1, backgroundColor: Colors.gray100, marginHorizontal: Spacing.md,
  },
  empty: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2, gap: Spacing.md,
  },
  emptyText: { fontSize: FontSize.md, color: Colors.gray400 },
});
