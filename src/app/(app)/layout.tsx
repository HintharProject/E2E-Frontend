import { AppHeader } from "@/components/app-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-line/70 py-6 text-center text-xs text-ink-muted">
        E2E mock UI · #63A121 / #F5F8FB · posts expire after 30 days
      </footer>
    </>
  );
}
