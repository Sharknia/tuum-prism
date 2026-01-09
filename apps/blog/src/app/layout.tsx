import {
    Footer,
    Header,
    HeaderWrapper,
    ScrollToTop,
    ThemeProvider
} from '@/components/layout';
import type { Metadata } from 'next';
import { ScrollRestoration } from 'next-scroll-restoration';
import { Noto_Sans_KR, Source_Code_Pro } from 'next/font/google';
import localFont from 'next/font/local';
import { Suspense } from 'react';
import './globals.css';

const notoSansKr = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
});

const d2Coding = localFont({
  src: [
    {
      path: './fonts/D2Coding.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/D2CodingBold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-d2coding',
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
        className={`${notoSansKr.variable} ${d2Coding.variable} ${sourceCodePro.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          {/* HeaderWrapper fetches series data and renders Header */}
          <ScrollRestoration />
          <Suspense fallback={<Header />}>
            <HeaderWrapper />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
