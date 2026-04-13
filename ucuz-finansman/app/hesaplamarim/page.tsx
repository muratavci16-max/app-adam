import type { Metadata } from 'next'
import SiteLayout from '@/components/layout/SiteLayout'
import HesaplamarimClient from '@/components/auth/HesaplamarimClient'

export const metadata: Metadata = {
  title: 'Hesaplamalarım',
  description: 'Kaydettiğiniz finansman hesaplamalarınızı görüntüleyin.',
  robots: { index: false, follow: false },
}

export default function HesaplamarimPage() {
  return (
    <SiteLayout>
      <HesaplamarimClient />
    </SiteLayout>
  )
}
