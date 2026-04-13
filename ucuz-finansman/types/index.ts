import type { TasarrufParams, KrediParams, KarsilastirmaParams } from '@/lib/hesaplamalar'

export interface SavedPlan {
  id: string
  user_id: string
  name: string
  type: 'tasarruf' | 'kredi' | 'karsilastirma'
  params: TasarrufParams | KrediParams | KarsilastirmaParams
  result_snapshot?: {
    toplamOdeme?: number
    aylikTaksit?: number
    irrAylikPct?: number
    teslimTarih?: string
  }
  created_at: string
  updated_at: string
}

export interface ContentRow {
  key: string
  value: unknown
  updated_at: string
}

export interface Ad {
  id: string
  placement: string
  title: string | null
  description: string | null
  image_url: string | null
  link_url: string | null
  is_active: boolean
  order_index: number
  created_at: string
}

export interface HeroSlide {
  badge: string
  baslik: string
  vurgu: string
  aciklama: string
  stats?: { val: string; lbl: string }[]
}

export interface MenuItem {
  id: string
  label: string
  href: string
  icon?: string
  order_index: number
  is_active: boolean
}

export interface BankRate {
  id: string
  banka_adi: string
  logo_url: string | null
  aylik_faiz: number
  yillik_faiz: number
  min_vade: number
  max_vade: number
  is_active: boolean
  order_index: number
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image: string | null
  published: boolean
  published_at: string | null
  author_name: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  og_image: string | null
  schema_type: string | null
  reading_time: number | null
  category: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export interface FooterContent {
  yasal_uyari: string
  adres: string
  telefon: string
  email: string
  sosyal_medya: {
    twitter?: string
    instagram?: string
    facebook?: string
    linkedin?: string
    youtube?: string
  }
  hizli_linkler: { label: string; href: string }[]
}
