import { AppHeader } from "@/components/app-header";
import { ApiStatusBanner } from "@/components/api-status-banner";
import { UserProvider } from "@/components/user-provider";
import { requireSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, source } = await requireSession();

  return (
    <UserProvider user={user} source={source}>
      <ApiStatusBanner />
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-line/70 py-6 text-center text-xs text-ink-muted">
        E2E · mock data mode · posts expire after 30 days
      </footer>
    </UserProvider>
  );
}
