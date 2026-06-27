import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import { LangProvider } from "@/lib/i18n/context";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Iqro Academy",
  description: "Iqro Academy — boshqaruv va ota-ona portali",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#C0181B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className={`h-full ${cinzel.variable} ${inter.variable}`}>
      <body className="min-h-full bg-[#F4F4F6] font-[family-name:var(--font-inter)]">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
