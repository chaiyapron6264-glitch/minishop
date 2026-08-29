import type { Metadata } from "next";
import { Header } from "@/components/header";
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
        <Header />
        {children}
        <MobileBottomNavigation />
      </body>
    </html>
  );
}
