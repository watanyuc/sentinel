import { create } from 'zustand';
import type { Account } from '../types';

interface AccountState {
  accounts: Account[];
  wsConnected: boolean;
  lastUpdate: number | null;
  setAccounts: (accounts: Account[]) => void;
  updateAccounts: (accounts: Account[]) => void;
  setWsConnected: (connected: boolean) => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  wsConnected: false,
  lastUpdate: null,
  setAccounts: (accounts) => set({ accounts, lastUpdate: Date.now() }),
  updateAccounts: (accounts) => set({ accounts, lastUpdate: Date.now() }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
