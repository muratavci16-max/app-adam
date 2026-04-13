import type { Metadata } from 'next'
import { Suspense } from 'react'
import SiteLayout from '@/components/layout/SiteLayout'
import KarsilastirmaClient from '@/components/hesaplama/KarsilastirmaClient'

export const metadata: Metadata = {
  title: 'Karşılaştırma Analizi — Tasarruf Finansmanı vs Banka Kredisi',
  description: 'Tasarruf finansmanı ile banka kredisini efektif faiz oranı (IRR) bazında karşılaştırın. Hangisi gerçekten daha ucuz? Bilimsel analiz ile karar verin.',
  keywords: ['IRR hesaplama', 'efektif faiz', 'tasarruf finansmanı kredi karşılaştırma', 'gerçek maliyet'],
  openGraph: {
    title: 'TF vs Kredi Karşılaştırma | Ucuz Finansman',
    description: 'IRR bazlı finansman karşılaştırma analizi. Hangisi daha ucuz?',
  },
}

export default function KarsilastirmaPage() {
  return (
    <SiteLayout>
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>}>
        <KarsilastirmaClient />
      </Suspense>
    </SiteLayout>
  )
}
