import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Drift - Emotional AI Reflection',
  description: 'Upload your screenshot. Discover your digital behavior through emotional AI insights.',
  viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
  themeColor: '#faf8f3',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#faf8f3" />
      </head>
      <body className="bg-background text-foreground">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
