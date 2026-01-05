import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Verdade ou Fake? | Verificador de Fatos',
  description: 'Verifique notícias, posts de redes sociais e correntes de WhatsApp. Combata a desinformação com inteligência artificial.',
  keywords: ['fact-check', 'verificação', 'fake news', 'desinformação', 'Brasil'],
  authors: [{ name: 'Verdade ou Fake' }],
  openGraph: {
    title: 'Verdade ou Fake?',
    description: 'Verifique se uma notícia é verdadeira ou falsa em segundos',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verdade ou Fake?',
    description: 'Verifique se uma notícia é verdadeira ou falsa em segundos',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
