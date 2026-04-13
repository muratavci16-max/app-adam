import type { Metadata } from 'next'
import SiteLayout from '@/components/layout/SiteLayout'
import AuthClient from '@/components/auth/AuthClient'

export const metadata: Metadata = {
  title: 'Giriş Yap',
  description: 'Ucuz Finansman hesabınıza giriş yapın, hesaplamalarınızı kaydedin.',
  robots: { index: false, follow: false },
}

export default function GirisPage() {
  return (
    <SiteLayout>
      <AuthClient mode="giris" />
    </SiteLayout>
  )
}
