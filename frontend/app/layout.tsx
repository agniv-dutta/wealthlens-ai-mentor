import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WealthLens Frontend',
  description: 'AI Money Mentor frontend built with Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
