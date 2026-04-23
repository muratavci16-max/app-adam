import type { Metadata } from 'next'
import { Suspense } from 'react'
import SiteLayout from '@/components/layout/SiteLayout'
import OptimizerClient from '@/components/optimizer/OptimizerClient'

export const metadata: Metadata = {
  title: 'TF Optimizer — En Uygun Vadeyi Bul | Ucuz Finansman',
  description:
    'Tasarruf finansmanı sözleşmeniz için en düşük toplam maliyete ulaşan vadeyi ve parametreleri hesaplayın. Mevzuat sınırları içinde 120 vadelik tam tarama.',
}

export default function OptimizasyonPage() {
  return (
    <SiteLayout>
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>}>
        <OptimizerClient />
      </Suspense>
    </SiteLayout>
  )
}
