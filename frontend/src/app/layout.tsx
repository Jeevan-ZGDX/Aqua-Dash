import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CSE Admissions Analytics | AIDDS',
    template: '%s | CSE Admissions Analytics',
  },
  description:
    'Enterprise admission intelligence and decision support dashboard for the Computer Science Engineering department.',
  applicationName: 'AIDDS',
  authors: [{ name: 'CSE Department' }],
  openGraph: {
    title: 'CSE Admissions Analytics',
    description: 'Admission intelligence and decision support system',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
