import {
  Footer,
  Header,
  HeaderWrapper,
  ThemeProvider,
} from '@/components/layout';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Source_Code_Pro } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const sourceCodePro = Source_Code_Pro({
  variable: '--font-source-code-pro',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tuum Prism - 개발 블로그',
  description: 'Notion 기반 기술 블로그',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sourceCodePro.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          {/* HeaderWrapper fetches series data and renders Header */}
          <Suspense fallback={<Header />}>
            <HeaderWrapper />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
