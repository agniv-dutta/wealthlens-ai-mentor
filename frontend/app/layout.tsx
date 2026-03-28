import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WealthLens AI Mentor',
  description: 'AI Money Mentor frontend built with Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
        <style media="print">{`
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          html,
          body {
            background: var(--bg-base, #FDFAF4) !important;
            color: var(--text-primary, #1C1A12) !important;
          }

          .print-hide-topbar-buttons,
          .print-hide-sidebar,
          .print-hide-tabbar,
          nav,
          .print-hide-app-footer {
            display: none !important;
          }

          .print-main-content {
            padding: 0 !important;
            overflow: visible !important;
            background: var(--bg-base, #FDFAF4) !important;
          }

          .print-main-content > div {
            display: none !important;
          }

          .print-report-sheet {
            display: block !important;
            max-width: 100% !important;
            margin: 0 !important;
            background: var(--bg-base, #FDFAF4) !important;
            min-height: 100%;
          }

          .print-report-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            border-bottom: 1px solid var(--border-default, #DDD8C0);
            padding-bottom: 8px;
            margin-bottom: 10px;
          }

          .print-report-title {
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary, #1C1A12);
          }

          .print-report-date {
            font-size: 12px;
            color: var(--text-secondary, #4A4830);
          }

          .print-report-body {
            display: grid;
            gap: 10px;
          }

          .print-xray-stats .grid,
          .print-xray-core .grid {
            gap: 8px !important;
            margin-bottom: 8px !important;
          }

          .print-xray-stats .grid {
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          }

          .print-xray-core .grid {
            grid-template-columns: 1.4fr 1fr !important;
          }

          .print-xray-holdings {
            break-inside: avoid;
          }

          .print-report-footer {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid var(--border-default, #DDD8C0);
            font-size: 11px;
            text-align: center;
            color: var(--text-muted, #7A7250);
          }

          .print-shell {
            overflow: visible !important;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
