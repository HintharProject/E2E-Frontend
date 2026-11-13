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

  /** Whether the desktop left sidebar rail is collapsed. */
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  /** Initial app loading state */
  isAppInitialized: boolean;
  initializationMessage: string;
  setAppInitialized: (initialized: boolean) => void;
  setInitializationMessage: (msg: string) => void;

  /** Command Palette state */
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

const SIDEBAR_STORAGE_KEY = "e2e_sidebar_collapsed";

function persistSidebarCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export const useUIStore = create<UIState>((set) => ({
  isMobileNavOpen: false,
  toggleMobileNav: () =>
    set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),

  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => {
      const next = !state.isSidebarCollapsed;
      persistSidebarCollapsed(next);
      return { isSidebarCollapsed: next };
    }),
  setSidebarCollapsed: (collapsed) => {
    persistSidebarCollapsed(collapsed);
    set({ isSidebarCollapsed: collapsed });
  },

  isAppInitialized: false,
  initializationMessage: "Starting up the render backend...",
  setAppInitialized: (initialized) => set({ isAppInitialized: initialized }),
  setInitializationMessage: (msg) => set({ initializationMessage: msg }),

  isCommandPaletteOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () =>
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
}));
