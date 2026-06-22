import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moki Alpha Brief - NVDA Research Memo",
  description: "Public buy-side style research memo demo for NVDA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
