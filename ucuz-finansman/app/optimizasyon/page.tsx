import type { Metadata } from 'next'
import OptimizerClient from '@/components/optimizer/OptimizerClient'

export const metadata: Metadata = {
  title: 'TF Optimizer — En Uygun Vadeyi Bul | Ucuz Finansman',
  description:
    'Tasarruf finansmanı sözleşmeniz için en düşük toplam maliyete ulaşan vadeyi ve parametreleri hesaplayın. Mevzuat sınırları içinde 120 vadelik tam tarama.',
}

export default function OptimizasyonPage() {
  return <OptimizerClient />
}
