'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2 } from 'lucide-react'

export default function BlogSidebarCalc() {
  const router = useRouter()
  const [tutar, setTutar] = useState('2000000')
  const [pesinat, setPesinat] = useState('400000')
  const [taksit, setTaksit] = useState('60000')

  const inputClass =
    'w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 bg-white'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({ tutar, pesinat, taksit })
    router.push(`/karsilastirma?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
          <BarChart2 className="w-3.5 h-3.5 text-primary-600" />
        </div>
        <h3 className="font-bold text-sm text-neutral-800">TF vs Banka Kredisi</h3>
      </div>
      <p className="text-[11px] text-neutral-400 mb-3 leading-relaxed">
        Aynı finansman için TF mi yoksa banka kredisi mi daha avantajlı? Hemen hesaplayın.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Finansman Tutarı (₺)</label>
          <input
            type="text"
            className={inputClass}
            value={parseInt(tutar).toLocaleString('tr-TR')}
            onChange={e => setTutar(e.target.value.replace(/\D/g, '') || '0')}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Peşinat (₺)</label>
          <input
            type="text"
            className={inputClass}
            value={parseInt(pesinat).toLocaleString('tr-TR')}
            onChange={e => setPesinat(e.target.value.replace(/\D/g, '') || '0')}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Aylık Taksit (₺)</label>
          <input
            type="text"
            className={inputClass}
            value={parseInt(taksit).toLocaleString('tr-TR')}
            onChange={e => setTaksit(e.target.value.replace(/\D/g, '') || '0')}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
        >
          Karşılaştır →
        </button>
      </form>
    </div>
  )
}
