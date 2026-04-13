import type { Metadata } from 'next'
import './globals.css'
import { ToastContainer } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: {
    default: 'Ucuz Finansman | Tasarruf Finansmanı & Kredi Karşılaştırma',
    template: '%s | Ucuz Finansman',
  },
  description:
    'Tasarruf finansmanı ile banka kredisini karşılaştırın. Efektif faiz oranı (IRR) hesaplayın, gerçek maliyeti öğrenin. Türkiye\'nin en kapsamlı finansman hesaplama aracı.',
  keywords: ['tasarruf finansmanı', 'banka kredisi', 'kredi hesaplama', 'IRR hesaplama', 'konut finansmanı', 'araç finansmanı', 'ucuz finansman'],
  authors: [{ name: 'Ucuz Finansman' }],
  creator: 'Ucuz Finansman',
  publisher: 'Ucuz Finansman',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ucuzfinansman.com'),
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Ucuz Finansman',
    title: 'Ucuz Finansman | Tasarruf Finansmanı & Kredi Karşılaştırma',
    description: 'Tasarruf finansmanı ile banka kredisini karşılaştırın. Efektif faiz oranı ile gerçek maliyeti hesaplayın.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ucuz Finansman',
    description: 'Tasarruf finansmanı ile banka kredisini karşılaştırın.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <body className="min-h-full flex flex-col bg-neutral-50">
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
