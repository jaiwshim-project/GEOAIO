import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import FloatingQR from "@/components/FloatingQR";
import Providers from "@/components/Providers";
import AutopilotProgressOverlay from "@/components/AutopilotProgressOverlay";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com'),
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ? [process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION] : [],
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'GEO-AIO',
    title: 'GEOAIO - AI 콘텐츠 최적화 대시보드',
    description: 'AI Overview 및 Generative Engine 최적화를 위한 콘텐츠 분석 도구',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GEOAIO - AI 콘텐츠 최적화 대시보드',
    description: 'AI Overview 및 Generative Engine 최적화를 위한 콘텐츠 분석 도구',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
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
        <AutopilotProgressOverlay />
        <Analytics />
      </body>
    </html>
  );
}
