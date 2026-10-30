import { create } from 'zustand';
import { User, Market, MarketCategory, SortOption, Proposal, Notification } from '../types';
import { api } from '../services/api';

interface HawaState {
  currentUser: User | null;
  markets: Market[];
  proposals: Proposal[];
  notifications: Notification[];
  activeCategory: MarketCategory;
  searchQuery: string;
  sortBy: SortOption;
  isLoading: boolean;
  isCoinFlipping: boolean;
  isBurstingWin: boolean;
  fpsWarning: boolean;

  // Actions
  init: () => Promise<void>;
  setCurrentUser: (user: User) => void;
  switchRole: (role: 'student' | 'admin') => Promise<void>;
  claimDailyCoins: () => Promise<{ success: boolean; newBalance?: number; error?: string }>;
  setActiveCategory: (cat: MarketCategory) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortOption) => void;
  triggerCoinFlip: () => void;
  triggerWinBurst: () => void;
  setFpsWarning: (warning: boolean) => void;
  refreshMarkets: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  resetDemoData: () => Promise<void>;
}

export const useHawaStore = create<HawaState>((set, get) => ({
  currentUser: null,
  markets: [],
  proposals: [],
  notifications: [],
  activeCategory: 'all',
  searchQuery: '',
  sortBy: 'trending',
  isLoading: true,
  isCoinFlipping: false,
  isBurstingWin: false,
  fpsWarning: false,

  init: async () => {
    set({ isLoading: true });
    try {
      const user = await api.getCurrentUser();
      const markets = await api.getMarkets();
      const proposals = await api.getProposals();
      const notifications = user ? await api.getNotifications(user.id) : [];

      set({
        currentUser: user,
        markets,
        proposals,
        notifications,
        isLoading: false,
      });
    } catch (err) {
      console.error('Init error:', err);
      set({ isLoading: false });
    }
  },

  setCurrentUser: (user: User) => {
    set({ currentUser: user });
  },

  switchRole: async (role: 'student' | 'admin') => {
    const updated = await api.switchRole(role);
    set({ currentUser: updated });
  },

  claimDailyCoins: async () => {
    const { currentUser } = get();
    if (!currentUser) return { success: false, error: 'Not logged in' };

    const result = await api.claimDailyCoins(currentUser.id);
    if (result.success) {
      const refreshed = await api.getCurrentUser();
      set({ currentUser: refreshed });
      get().triggerCoinFlip();
      get().refreshNotifications();
    }
    return result;
  },

  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sort) => set({ sortBy: sort }),

  triggerCoinFlip: () => {
    set({ isCoinFlipping: true });
    setTimeout(() => set({ isCoinFlipping: false }), 1200);
  },

  triggerWinBurst: () => {
    set({ isBurstingWin: true, isCoinFlipping: true });
    setTimeout(() => set({ isBurstingWin: false, isCoinFlipping: false }), 2000);
  },

  setFpsWarning: (warning: boolean) => set({ fpsWarning: warning }),

  refreshMarkets: async () => {
    const markets = await api.getMarkets();
    const currentUser = await api.getCurrentUser();
    set({ markets, currentUser });
  },

  refreshNotifications: async () => {
    const { currentUser } = get();
    if (currentUser) {
      const notifications = await api.getNotifications(currentUser.id);
      set({ notifications });
    }
  },

  resetDemoData: async () => {
    await api.resetDemoData();
    await get().init();
  },
}));
