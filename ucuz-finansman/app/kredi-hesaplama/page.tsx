import type { Metadata } from 'next'
import { Suspense } from 'react'
import SiteLayout from '@/components/layout/SiteLayout'
import KrediClient from '@/components/hesaplama/KrediClient'

export const metadata: Metadata = {
  title: 'Banka Kredisi Hesaplama',
  description: 'Banka kredi taksitinizi ve ödeme planınızı hesaplayın. Annüite formülü ile tam amortisman tablosu, faiz ve anapara dağılımını görün.',
  keywords: ['kredi hesaplama', 'banka kredisi', 'taksit hesaplama', 'konut kredisi', 'araç kredisi'],
  openGraph: {
    title: 'Banka Kredisi Hesaplama | Ucuz Finansman',
    description: 'Aylık taksitinizi ve tam ödeme planınızı annüite formülü ile hesaplayın.',
  },
}

export default function KrediPage() {
  return (
    <SiteLayout>
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent-200 border-t-accent-600 rounded-full animate-spin" /></div>}>
        <KrediClient />
      </Suspense>
    </SiteLayout>
  )
}
