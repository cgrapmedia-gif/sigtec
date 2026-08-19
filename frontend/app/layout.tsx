import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-plex' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: 'SIGTEC Consulado',
  description: 'Sistema Integrado de Gestão Tecnológica e Manutenção — Consulado Geral de Angola no Porto',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'SIGTEC' },
  formatDetection: { telephone: true },
};

/** viewport-fit=cover permite usar as áreas seguras do iPhone; maximumScale livre por acessibilidade */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#16130F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${plex.variable} ${plexMono.variable} font-sans`}>{children}</body>
    </html>
  );
}
