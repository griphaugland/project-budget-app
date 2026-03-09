import { create } from 'zustand';
import { User, NotificationPreferences } from '@/types/database';
import { saveData, loadData, KEYS } from '@/lib/storage';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;

  notificationPreferences: NotificationPreferences;

  // Actions
  setUser: (user: User | null) => void;
  setOnboarded: (value: boolean) => void;
  loadOnboardingState: () => Promise<void>;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  signOut: () => void;
}

const LOCAL_USER: User = {
  id: 'local-user',
  email: '',
  push_token: null,
  last_synced_at: null,
  created_at: new Date().toISOString(),
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: LOCAL_USER,
  isAuthenticated: true,
  isOnboarded: false,
  isLoading: true,

  notificationPreferences: {
    morning_briefing: true,
    transaction_alerts: true,
    threshold_warnings: true,
    weekly_summary: true,
    recurring_detection: true,
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setOnboarded: (value) => {
    set({ isOnboarded: value });
    saveData(KEYS.ONBOARDED, value);
  },

  loadOnboardingState: async () => {
    const onboarded = await loadData<boolean>(KEYS.ONBOARDED);
    set({ isOnboarded: onboarded ?? false, isLoading: false });
  },

  updateNotificationPreferences: (prefs) =>
    set((state) => ({
      notificationPreferences: { ...state.notificationPreferences, ...prefs },
    })),

  signOut: () => set({ user: null, isAuthenticated: false, isOnboarded: false }),
}));
