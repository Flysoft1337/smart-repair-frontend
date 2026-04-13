import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from '@/components/Navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Repair Hub",
  description: "Campus Repair Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-dvh flex flex-col md:flex-row text-zinc-50 bg-zinc-950 font-sans">

        {/* Real Dynamic App Navigation */}
        <Navigation />

        {/* Main Content Area */}
        <main className="flex-1 flex min-h-0 flex-col min-w-0 overflow-x-hidden">
          {children}
        </main>

      </body>
    </html>
  );
}
