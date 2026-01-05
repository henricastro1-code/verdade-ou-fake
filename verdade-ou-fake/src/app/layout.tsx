import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Verdade ou Fake? | Verificador de Fatos',
  description: 'Ferramenta simples para verificar notícias, posts e correntes de WhatsApp. Cole o texto, link ou envie uma imagem e descubra se é verdade ou fake.',
  keywords: ['fake news', 'verificador', 'fact check', 'notícias falsas', 'whatsapp', 'desinformação'],
  authors: [{ name: 'Verdade ou Fake' }],
  openGraph: {
    title: 'Verdade ou Fake? | Verificador de Fatos',
    description: 'Verifique se aquela notícia ou corrente de WhatsApp é verdadeira em segundos.',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verdade ou Fake?',
    description: 'Verifique notícias e correntes de WhatsApp em segundos.',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#102a43',
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
