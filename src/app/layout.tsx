import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import AppShell from '@/components/shell/AppShell';
import '@/styles/00-design-system.css';
import '@/styles/01-base.css';
import '@/styles/02-shell.css';
import '@/styles/03-atoms.css';
import '@/styles/04-academy.css';
import '@/styles/05-lesson.css';
import '@/styles/06-quiz.css';
import '@/styles/07-badges.css';
import '@/styles/08-fork-responsive.css';
import '@/styles/09-figma-skin.css';
import '@/styles/10-wega.css';
import '@/styles/11-wega-learning.css';
import '@/styles/12-strategies.css';
import '@/styles/13-next.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], weight: ['400', '500', '600'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'Web3 Universe',
  description: 'Web3 Universe platform prototype: Academy, badges, strategies and Wega, the AI copilot.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#040811' };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
        {/* The original badgeweb3 engine (three.js + gsap), bundled unchanged as an IIFE: window.W3UBadges */}
        <Script src="/w3u-badges.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
