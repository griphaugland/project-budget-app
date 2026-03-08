import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { formatTimeAgo } from '@/lib/format';
import { useTransactionStore } from '@/stores/transactionStore';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, notificationPreferences, updateNotificationPreferences, signOut } = useAuthStore();
  const { lastSyncedAt } = useTransactionStore();

  const notificationItems: {
    key: keyof typeof notificationPreferences;
    label: string;
    description: string;
  }[] = [
    {
      key: 'morning_briefing',
      label: 'Morgenoppdatering',
      description: 'Daglig snapshot kl. 08:00 med budsjettst\u00e5tus',
    },
    {
      key: 'transaction_alerts',
      label: 'Transaksjonsvarsler',
      description: 'Umiddelbar varsling ved nye transaksjoner',
    },
    {
      key: 'threshold_warnings',
      label: 'Budsjettadvarsler',
      description: 'Varsling n\u00e5r lommepenger synker under 25% og 10%',
    },
    {
      key: 'weekly_summary',
      label: 'Ukentlig oppsummering',
      description: 'S\u00f8ndag kl. 20:00 — ukesoversikt med trender',
    },
    {
      key: 'recurring_detection',
      label: 'Nye faste utgifter',
      description: 'Varsling n\u00e5r nye abonnementer oppdages',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
    >
      {/* Account */}
      <Text style={styles.sectionLabel}>KONTO</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>E-post</Text>
          <Text style={styles.rowValue}>{user?.email ?? '—'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Sist synkronisert</Text>
          <Text style={styles.rowValue}>
            {lastSyncedAt ? formatTimeAgo(lastSyncedAt) : 'Aldri'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Banktilkobling</Text>
          <Text style={[styles.rowValue, { color: Colors.green }]}>
            SpareBank 1 SR-Bank
          </Text>
        </View>
      </View>

      {/* Notifications */}
      <Text style={styles.sectionLabel}>VARSLER</Text>
      <View style={styles.card}>
        {notificationItems.map((item, index) => (
          <React.Fragment key={item.key}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.notificationRow}>
              <View style={styles.notificationText}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.notificationDesc}>{item.description}</Text>
              </View>
              <Switch
                value={notificationPreferences[item.key]}
                onValueChange={(value) =>
                  updateNotificationPreferences({ [item.key]: value })
                }
                trackColor={{ false: Colors.gray200, true: Colors.accent + '60' }}
                thumbColor={
                  notificationPreferences[item.key] ? Colors.accent : Colors.gray400
                }
              />
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* About */}
      <Text style={styles.sectionLabel}>OM</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Versjon</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
        <View style={styles.divider} />
        <Pressable style={styles.row}>
          <Text style={styles.rowLabel}>Personvern</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
        </Pressable>
      </View>

      {/* Sign out */}
      <Pressable
        style={styles.signOutButton}
        onPress={() =>
          Alert.alert('Logg ut', 'Er du sikker p\u00e5 at du vil logge ut?', [
            { text: 'Avbryt', style: 'cancel' },
            { text: 'Logg ut', style: 'destructive', onPress: signOut },
          ])
        }
      >
        <Text style={styles.signOutText}>Logg ut</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.gray500,
    letterSpacing: 1,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowLabel: {
    fontSize: FontSize.md,
    color: Colors.gray900,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: FontSize.md,
    color: Colors.gray500,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginHorizontal: Spacing.md,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  notificationText: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 2,
  },
  notificationDesc: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },
  signOutButton: {
    backgroundColor: Colors.red + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signOutText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.red,
  },
});
