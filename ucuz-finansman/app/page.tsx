import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase'
import SiteLayout from '@/components/layout/SiteLayout'
import HeroSection from '@/components/home/HeroSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import BankRatesSection from '@/components/home/BankRatesSection'
import HowItWorks from '@/components/home/HowItWorks'
import type { HeroSlide, BankRate } from '@/types'

export const metadata: Metadata = {
  title: 'Ucuz Finansman | Tasarruf Finansmanı mı, Banka Kredisi mi?',
  description: 'Tasarruf finansmanı ile banka kredisini gerçek maliyet üzerinden karşılaştırın. Efektif faiz oranı (IRR) ile en avantajlı seçeneği keşfedin. Ücretsiz hesaplayın.',
  openGraph: {
    title: 'Ucuz Finansman | Tasarruf Finansmanı mı, Banka Kredisi mi?',
    description: 'Gerçek maliyet hesabı yapın. IRR ile iki finansman sistemini kıyaslayın.',
  },
}

const defaultSlides: HeroSlide[] = [
  {
    badge: 'Finansal Karar Analizi',
    baslik: 'Tasarruf Finansmanı mı, Banka Kredisi mi?',
    vurgu: 'Banka Kredisi mi?',
    aciklama: 'Gerçek maliyet hesabı yapın. Efektif faiz oranı (IRR) ile iki sistemi finansal olarak kıyaslayın.',
    stats: [
      { val: '100%', lbl: 'Ücretsiz' },
      { val: 'IRR', lbl: 'Gerçek Maliyet' },
      { val: '2 dk', lbl: 'Hızlı Analiz' },
    ],
  },
  {
    badge: 'Tasarruf Finansmanı',
    baslik: 'Peşinatsız Ev & Araç Edinimi',
    vurgu: 'Araç Edinimi',
    aciklama: 'Ödeme planınızı hesaplayın, teslim tarihinizi öğrenin ve tasarruf yolculuğunuzu planlayın.',
    stats: [
      { val: '%0', lbl: 'Peşinat Seçeneği' },
      { val: '120+', lbl: 'Ay Vade' },
      { val: 'Anlık', lbl: 'Hesaplama' },
    ],
  },
  {
    badge: 'Kredi Hesaplama',
    baslik: 'Banka Kredinizi Hesaplayın',
    vurgu: 'Hesaplayın',
    aciklama: 'Annüite formülü ile tam ödeme planı çıkarın, faiz dağılımını görün, kararınızı bilinçli verin.',
    stats: [
      { val: 'Tüm', lbl: 'Bankalar' },
      { val: 'Ayrıntılı', lbl: 'Plan Tablosu' },
      { val: 'Ücretsiz', lbl: 'Kullanım' },
    ],
  },
]

const defaultBankRates: BankRate[] = [
  { id: '1', banka_adi: 'Ziraat Bankası', logo_url: null, aylik_faiz: 2.29, yillik_faiz: 31.0, min_vade: 12, max_vade: 120, is_active: true, order_index: 1 },
  { id: '2', banka_adi: 'Halkbank', logo_url: null, aylik_faiz: 2.39, yillik_faiz: 32.5, min_vade: 12, max_vade: 120, is_active: true, order_index: 2 },
  { id: '3', banka_adi: 'Vakıfbank', logo_url: null, aylik_faiz: 2.45, yillik_faiz: 33.4, min_vade: 12, max_vade: 120, is_active: true, order_index: 3 },
  { id: '4', banka_adi: 'Garanti BBVA', logo_url: null, aylik_faiz: 2.49, yillik_faiz: 34.0, min_vade: 12, max_vade: 120, is_active: true, order_index: 4 },
  { id: '5', banka_adi: 'İş Bankası', logo_url: null, aylik_faiz: 2.55, yillik_faiz: 34.9, min_vade: 12, max_vade: 120, is_active: true, order_index: 5 },
  { id: '6', banka_adi: 'Yapı Kredi', logo_url: null, aylik_faiz: 2.60, yillik_faiz: 35.7, min_vade: 12, max_vade: 120, is_active: true, order_index: 6 },
]

async function getData() {
  try {
    const adminClient = createAdminClient()
    const [slidesRes, ratesRes, footerRes] = await Promise.all([
      adminClient.from('content').select('value').eq('key', 'hero_slides').single(),
      adminClient.from('bank_rates').select('*').eq('is_active', true).order('order_index'),
      adminClient.from('content').select('value').eq('key', 'footer_content').single(),
    ])
    return {
      slides: (slidesRes.data?.value as HeroSlide[]) ?? defaultSlides,
      bankRates: (ratesRes.data as BankRate[]) ?? defaultBankRates,
      footerContent: footerRes.data?.value ?? null,
    }
  } catch {
    return { slides: defaultSlides, bankRates: defaultBankRates, footerContent: null }
  }
}

export default async function HomePage() {
  const { slides, bankRates, footerContent } = await getData()

  return (
    <SiteLayout footerContent={footerContent as Parameters<typeof SiteLayout>[0]['footerContent']}>
      <HeroSection slides={slides} />
      <FeaturesSection />
      <BankRatesSection rates={bankRates} />
      <HowItWorks />
    </SiteLayout>
  )
}
