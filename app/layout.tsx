import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import FloatingQR from "@/components/FloatingQR";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GEOAIO - AI 콘텐츠 최적화 대시보드",
  description: "AI Overview 및 Generative Engine 최적화를 위한 콘텐츠 분석 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <FloatingQR />
      </body>
    </html>
  );
}
