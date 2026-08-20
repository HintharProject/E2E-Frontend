export const clerkAppearance = {
  variables: {
    colorPrimary: "#63A121",
    colorBackground: "#ffffff",
    colorText: "#1a2421",
    colorTextSecondary: "#5a6b64",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "shadow-[0_24px_60px_-40px_rgba(99,161,33,0.5)] border border-[#d5dde6]",
    formButtonPrimary:
      "bg-[#63A121] hover:bg-[#4f821a] text-white font-semibold",
    footerActionLink: "text-[#4f821a] hover:text-[#63A121]",
    headerTitle: "font-serif",
    headerSubtitle: "text-[#5a6b64]",
  },
} as const;
