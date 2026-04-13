'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Calculator, ChevronDown, ChevronUp, TrendingDown } from 'lucide-react'
import { krediHesapla, formatTL, formatTL2, parseInput } from '@/lib/hesaplamalar'
import type { KrediParams, KrediSonuc } from '@/lib/hesaplamalar'
import { StatCard } from '@/components/ui/Card'
import AdBanner from '@/components/ui/AdBanner'

const DEFAULT_PARAMS: KrediParams = {
  tutar: 1_500_000,
  vadeAy: 120,
  aylikFaizPct: 2.49,
}

export default function KrediClient() {
  const searchParams = useSearchParams()

  const [params, setParams] = useState<KrediParams>(() => ({
    tutar: parseFloat(searchParams.get('tutar') ?? '') || DEFAULT_PARAMS.tutar,
    vadeAy: parseInt(searchParams.get('vade') ?? '') || DEFAULT_PARAMS.vadeAy,
    aylikFaizPct: parseFloat(searchParams.get('faiz') ?? '') || DEFAULT_PARAMS.aylikFaizPct,
  }))

  const [sonuc, setSonuc] = useState<KrediSonuc | null>(null)
  const [showAll, setShowAll] = useState(false)

  const hesapla = useCallback(() => {
    if (params.tutar > 0 && params.vadeAy > 0 && params.aylikFaizPct >= 0) {
      setSonuc(krediHesapla(params))
    }
  }, [params])

  useEffect(() => { hesapla() }, [hesapla])

  const inputClass = "w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition-all bg-white"
  const labelClass = "block text-xs font-semibold text-neutral-500 mb-1.5"

  const yillikFaiz = ((Math.pow(1 + params.aylikFaizPct / 100, 12) - 1) * 100).toFixed(2)
  const displayedRows = showAll ? sonuc?.rows : sonuc?.rows.slice(0, 24)

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Banner */}
      <div className="bg-gradient-to-r from-accent-800 to-accent-600 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 mb-2">
            <Calculator className="w-5 h-5 text-accent-300" />
            <span className="text-xs font-semibold text-accent-300 uppercase tracking-wide">Banka Kredisi</span>
          </div>
          <h1 className="text-white text-xl sm:text-2xl font-extrabold tracking-tight">Kredi Hesaplama</h1>
          <p className="text-accent-200 text-sm mt-1">Annüite formülü ile tam amortisman tablosu</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* LEFT — Form */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5">
              <h2 className="font-bold text-neutral-800 text-sm mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-accent-500 inline-block" />
                Kredi Parametreleri
              </h2>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Kredi Tutarı (Anapara)</label>
                  <div className="relative">
                    <input
                      type="text"
                      className={inputClass}
                      value={params.tutar.toLocaleString('tr-TR')}
                      onChange={e => setParams(p => ({ ...p, tutar: parseInput(e.target.value, false) }))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₺</span>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Vade</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="360"
                      className={inputClass}
                      value={params.vadeAy}
                      onChange={e => setParams(p => ({ ...p, vadeAy: parseInt(e.target.value) || 1 }))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">ay</span>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Aylık Faiz Oranı
                    <span className="ml-1.5 text-neutral-400 font-normal text-xs">(yıllık bileşik: %{yillikFaiz})</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={inputClass}
                      value={params.aylikFaizPct}
                      onChange={e => setParams(p => ({ ...p, aylikFaizPct: parseFloat(e.target.value) || 0 }))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Aylık faiz girin (yıllık değil)</p>
                </div>

                {/* Quick vade buttons */}
                <div>
                  <label className={labelClass}>Hızlı Vade Seçimi</label>
                  <div className="flex gap-2 flex-wrap">
                    {[12, 24, 36, 60, 84, 120].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setParams(p => ({ ...p, vadeAy: v }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          params.vadeAy === v
                            ? 'bg-accent-50 border-accent-300 text-accent-700'
                            : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        {v} ay
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <AdBanner placement="sidebar" />
          </div>

          {/* RIGHT — Sonuç */}
          {sonuc && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Aylık Taksit" value={formatTL(sonuc.aylikTaksit)} color="indigo" />
                <StatCard label="Toplam Ödeme" value={formatTL(sonuc.toplamOdeme)} color="blue" />
                <StatCard label="Toplam Faiz" value={formatTL(sonuc.toplamFaiz)} color="amber" />
                <StatCard
                  label="Faiz Oranı"
                  value={`%${params.aylikFaizPct}`}
                  sub={`Yıllık bileşik %${yillikFaiz}`}
                  color="blue"
                />
              </div>

              {/* Faiz oranı bilgi */}
              <div className="flex items-center gap-3 bg-accent-50 border border-accent-100 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-accent-800">
                    {params.vadeAy} Ay Vade · Aylık {formatTL(sonuc.aylikTaksit)}
                  </p>
                  <p className="text-xs text-accent-600 mt-0.5">
                    {formatTL(params.tutar)} anapara için toplam {formatTL(sonuc.toplamFaiz)} faiz (%{((sonuc.toplamFaiz / params.tutar) * 100).toFixed(1)} oranında)
                  </p>
                </div>
              </div>

              {/* Tablo */}
              <div className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                  <h3 className="font-bold text-neutral-800 text-sm">Amortisman Tablosu</h3>
                  <span className="text-xs text-neutral-400">{sonuc.rows.length} taksit</span>
                </div>
                <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                  <table className="payment-table">
                    <thead>
                      <tr>
                        <th>Taksit No</th>
                        <th className="text-right">Taksit</th>
                        <th className="text-right">Anapara</th>
                        <th className="text-right">Faiz</th>
                        <th className="text-right">Kalan Borç</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRows?.map(row => (
                        <tr key={row.no} className={row.isSon ? 'highlight-teslim' : ''}>
                          <td className="font-semibold">{row.no}</td>
                          <td className="text-right font-semibold">{formatTL2(row.taksit)}</td>
                          <td className="text-right text-success-700">{formatTL2(row.anapara)}</td>
                          <td className="text-right text-amber-700">{formatTL2(row.faiz)}</td>
                          <td className="text-right">{formatTL2(row.kalan)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sonuc.rows.length > 24 && (
                  <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      {showAll ? `${sonuc.rows.length} taksit gösteriliyor` : `24 / ${sonuc.rows.length} taksit`}
                    </span>
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-accent-600 hover:text-accent-800"
                    >
                      {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> Daha Az</> : <><ChevronDown className="w-3.5 h-3.5" /> Tümünü Göster</>}
                    </button>
                  </div>
                )}
              </div>

              <AdBanner placement="table_below" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
