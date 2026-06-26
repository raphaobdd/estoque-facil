import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'StockHome', template: '%s | StockHome' },
  description: 'Controle de estoque simples e inteligente para pequenos negócios. Cadastre produtos, registre movimentações e receba alertas automáticos.',
  keywords: ['estoque', 'controle de estoque', 'stockhome', 'gestão de estoque', 'pequenos negócios', 'inventário'],
  robots: 'index, follow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
