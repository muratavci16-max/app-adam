'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, GripVertical } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toast'
import { AdminCard, AdminSectionTitle, inputCls, labelCls, btnPrimary, btnDanger } from './AdminCard'
import type { HeroSlide } from '@/types'

const empty: HeroSlide = { badge: '', baslik: '', vurgu: '', aciklama: '', stats: [] }

export default function SliderAdmin() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('content').select('value').eq('key', 'hero_slides').single()
      .then((res) => { if (res.data?.value) setSlides(res.data.value as HeroSlide[]) })
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('content')
      .upsert({ key: 'hero_slides', value: slides, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) showToast('Kaydedilemedi: ' + error.message, 'error')
    else showToast('Slider kaydedildi', 'success')
  }

  const update = (idx: number, field: keyof HeroSlide, val: string) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  const addStat = (idx: number) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, stats: [...(s.stats ?? []), { val: '', lbl: '' }] } : s))
  }

  const updateStat = (sIdx: number, stIdx: number, field: 'val' | 'lbl', val: string) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== sIdx) return s
      const stats = (s.stats ?? []).map((st, j) => j === stIdx ? { ...st, [field]: val } : st)
      return { ...s, stats }
    }))
  }

  const removeStat = (sIdx: number, stIdx: number) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== sIdx) return s
      return { ...s, stats: (s.stats ?? []).filter((_, j) => j !== stIdx) }
    }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <AdminSectionTitle title="Hero Slider" desc="Ana sayfadaki slider içeriklerini düzenleyin" />

      <div className="space-y-4">
        {slides.map((slide, idx) => (
          <AdminCard key={idx}>
            <div className="flex items-start gap-3 mb-4">
              <GripVertical className="w-4 h-4 text-neutral-300 mt-1 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Badge (etiket)</label>
                    <input className={inputCls} value={slide.badge} onChange={e => update(idx, 'badge', e.target.value)} placeholder="Finansal Karar Analizi" />
                  </div>
                  <div>
                    <label className={labelCls}>Vurgulanan Kısım</label>
                    <input className={inputCls} value={slide.vurgu} onChange={e => update(idx, 'vurgu', e.target.value)} placeholder="Banka Kredisi mi?" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Başlık</label>
                  <input className={inputCls} value={slide.baslik} onChange={e => update(idx, 'baslik', e.target.value)} placeholder="Tasarruf Finansmanı mı, Banka Kredisi mi?" />
                </div>
                <div>
                  <label className={labelCls}>Açıklama</label>
                  <textarea className={inputCls + ' resize-none h-16'} value={slide.aciklama} onChange={e => update(idx, 'aciklama', e.target.value)} />
                </div>

                {/* Stats */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls}>İstatistikler</label>
                    <button onClick={() => addStat(idx)} className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Ekle
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(slide.stats ?? []).map((st, stIdx) => (
                      <div key={stIdx} className="flex gap-2 items-center">
                        <input className={inputCls + ' flex-1'} value={st.val} onChange={e => updateStat(idx, stIdx, 'val', e.target.value)} placeholder="100%" />
                        <input className={inputCls + ' flex-1'} value={st.lbl} onChange={e => updateStat(idx, stIdx, 'lbl', e.target.value)} placeholder="Ücretsiz" />
                        <button onClick={() => removeStat(idx, stIdx)} className="p-2 text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setSlides(prev => prev.filter((_, i) => i !== idx))} className="p-2 rounded-xl text-red-400 hover:bg-red-50 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </AdminCard>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setSlides(prev => [...prev, { ...empty }])}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-500 text-sm font-medium hover:border-primary-400 hover:text-primary-600 transition-all"
        >
          <Plus className="w-4 h-4" /> Yeni Slide Ekle
        </button>
        <button onClick={save} disabled={saving} className={btnPrimary}>
          <Save className="w-4 h-4" />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}
