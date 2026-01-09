import {
  Footer,
  Header,
  HeaderWrapper,
  QueryProvider,
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

import { siteConfig } from '@/config/site.config';

// ...

export const metadata: Metadata = {
  title: siteConfig.blog.title,
  description: siteConfig.owner.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 테마 깜빡임 방지: React 로드 전에 테마 미리 적용 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('tuum-theme') || 'system';
                  const resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  document.documentElement.setAttribute('data-theme', resolved);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${notoSansKr.variable} ${d2Coding.variable} ${sourceCodePro.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <QueryProvider>
            {/* HeaderWrapper fetches series data and renders Header */}
            <ScrollRestoration />
            <Suspense fallback={<Header />}>
              <HeaderWrapper />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Footer />
            <ScrollToTop />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
