import {
  Footer,
  Header,
  HeaderWrapper,
  ProgressBar,
  QueryProvider,
  ScrollToTop,
  ThemeProvider,
} from '@/components/layout';
import type { Metadata, Viewport } from 'next';
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

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tuum.tech';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteConfig.blog.title,
    template: `%s | ${siteConfig.blog.title}`,
  },
  description: siteConfig.owner.description,
  keywords: ['블로그', '기술블로그', 'Notion', 'Next.js'],
  authors: [{ name: siteConfig.owner.name }],
  creator: siteConfig.owner.name,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: siteConfig.blog.title,
    title: siteConfig.blog.title,
    description: siteConfig.owner.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.blog.title,
    description: siteConfig.owner.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
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
          <ProgressBar />
          <QueryProvider>
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
