import type { Metadata } from 'next'
import { Suspense } from 'react'
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
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>}>
        <AuthClient mode="giris" />
      </Suspense>
    </SiteLayout>
  )
}
