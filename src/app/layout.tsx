import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OLAB — Laboratório de Objeções & Fricção de Conversão',
  description:
    'Audite a eficácia e objeções da sua Landing Page ou Copy com uma banca sintética antes de alocar capital em tráfego pago.',
  keywords: [
    'ObjectionLab',
    'CRO',
    'Copywriting',
    'Auditoria de Conversão',
    'Simulação de Objeções',
    'Focus Group Sintético',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#090b10] text-[#f3f4f8] flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
