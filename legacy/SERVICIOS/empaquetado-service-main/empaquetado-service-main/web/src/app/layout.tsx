import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Empaquetado · Registro y control',
  description: 'Administra el peso, tamaño, medidas y tipo de tus empaquetados en un solo lugar.',
  robots: { index: false, follow: false },
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
