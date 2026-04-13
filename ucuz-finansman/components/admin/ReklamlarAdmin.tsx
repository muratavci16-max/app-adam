'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toast'
import { AdminCard, AdminSectionTitle, inputCls, labelCls, btnPrimary, btnDanger } from './AdminCard'
import type { Ad } from '@/types'

const PLACEMENTS = [
  { value: 'homepage_top', label: 'Anasayfa Üst' },
  { value: 'sidebar', label: 'Kenar Çubuğu' },
  { value: 'table_below', label: 'Tablo Altı' },
  { value: 'footer_top', label: 'Footer Üstü' },
]

const emptyAd: Omit<Ad, 'id' | 'created_at'> = {
  placement: 'homepage_top',
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  is_active: true,
  order_index: 0,
}

export default function ReklamlarAdmin() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [newAd, setNewAd] = useState({ ...emptyAd })
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    supabase.from('ads').select('*').order('order_index').then(({ data }) => {
      setAds((data as Ad[]) ?? [])
      setLoading(false)
    })
  }, [])

  const saveAd = async (ad: Ad) => {
    setSaving(ad.id)
    const { error } = await supabase.from('ads').update(ad).eq('id', ad.id)
    setSaving(null)
    if (error) showToast('Hata: ' + error.message, 'error')
    else showToast('Reklam güncellendi', 'success')
  }

  const deleteAd = async (id: string) => {
    const { error } = await supabase.from('ads').delete().eq('id', id)
    if (!error) {
      setAds(prev => prev.filter(a => a.id !== id))
      showToast('Reklam silindi', 'success')
    }
  }

  const createAd = async () => {
    const { data, error } = await supabase.from('ads').insert(newAd).select().single()
    if (error) { showToast('Hata: ' + error.message, 'error'); return }
    setAds(prev => [...prev, data as Ad])
    setNewAd({ ...emptyAd })
    setShowNew(false)
    showToast('Reklam oluşturuldu', 'success')
  }

  const updateLocal = (id: string, field: keyof Ad, val: string | boolean | number) => {
    setAds(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a))
  }

  if (loading) return <div className="text-center py-20 text-neutral-400 text-sm">Yükleniyor...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <AdminSectionTitle title="Reklam Alanları" desc="Site genelindeki reklam ve sponsor içerikleri" />
        <button onClick={() => setShowNew(!showNew)} className={btnPrimary}>
          <Plus className="w-4 h-4" /> Yeni Reklam
        </button>
      </div>

      {/* New ad form */}
      {showNew && (
        <AdminCard>
          <h3 className="font-bold text-sm text-neutral-800 mb-4">Yeni Reklam Ekle</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Alan</label>
              <select className={inputCls} value={newAd.placement} onChange={e => setNewAd(p => ({ ...p, placement: e.target.value }))}>
                {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Başlık</label>
              <input className={inputCls} value={newAd.title ?? ''} onChange={e => setNewAd(p => ({ ...p, title: e.target.value }))} placeholder="Reklam başlığı" />
            </div>
            <div>
              <label className={labelCls}>Link URL</label>
              <input className={inputCls} value={newAd.link_url ?? ''} onChange={e => setNewAd(p => ({ ...p, link_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className={labelCls}>Görsel URL</label>
              <input className={inputCls} value={newAd.image_url ?? ''} onChange={e => setNewAd(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Açıklama</label>
              <input className={inputCls} value={newAd.description ?? ''} onChange={e => setNewAd(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createAd} className={btnPrimary}><Save className="w-4 h-4" /> Kaydet</button>
            <button onClick={() => setShowNew(false)} className="text-sm text-neutral-500 hover:text-neutral-700">İptal</button>
          </div>
        </AdminCard>
      )}

      {/* Ad list */}
      <div className="space-y-3">
        {ads.length === 0 ? (
          <p className="text-center text-neutral-400 text-sm py-10">Henüz reklam alanı yok.</p>
        ) : ads.map(ad => (
          <AdminCard key={ad.id} className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelCls}>Alan</label>
                <select className={inputCls} value={ad.placement} onChange={e => updateLocal(ad.id, 'placement', e.target.value)}>
                  {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Başlık</label>
                <input className={inputCls} value={ad.title ?? ''} onChange={e => updateLocal(ad.id, 'title', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Sıra</label>
                <input type="number" className={inputCls} value={ad.order_index} onChange={e => updateLocal(ad.id, 'order_index', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className={labelCls}>Link URL</label>
                <input className={inputCls} value={ad.link_url ?? ''} onChange={e => updateLocal(ad.id, 'link_url', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Görsel URL</label>
                <input className={inputCls} value={ad.image_url ?? ''} onChange={e => updateLocal(ad.id, 'image_url', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Açıklama</label>
                <input className={inputCls} value={ad.description ?? ''} onChange={e => updateLocal(ad.id, 'description', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <button
                onClick={() => updateLocal(ad.id, 'is_active', !ad.is_active)}
                className={`flex items-center gap-2 text-xs font-semibold transition-colors ${ad.is_active ? 'text-success-600' : 'text-neutral-400'}`}
              >
                {ad.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {ad.is_active ? 'Aktif' : 'Pasif'}
              </button>
              <div className="flex gap-2">
                <button onClick={() => deleteAd(ad.id)} className={btnDanger}><Trash2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => saveAd(ad)} disabled={saving === ad.id} className={btnPrimary}>
                  <Save className="w-3.5 h-3.5" />
                  {saving === ad.id ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  )
}
