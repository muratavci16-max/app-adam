import type { Metadata } from 'next'
import SiteLayout from '@/components/layout/SiteLayout'
import AuthClient from '@/components/auth/AuthClient'

export const metadata: Metadata = {
  title: 'Üye Ol',
  description: 'Ucuz Finansman\'a üye olun, hesaplamalarınızı kaydedin ve karşılaştırın.',
  robots: { index: false, follow: false },
}

export default function KayitPage() {
  return (
    <SiteLayout>
      <AuthClient mode="kayit" />
    </SiteLayout>
  )
}
