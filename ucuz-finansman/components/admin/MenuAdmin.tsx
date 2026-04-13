'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toast'
import { AdminCard, AdminSectionTitle, inputCls, labelCls, btnPrimary } from './AdminCard'

interface MenuItem {
  id: string
  label: string
  href: string
  order_index: number
  is_active: boolean
}

export default function MenuAdmin() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('content').select('value').eq('key', 'nav_menu').single()
      .then((res) => { if (res.data?.value) setItems(res.data.value as MenuItem[]) })
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('content')
      .upsert({ key: 'nav_menu', value: items, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) showToast('Hata: ' + error.message, 'error')
    else showToast('Menü kaydedildi', 'success')
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      label: '',
      href: '/',
      order_index: prev.length,
      is_active: true,
    }])
  }

  const update = (id: string, field: keyof MenuItem, val: string | number | boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i))
  }

  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <AdminSectionTitle title="Menü Yönetimi" desc="Navigasyon menüsündeki linkleri düzenleyin" />

      <AdminCard>
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-neutral-400 text-sm text-center py-6">Menü öğesi yok. Ekleyin.</p>
          )}
          {items.sort((a, b) => a.order_index - b.order_index).map(item => (
            <div key={item.id} className="grid grid-cols-[1fr_1fr_50px_auto] gap-3 items-center">
              <div>
                <label className={labelCls}>Etiket</label>
                <input className={inputCls} value={item.label} onChange={e => update(item.id, 'label', e.target.value)} placeholder="Anasayfa" />
              </div>
              <div>
                <label className={labelCls}>URL</label>
                <input className={inputCls} value={item.href} onChange={e => update(item.id, 'href', e.target.value)} placeholder="/karsilastirma" />
              </div>
              <div>
                <label className={labelCls}>Sıra</label>
                <input type="number" className={inputCls} value={item.order_index} onChange={e => update(item.id, 'order_index', parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <input type="checkbox" checked={item.is_active} onChange={e => update(item.id, 'is_active', e.target.checked)} className="rounded accent-primary-600" title="Aktif" />
                <button onClick={() => remove(item.id)} className="p-2 rounded-xl text-red-400 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-5 pt-4 border-t border-neutral-100">
          <button onClick={addItem} className="inline-flex items-center gap-2 text-sm text-neutral-500 border-2 border-dashed border-neutral-200 px-4 py-2 rounded-xl hover:border-primary-400 hover:text-primary-600 transition-all">
            <Plus className="w-4 h-4" /> Öğe Ekle
          </button>
          <button onClick={save} disabled={saving} className={btnPrimary}>
            <Save className="w-4 h-4" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </AdminCard>
    </div>
  )
}
