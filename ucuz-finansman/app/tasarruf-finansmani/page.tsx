import type { Metadata } from 'next'
import { Suspense } from 'react'
import SiteLayout from '@/components/layout/SiteLayout'
import TasarrufClient from '@/components/hesaplama/TasarrufClient'

export const metadata: Metadata = {
  title: 'Tasarruf Finansmanı Hesaplama',
  description: 'Tasarruf finansmanı ödeme planınızı hesaplayın. Aylık taksit, hizmet bedeli, teslim tarihi ve toplam maliyet analizini görün. Eşit ve artışlı taksit seçenekleri.',
  keywords: ['tasarruf finansmanı hesaplama', 'TF ödeme planı', 'teslim tarihi hesaplama', 'konut finansmanı'],
  openGraph: {
    title: 'Tasarruf Finansmanı Hesaplama | Ucuz Finansman',
    description: 'Aylık taksitinizi girin, teslim tarihinizi ve tam ödeme planınızı anında görün.',
  },
}

export default function TasarrufPage() {
  return (
    <SiteLayout>
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>}>
        <TasarrufClient />
      </Suspense>
    </SiteLayout>
  )
}
