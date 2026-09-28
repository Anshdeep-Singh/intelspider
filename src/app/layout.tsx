import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IntelSpider Enterprise | Deterministic Account Intelligence & Audit Ledger',
  description:
    'Automated pre-meeting technical reconnaissance and grounded B2B sales battlecards backed by cryptographic DNS, HTTP headers, and public ATS job proofs.',
  keywords: [
    'Account Intelligence',
    'Sales Battlecard',
    'Tech Stack Detection',
    'DNS Recon',
    'Enterprise Sales Engineering',
    'B2B Intelligence',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased selection:bg-emerald-500 selection:text-zinc-950 font-sans">
        {children}
      </body>
    </html>
  );
}
