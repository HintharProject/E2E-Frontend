export const clerkAppearance = {
  variables: {
    colorPrimary: "oklch(0.508 0.118 165.612)",
    colorBackground: "oklch(1 0 0)",
    colorText: "oklch(0.148 0.004 228.8)",
    colorTextSecondary: "oklch(0.56 0.021 213.5)",
    borderRadius: "0.625rem",
  },
  elements: {
    card: "shadow-sm border border-border",
    formButtonPrimary:
      "bg-primary hover:bg-sidebar-primary text-primary-foreground font-semibold",
    footerActionLink: "text-sidebar-primary hover:text-primary",
    headerTitle: "font-serif",
    headerSubtitle: "text-muted-foreground",
  },
} as const;
