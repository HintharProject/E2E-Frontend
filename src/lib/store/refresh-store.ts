import { create } from "zustand";

interface RefreshState {
  isRefreshing: boolean;
  setIsRefreshing: (val: boolean) => void;
  triggerRefresh: () => void;
  setTriggerRefresh: (fn: () => void) => void;
}

export const useRefreshStore = create<RefreshState>((set) => ({
  isRefreshing: false,
  setIsRefreshing: (val) => set({ isRefreshing: val }),
  triggerRefresh: () => {},
  setTriggerRefresh: (fn) => set({ triggerRefresh: fn }),
}));
