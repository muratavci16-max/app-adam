'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toast'
import { AdminCard, AdminSectionTitle, inputCls, labelCls, btnPrimary } from './AdminCard'

interface FooterData {
  yasal_uyari: string
  adres: string
  telefon: string
  email: string
  sosyal_medya: Record<string, string>
  hizli_linkler: { label: string; href: string }[]
}

const defaults: FooterData = {
  yasal_uyari: 'Bu sitedeki hesaplamalar yalnızca bilgilendirme amaçlıdır.',
  adres: '',
  telefon: '',
  email: '',
  sosyal_medya: { twitter: '', instagram: '', facebook: '', linkedin: '' },
  hizli_linkler: [
    { label: 'Tasarruf Finansmanı', href: '/tasarruf-finansmani' },
    { label: 'Kredi Hesaplama', href: '/kredi-hesaplama' },
    { label: 'Karşılaştırma', href: '/karsilastirma' },
    { label: 'Blog', href: '/blog' },
  ],
}

export default function FooterAdmin() {
  const [data, setData] = useState<FooterData>(defaults)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('content').select('value').eq('key', 'footer_content').single()
      .then(({ data: d }) => { if (d?.value) setData({ ...defaults, ...(d.value as FooterData) }) })
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('content')
      .upsert({ key: 'footer_content', value: data, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) showToast('Hata: ' + error.message, 'error')
    else showToast('Footer kaydedildi', 'success')
  }

  const set = (field: keyof FooterData, val: string) => setData(p => ({ ...p, [field]: val }))
  const setSosyal = (platform: string, val: string) => setData(p => ({
    ...p, sosyal_medya: { ...p.sosyal_medya, [platform]: val }
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <AdminSectionTitle title="Footer Yönetimi" desc="Alt bölüm metinleri, iletişim bilgileri ve sosyal medya" />

      <AdminCard>
        <h3 className="font-bold text-sm text-neutral-800 mb-4">İletişim & Yasal</h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Yasal Uyarı / Copyright Metni</label>
            <textarea className={inputCls + ' resize-none h-20'} value={data.yasal_uyari} onChange={e => set('yasal_uyari', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>E-posta</label>
              <input className={inputCls} value={data.email} onChange={e => set('email', e.target.value)} placeholder="info@sirket.com" />
            </div>
            <div>
              <label className={labelCls}>Telefon</label>
              <input className={inputCls} value={data.telefon} onChange={e => set('telefon', e.target.value)} placeholder="+90 xxx xxx xx xx" />
            </div>
            <div>
              <label className={labelCls}>Adres</label>
              <input className={inputCls} value={data.adres} onChange={e => set('adres', e.target.value)} placeholder="İstanbul, Türkiye" />
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <h3 className="font-bold text-sm text-neutral-800 mb-4">Sosyal Medya</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(data.sosyal_medya).map(platform => (
            <div key={platform}>
              <label className={labelCls + ' capitalize'}>{platform}</label>
              <input className={inputCls} value={data.sosyal_medya[platform] ?? ''} onChange={e => setSosyal(platform, e.target.value)} placeholder={`https://${platform}.com/...`} />
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-neutral-800">Hızlı Linkler</h3>
          <button onClick={() => setData(p => ({ ...p, hizli_linkler: [...p.hizli_linkler, { label: '', href: '/' }] }))}
            className="text-xs text-primary-600 font-semibold flex items-center gap-1">
            <Plus className="w-3 h-3" /> Ekle
          </button>
        </div>
        <div className="space-y-2.5">
          {data.hizli_linkler.map((link, i) => (
            <div key={i} className="flex gap-3 items-center">
              <input className={inputCls + ' flex-1'} value={link.label} onChange={e => {
                const arr = [...data.hizli_linkler]; arr[i] = { ...arr[i], label: e.target.value }; setData(p => ({ ...p, hizli_linkler: arr }))
              }} placeholder="Etiket" />
              <input className={inputCls + ' flex-1'} value={link.href} onChange={e => {
                const arr = [...data.hizli_linkler]; arr[i] = { ...arr[i], href: e.target.value }; setData(p => ({ ...p, hizli_linkler: arr }))
              }} placeholder="/url" />
              <button onClick={() => setData(p => ({ ...p, hizli_linkler: p.hizli_linkler.filter((_, j) => j !== i) }))}
                className="p-2 text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </AdminCard>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className={btnPrimary}>
          <Save className="w-4 h-4" />
          {saving ? 'Kaydediliyor...' : 'Footer\'ı Kaydet'}
        </button>
      </div>
    </div>
  )
}
