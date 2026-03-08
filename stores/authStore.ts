import { create } from 'zustand';
import { User, NotificationPreferences } from '@/types/database';
import { TEST_USER } from '@/data/testData';

interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;

  // Notification preferences
  notificationPreferences: NotificationPreferences;

  // Actions
  setUser: (user: User | null) => void;
  setOnboarded: (value: boolean) => void;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  signOut: () => void;

  // For dev/testing
  loginWithTestUser: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: TEST_USER, // Pre-loaded for development
  isAuthenticated: true,
  isOnboarded: true,
  isLoading: false,

  notificationPreferences: {
    morning_briefing: true,
    transaction_alerts: true,
    threshold_warnings: true,
    weekly_summary: true,
    recurring_detection: true,
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setOnboarded: (value) => set({ isOnboarded: value }),

  updateNotificationPreferences: (prefs) =>
    set((state) => ({
      notificationPreferences: { ...state.notificationPreferences, ...prefs },
    })),

  signOut: () => set({ user: null, isAuthenticated: false }),

  loginWithTestUser: () =>
    set({ user: TEST_USER, isAuthenticated: true, isOnboarded: true }),
}));
