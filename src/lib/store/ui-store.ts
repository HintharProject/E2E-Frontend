import { create } from "zustand";

// ---------------------------------------------------------------------------
// Global UI State (Client-Only)
// Per AGENTS.md §3: Zustand is used exclusively for transient UI states.
// ---------------------------------------------------------------------------

interface UIState {
  /** Whether the mobile navigation panel is open. */
  isMobileNavOpen: boolean;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  
  /** Initial app loading state */
  isAppInitialized: boolean;
  initializationMessage: string;
  setAppInitialized: (initialized: boolean) => void;
  setInitializationMessage: (msg: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileNavOpen: false,
  toggleMobileNav: () =>
    set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),

  isAppInitialized: false,
  initializationMessage: "Starting up the render backend...",
  setAppInitialized: (initialized) => set({ isAppInitialized: initialized }),
  setInitializationMessage: (msg) => set({ initializationMessage: msg }),
}));
