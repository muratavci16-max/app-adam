'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { TrendingUp, Download, Save, Info, ChevronDown, ChevronUp, Gift } from 'lucide-react'
import { tasarrufHesapla, formatTL, formatTL2, parseInput } from '@/lib/hesaplamalar'
import type { TasarrufParams, TasarrufSonuc } from '@/lib/hesaplamalar'
import { StatCard } from '@/components/ui/Card'
import AdBanner from '@/components/ui/AdBanner'

const now = new Date()

const DEFAULT_PARAMS: TasarrufParams = {
  tutar: 2_000_000,
  pesinat: 400_000,
  basTaksit: 60_000,
  hizmetOranPct: 8.5,
  hizmetVade: 3,
  teslimatPct: 40,
  odemeTuru: 'esit',
  artisOrani: 5,
  artisSikligi: 12,
  baslangicAy: now.getMonth() + 1,
  baslangicYil: now.getFullYear(),
}

export default function TasarrufClient() {
  const searchParams = useSearchParams()

  const [params, setParams] = useState<TasarrufParams>(() => {
    const tutar = parseFloat(searchParams.get('tutar') ?? '') || DEFAULT_PARAMS.tutar
    const pesinat = parseFloat(searchParams.get('pesinat') ?? '') || DEFAULT_PARAMS.pesinat
    const taksit = parseFloat(searchParams.get('taksit') ?? '') || DEFAULT_PARAMS.basTaksit
    return { ...DEFAULT_PARAMS, tutar, pesinat, basTaksit: taksit }
  })

  const [sonuc, setSonuc] = useState<TasarrufSonuc | null>(null)
  const [showAll, setShowAll] = useState(false)

  const hesapla = useCallback(() => {
    setSonuc(tasarrufHesapla(params))
  }, [params])

  useEffect(() => { hesapla() }, [hesapla])

  const set = (key: keyof TasarrufParams, val: string | number) => {
    setParams(prev => ({ ...prev, [key]: val }))
  }

  const inputClass = "w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white"
  const labelClass = "block text-xs font-semibold text-neutral-500 mb-1.5"

  const AYLAR_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  const YEARS = Array.from({ length: 10 }, (_, i) => now.getFullYear() + i)

  const displayedRows = showAll ? sonuc?.rows : sonuc?.rows.slice(0, 24)

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Banner */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 mb-2">
            <TrendingUp className="w-5 h-5 text-primary-300" />
            <span className="text-xs font-semibold text-primary-300 uppercase tracking-wide">Tasarruf Finansmanı</span>
          </div>
          <h1 className="text-white text-xl sm:text-2xl font-extrabold tracking-tight">Ödeme Planı Hesaplama</h1>
          <p className="text-primary-200 text-sm mt-1">Teslim tarihinizi öğrenin, tam ödeme planınızı görün</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* LEFT — Form */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5">
              <h2 className="font-bold text-neutral-800 text-sm mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-primary-500 inline-block" />
                Finansman Parametreleri
              </h2>

              <div className="space-y-4">
                {/* Tutar */}
                <div>
                  <label className={labelClass}>Toplam Finansman Tutarı</label>
                  <div className="relative">
                    <input
                      type="text"
                      className={inputClass}
                      value={params.tutar.toLocaleString('tr-TR')}
                      onChange={e => set('tutar', parseInput(e.target.value, false))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₺</span>
                  </div>
                </div>

                {/* Peşinat */}
                <div>
                  <label className={labelClass}>Peşinat</label>
                  <div className="relative">
                    <input
                      type="text"
                      className={inputClass}
                      value={params.pesinat.toLocaleString('tr-TR')}
                      onChange={e => set('pesinat', parseInput(e.target.value, false))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₺</span>
                  </div>
                </div>

                {/* Başlangıç Taksit */}
                <div>
                  <label className={labelClass}>Başlangıç Aylık Taksit</label>
                  <div className="relative">
                    <input
                      type="text"
                      className={inputClass}
                      value={params.basTaksit.toLocaleString('tr-TR')}
                      onChange={e => set('basTaksit', parseInput(e.target.value, false))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₺</span>
                  </div>
                </div>

                {/* Hizmet bedeli */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Hizmet Bedeli Oranı</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={params.hizmetOranPct}
                        onChange={e => set('hizmetOranPct', parseFloat(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Hizmet Bedeli Vadesi</label>
                    <div className="relative">
                      <input
                        type="number"
                        className={inputClass}
                        value={params.hizmetVade}
                        onChange={e => set('hizmetVade', parseInt(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">ay</span>
                    </div>
                  </div>
                </div>

                {/* Teslimat eşiği */}
                <div>
                  <label className={labelClass}>
                    Teslimat Eşiği
                    <span className="ml-1.5 text-neutral-400 font-normal" title="Toplam tutarın yüzde kaçı ödendikten sonra teslim yapılır">
                      <Info className="w-3 h-3 inline" />
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className={inputClass}
                      value={params.teslimatPct}
                      onChange={e => set('teslimatPct', parseFloat(e.target.value) || 0)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
                  </div>
                </div>

                {/* Ödeme türü */}
                <div>
                  <label className={labelClass}>Ödeme Türü</label>
                  <div className="flex gap-2">
                    {(['esit', 'artisli'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set('odemeTuru', t)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          params.odemeTuru === t
                            ? 'bg-primary-50 border-primary-300 text-primary-700'
                            : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        {t === 'esit' ? 'Eşit Taksit' : 'Artışlı Taksit'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Artışlı parametreler */}
                {params.odemeTuru === 'artisli' && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div>
                      <label className={labelClass}>Artış Oranı</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          className={inputClass}
                          value={params.artisOrani}
                          onChange={e => set('artisOrani', parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Artış Sıklığı</label>
                      <div className="relative">
                        <input
                          type="number"
                          className={inputClass}
                          value={params.artisSikligi}
                          onChange={e => set('artisSikligi', parseInt(e.target.value) || 1)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">ay</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Başlangıç tarihi */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Başlangıç Ayı</label>
                    <select
                      className={inputClass}
                      value={params.baslangicAy}
                      onChange={e => set('baslangicAy', parseInt(e.target.value))}
                    >
                      {AYLAR_TR.map((a, i) => <option key={i+1} value={i+1}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Başlangıç Yılı</label>
                    <select
                      className={inputClass}
                      value={params.baslangicYil}
                      onChange={e => set('baslangicYil', parseInt(e.target.value))}
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Ad banner */}
            <AdBanner placement="sidebar" />
          </div>

          {/* RIGHT — Sonuç */}
          {sonuc && (
            <div className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Toplam Ödeme" value={formatTL(sonuc.toplamOdeme)} color="blue" />
                <StatCard label="Taksit Toplamı" value={formatTL(sonuc.toplamTaksit)} sub="Peşinat dahil" color="indigo" />
                <StatCard label="Hizmet Bedeli" value={formatTL(sonuc.hizmetToplam)} color="amber" />
                <StatCard
                  label="Teslim Tarihi"
                  value={sonuc.teslimAy ? `${new Date(0, (sonuc.teslimAy ?? 1) - 1).toLocaleString('tr-TR', {month: 'long'})} ${sonuc.teslimYil}` : '—'}
                  sub={`${sonuc.teslimVadeNo}. vadede`}
                  color="green"
                />
              </div>

              {/* Teslim highlight */}
              {sonuc.teslimAy && (
                <div className="flex items-center gap-3 bg-success-50 border border-success-200 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-success-800">
                      Tahmini Teslim: {AYLAR_TR[(sonuc.teslimAy ?? 1) - 1]} {sonuc.teslimYil}
                    </p>
                    <p className="text-xs text-success-600 mt-0.5">
                      {sonuc.teslimVadeNo}. vadede • Toplam {formatTL(sonuc.toplamOdeme)} ödeme
                    </p>
                  </div>
                </div>
              )}

              {/* Ödeme planı tablosu */}
              <div className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                  <h3 className="font-bold text-neutral-800 text-sm">Ödeme Planı Tablosu</h3>
                  <span className="text-xs text-neutral-400">{sonuc.vade} vade</span>
                </div>
                <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                  <table className="payment-table">
                    <thead>
                      <tr>
                        <th>Vade</th>
                        <th>Tarih</th>
                        <th className="text-right">Taksit</th>
                        <th className="text-right">Toplam Ödenen</th>
                        <th className="text-right">Kalan Borç</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRows?.map(row => (
                        <tr
                          key={row.no}
                          className={row.isTeslim ? 'highlight-teslim' : row.isArtis ? 'highlight-artis' : ''}
                        >
                          <td className="font-semibold">{row.no}</td>
                          <td>{row.tarih}</td>
                          <td className="text-right font-semibold">
                            {formatTL2(row.taksit)}
                            {row.isArtis && (
                              <span className="ml-1.5 text-[0.65rem] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">↑ Artış</span>
                            )}
                          </td>
                          <td className="text-right">{formatTL2(row.odenenmis)}</td>
                          <td className="text-right">{formatTL2(row.kalan)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(sonuc.rows.length > 24) && (
                  <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      {showAll ? `Tüm ${sonuc.rows.length} vade gösteriliyor` : `${Math.min(24, sonuc.rows.length)} / ${sonuc.rows.length} vade gösteriliyor`}
                    </span>
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> Daha Az Göster</> : <><ChevronDown className="w-3.5 h-3.5" /> Tümünü Göster</>}
                    </button>
                  </div>
                )}
              </div>

              {/* Ad banner */}
              <AdBanner placement="table_below" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
