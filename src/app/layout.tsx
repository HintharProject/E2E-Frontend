import type { Metadata } from "next";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist_Mono, Montserrat, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { DevTools } from "@/components/dev/dev-tools";

const manropeHeading = Manrope({ subsets: ["latin"], variable: "--font-heading", preload: false });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: "E2E — Creator-led learning",
  description:
    "Forum, lessons, and study plans for creator-led learning and community Q&A.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(
          "h-full",
          "antialiased",
          geistMono.variable,
          "font-sans",
          montserrat.variable,
          manropeHeading.variable
        )}
      >
        <body className="min-h-full flex flex-col">
          <Script id="clerk-error-suppress" strategy="beforeInteractive" dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message && (e.message.includes('ClerkJS: Network error') || e.message.includes('NetworkError'))) {
                  e.stopImmediatePropagation();
                }
              }, true);
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.message && (e.reason.message.includes('ClerkJS: Network error') || e.reason.message.includes('NetworkError'))) {
                  e.stopImmediatePropagation();
                }
              }, true);
            `
          }} />
          <Providers>
            {children}
            <DevTools />
          </Providers>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
