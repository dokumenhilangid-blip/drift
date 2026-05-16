import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Drift - AI Behavioral Mirror',
  description: 'AI yang membaca pola hidup digital lo dari screenshot. Bukan quote generator.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#1a1816',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <div className="min-h-dvh flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
