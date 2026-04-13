'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toast'
import { AdminCard, AdminSectionTitle, inputCls, labelCls, btnPrimary, btnDanger } from './AdminCard'
import type { BankRate } from '@/types'

const emptyRate: Omit<BankRate, 'id'> = {
  banka_adi: '',
  logo_url: null,
  aylik_faiz: 2.49,
  yillik_faiz: 34.0,
  min_vade: 12,
  max_vade: 120,
  is_active: true,
  order_index: 0,
}

export default function KomisyonlarAdmin() {
  const [rates, setRates] = useState<BankRate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newRate, setNewRate] = useState({ ...emptyRate })

  useEffect(() => {
    supabase.from('bank_rates').select('*').order('order_index')
      .then((res) => { setRates((res.data as BankRate[]) ?? []); setLoading(false) })
  }, [])

  const saveRate = async (rate: BankRate) => {
    setSaving(rate.id)
    const { error } = await supabase.from('bank_rates').update(rate).eq('id', rate.id)
    setSaving(null)
    if (error) showToast('Hata: ' + error.message, 'error')
    else showToast('Güncellendi', 'success')
  }

  const deleteRate = async (id: string) => {
    await supabase.from('bank_rates').delete().eq('id', id)
    setRates(prev => prev.filter(r => r.id !== id))
    showToast('Silindi', 'success')
  }

  const createRate = async () => {
    const yillik = ((Math.pow(1 + newRate.aylik_faiz / 100, 12) - 1) * 100)
    const { data, error } = await supabase.from('bank_rates').insert({ ...newRate, yillik_faiz: yillik }).select().single()
    if (error) { showToast('Hata: ' + error.message, 'error'); return }
    setRates(prev => [...prev, data as BankRate])
    setShowNew(false)
    setNewRate({ ...emptyRate })
    showToast('Banka eklendi', 'success')
  }

  const update = (id: string, field: keyof BankRate, val: string | number | boolean) => {
    setRates(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: val }
      if (field === 'aylik_faiz') {
        updated.yillik_faiz = (Math.pow(1 + (val as number) / 100, 12) - 1) * 100
      }
      return updated
    }))
  }

  if (loading) return <div className="text-center py-20 text-neutral-400 text-sm">Yükleniyor...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <AdminSectionTitle title="Banka Faiz Oranları" desc="Ana sayfada ve hesaplamalar bölümünde gösterilen banka oranları" />
        <button onClick={() => setShowNew(!showNew)} className={btnPrimary}>
          <Plus className="w-4 h-4" /> Banka Ekle
        </button>
      </div>

      {showNew && (
        <AdminCard>
          <h3 className="font-bold text-sm mb-4">Yeni Banka Ekle</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Banka Adı</label>
              <input className={inputCls} value={newRate.banka_adi} onChange={e => setNewRate(p => ({ ...p, banka_adi: e.target.value }))} placeholder="Ziraat Bankası" />
            </div>
            <div>
              <label className={labelCls}>Aylık Faiz (%)</label>
              <input type="number" step="0.01" className={inputCls} value={newRate.aylik_faiz} onChange={e => setNewRate(p => ({ ...p, aylik_faiz: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className={labelCls}>Min Vade (ay)</label>
              <input type="number" className={inputCls} value={newRate.min_vade} onChange={e => setNewRate(p => ({ ...p, min_vade: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <label className={labelCls}>Max Vade (ay)</label>
              <input type="number" className={inputCls} value={newRate.max_vade} onChange={e => setNewRate(p => ({ ...p, max_vade: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <label className={labelCls}>Sıra</label>
              <input type="number" className={inputCls} value={newRate.order_index} onChange={e => setNewRate(p => ({ ...p, order_index: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createRate} className={btnPrimary}><Save className="w-4 h-4" /> Ekle</button>
            <button onClick={() => setShowNew(false)} className="text-sm text-neutral-500">İptal</button>
          </div>
        </AdminCard>
      )}

      <AdminCard className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500">Banka</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500">Aylık %</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500">Yıllık %</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500">Vade Aralığı</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500">Sıra</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500">Aktif</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rates.map(rate => (
              <tr key={rate.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                <td className="px-4 py-3">
                  <input className="border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs w-full" value={rate.banka_adi} onChange={e => update(rate.id, 'banka_adi', e.target.value)} />
                </td>
                <td className="px-4 py-3">
                  <input type="number" step="0.01" className="border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs w-20 text-center" value={rate.aylik_faiz} onChange={e => update(rate.id, 'aylik_faiz', parseFloat(e.target.value) || 0)} />
                </td>
                <td className="px-4 py-3 text-center text-xs text-neutral-500">%{rate.yillik_faiz.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-center">
                    <input type="number" className="border border-neutral-200 rounded-lg px-2 py-1.5 text-xs w-16 text-center" value={rate.min_vade} onChange={e => update(rate.id, 'min_vade', parseInt(e.target.value) || 1)} />
                    <span className="text-neutral-300 text-xs">—</span>
                    <input type="number" className="border border-neutral-200 rounded-lg px-2 py-1.5 text-xs w-16 text-center" value={rate.max_vade} onChange={e => update(rate.id, 'max_vade', parseInt(e.target.value) || 1)} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input type="number" className="border border-neutral-200 rounded-lg px-2 py-1.5 text-xs w-12 text-center mx-auto block" value={rate.order_index} onChange={e => update(rate.id, 'order_index', parseInt(e.target.value) || 0)} />
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={rate.is_active} onChange={e => update(rate.id, 'is_active', e.target.checked)} className="rounded accent-primary-600 cursor-pointer" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 justify-end">
                    <button onClick={() => deleteRate(rate.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => saveRate(rate)} disabled={saving === rate.id} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 disabled:opacity-50">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminCard>
    </div>
  )
}
