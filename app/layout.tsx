import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/ThemeProvider';
import { TitleProvider } from '@/lib/TitleContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cancionero Cristiano',
  description: 'Aplicación de canciones cristianas con acordes',
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cancionero',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <TitleProvider>
            {children}
          </TitleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}