import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { LiffDebugIndicator } from "@/components/liff-debug-indicator";
import { LiffProvider } from "@/components/liff-provider";
import { MobileBottomNavigation } from "@/components/mobile-bottom-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiniShop",
  description: "Mobile-first ecommerce starter for small Thai sellers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full bg-white text-zinc-950">
        <LiffProvider>
          <Header />
          {children}
          <MobileBottomNavigation />
          <Suspense fallback={null}>
            <LiffDebugIndicator />
          </Suspense>
        </LiffProvider>
      </body>
    </html>
  );
}
