'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toast'
import { AdminCard, AdminSectionTitle, inputCls, labelCls, btnPrimary } from './AdminCard'

interface SiteContent {
  site_baslik: string
  site_aciklama: string
  anasayfa_baslik: string
  anasayfa_alt_baslik: string
  meta_keywords: string
}

const defaults: SiteContent = {
  site_baslik: 'Ucuz Finansman',
  site_aciklama: 'Tasarruf finansmanı ile banka kredisini karşılaştırın.',
  anasayfa_baslik: 'Tasarruf Finansmanı mı, Banka Kredisi mi?',
  anasayfa_alt_baslik: 'Gerçek maliyet hesabı yapın.',
  meta_keywords: 'tasarruf finansmanı, banka kredisi, IRR hesaplama',
}

export default function IcerikAdmin() {
  const [content, setContent] = useState<SiteContent>(defaults)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('content').select('value').eq('key', 'site_content').single()
      .then(({ data }) => { if (data?.value) setContent({ ...defaults, ...(data.value as SiteContent) }) })
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('content')
      .upsert({ key: 'site_content', value: content, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) showToast('Hata: ' + error.message, 'error')
    else showToast('İçerik kaydedildi', 'success')
  }

  const set = (field: keyof SiteContent, val: string) => setContent(p => ({ ...p, [field]: val }))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <AdminSectionTitle title="Site İçeriği" desc="Genel site başlıkları ve SEO meta bilgileri" />

      <AdminCard>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Site Başlığı</label>
            <input className={inputCls} value={content.site_baslik} onChange={e => set('site_baslik', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Site Açıklaması (Meta Description)</label>
            <textarea className={inputCls + ' resize-none h-20'} value={content.site_aciklama} onChange={e => set('site_aciklama', e.target.value)} />
            <p className="text-xs text-neutral-400 mt-1">{content.site_aciklama.length}/160 karakter</p>
          </div>
          <div>
            <label className={labelCls}>Anasayfa H1 Başlığı</label>
            <input className={inputCls} value={content.anasayfa_baslik} onChange={e => set('anasayfa_baslik', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Anasayfa Alt Başlığı</label>
            <input className={inputCls} value={content.anasayfa_alt_baslik} onChange={e => set('anasayfa_alt_baslik', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Meta Keywords (virgülle ayırın)</label>
            <input className={inputCls} value={content.meta_keywords} onChange={e => set('meta_keywords', e.target.value)} />
          </div>
        </div>
      </AdminCard>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className={btnPrimary}>
          <Save className="w-4 h-4" />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}
