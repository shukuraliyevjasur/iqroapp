import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IQRO",
  description: "IQRO o'quv markazi — boshqaruv va ota-ona portali",
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
    <html lang="uz" className="h-full">
      <body className="min-h-full bg-[#F4F4F6]">{children}</body>
    </html>
  );
}
