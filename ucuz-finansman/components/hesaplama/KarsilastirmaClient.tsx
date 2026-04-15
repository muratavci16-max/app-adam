'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { BarChart2, TrendingUp, Building2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { karsilastirmaHesapla, formatTL, parseInput } from '@/lib/hesaplamalar'
import type { KarsilastirmaParams, KarsilastirmaSonuc } from '@/lib/hesaplamalar'
import { StatCard } from '@/components/ui/Card'
import AdBanner from '@/components/ui/AdBanner'

// SSR hatası almamak için dinamik import
const KarsilastirmaChart = dynamic(() => import('./KarsilastirmaChart'), { ssr: false })

const DEFAULT: KarsilastirmaParams = {
  tutar: 2_000_000,
  pesinat: 400_000,
  orgPct: 8.5,
  taksit0: 60_000,
  takTuru: 'sabit',
  artisAy: 0,
  yeniTaksit: 0,
  krFaizAylik: 2.49,
  mevduatYillik: 40,
}

export default function KarsilastirmaClient() {
  const searchParams = useSearchParams()

  const [params, setParams] = useState<KarsilastirmaParams>(() => ({
    tutar: parseFloat(searchParams.get('tutar') ?? '') || DEFAULT.tutar,
    pesinat: parseFloat(searchParams.get('pesinat') ?? '') || DEFAULT.pesinat,
    orgPct: parseFloat(searchParams.get('org_pct') ?? '') || DEFAULT.orgPct,
    taksit0: parseFloat(searchParams.get('taksit') ?? '') || DEFAULT.taksit0,
    takTuru: 'sabit',
    artisAy: 0,
    yeniTaksit: 0,
    krFaizAylik: parseFloat(searchParams.get('kr_faiz') ?? '') || DEFAULT.krFaizAylik,
    mevduatYillik: parseFloat(searchParams.get('mevduat_y') ?? '') || DEFAULT.mevduatYillik,
  }))

  const [showAllRows, setShowAllRows] = useState(false)
  const [kalanVadeStr, setKalanVadeStr] = useState<string>('')
  const userEditedKalanVade = useRef(false)

  const [sonuc, setSonuc] = useState<KarsilastirmaSonuc | null>(null)

  const hesapla = useCallback(() => {
    try {
      setSonuc(karsilastirmaHesapla(params))
    } catch { /* ignore */ }
  }, [params])

  useEffect(() => { hesapla() }, [hesapla])

  // Sync kalanVadeStr from auto-calc when user hasn't overridden
  useEffect(() => {
    if (sonuc && !userEditedKalanVade.current) {
      setKalanVadeStr(sonuc.kalanVade.toString())
    }
  }, [sonuc])

  const set = (key: keyof KarsilastirmaParams, val: string | number) => {
    setParams(prev => ({ ...prev, [key]: val }))
  }

  const handleKalanVadeChange = (val: string) => {
    setKalanVadeStr(val)
    const n = parseInt(val) || 0
    userEditedKalanVade.current = n > 0
    setParams(prev => ({ ...prev, kalanVadeOverride: n > 0 ? n : undefined }))
  }

  const resetKalanVade = () => {
    userEditedKalanVade.current = false
    setParams(prev => ({ ...prev, kalanVadeOverride: undefined }))
  }

  const inputClass = "w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white"
  const labelClass = "block text-xs font-semibold text-neutral-500 mb-1.5"

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Banner */}
      <div className="py-8 px-4" style={{ background: 'linear-gradient(135deg, #2d1b69 0%, #5b21b6 50%, #7c3aed 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 mb-2">
            <BarChart2 className="w-5 h-5 text-purple-300" />
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">IRR Analizi</span>
          </div>
          <h1 className="text-white text-xl sm:text-2xl font-extrabold tracking-tight">Karşılaştırma Analizi</h1>
          <p className="text-purple-200 text-sm mt-1">Tasarruf Finansmanı vs Banka Kredisi — Gerçek maliyet karşılaştırması</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ad banner top */}
        <AdBanner placement="homepage_top" className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          {/* LEFT — Form */}
          <div className="space-y-4">
            {/* TF parametreleri */}
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5">
              <h2 className="font-bold text-neutral-800 text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success-600" />
                Tasarruf Finansmanı Tarafı
              </h2>
              <div className="space-y-3.5">
                <div>
                  <label className={labelClass}>Toplam Finansman Tutarı</label>
                  <div className="relative">
                    <input type="text" className={inputClass} value={params.tutar.toLocaleString('tr-TR')}
                      onChange={e => set('tutar', parseInput(e.target.value, false))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₺</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Peşinat</label>
                  <div className="relative">
                    <input type="text" className={inputClass} value={params.pesinat.toLocaleString('tr-TR')}
                      onChange={e => set('pesinat', parseInput(e.target.value, false))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₺</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Organizasyon / Hizmet Ücreti</label>
                  <div className="relative">
                    <input type="number" step="0.1" className={inputClass} value={params.orgPct}
                      onChange={e => set('orgPct', parseFloat(e.target.value) || 0)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Taksit Türü</label>
                  <div className="flex gap-2">
                    {(['sabit', 'artisli'] as const).map(t => (
                      <button key={t} type="button"
                        onClick={() => set('takTuru', t)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${params.takTuru === t ? 'bg-success-50 border-success-300 text-success-700' : 'bg-white border-neutral-200 text-neutral-500'}`}>
                        {t === 'sabit' ? 'Sabit' : 'Artışlı'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Başlangıç Taksit</label>
                  <div className="relative">
                    <input type="text" className={inputClass} value={params.taksit0.toLocaleString('tr-TR')}
                      onChange={e => set('taksit0', parseInput(e.target.value, false))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₺</span>
                  </div>
                </div>
                {params.takTuru === 'artisli' && (
                  <div className="grid grid-cols-2 gap-3 bg-amber-50 p-3 rounded-xl">
                    <div>
                      <label className={labelClass}>Artış Başlangıç Ayı</label>
                      <input type="number" className={inputClass} value={params.artisAy}
                        onChange={e => set('artisAy', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className={labelClass}>Yeni Taksit</label>
                      <div className="relative">
                        <input type="text" className={inputClass} value={params.yeniTaksit.toLocaleString('tr-TR')}
                          onChange={e => set('yeniTaksit', parseInput(e.target.value, false))} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₺</span>
                      </div>
                    </div>
                  </div>
                )}
                {sonuc && (
                  <div className="bg-primary-50 border border-primary-200 rounded-xl px-3.5 py-2.5">
                    <p className="text-xs font-semibold text-primary-700">Otomatik Teslimat Ayı</p>
                    <p className="text-sm font-extrabold text-primary-900 mt-0.5">
                      {sonuc.teslimAy}. Ay
                    </p>
                    <p className="text-xs text-primary-500 mt-0.5">
                      Min. 6. ay · Tutarın %40'ına ulaşıldığında (hizmet bedeli hariç)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Kredi parametreleri */}
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5">
              <h2 className="font-bold text-neutral-800 text-sm mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                Banka Kredisi Tarafı
              </h2>
              <div className="space-y-3.5">
                <div>
                  <label className={labelClass}>Banka Aylık Faiz Oranı</label>
                  <div className="relative">
                    <input type="number" step="0.01" className={inputClass} value={params.krFaizAylik}
                      onChange={e => set('krFaizAylik', parseFloat(e.target.value) || 0)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Alternatif Mevduat Getirisi (Yıllık)</label>
                  <div className="relative">
                    <input type="number" step="0.5" className={inputClass} value={params.mevduatYillik}
                      onChange={e => set('mevduatYillik', parseFloat(e.target.value) || 0)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Tasarruf alternatifinizin getirisi</p>
                </div>
                <div>
                  <label className={labelClass}>
                    Kalan Vade (Teslim Sonrası)
                    {userEditedKalanVade.current && (
                      <button onClick={resetKalanVade} className="ml-2 text-xs text-primary-500 hover:underline font-normal">Sıfırla</button>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      className={inputClass}
                      value={kalanVadeStr}
                      onChange={e => handleKalanVadeChange(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">ay</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Otomatik: vade − teslimat ayı</p>
                </div>
              </div>
            </div>

            <AdBanner placement="sidebar" />
          </div>

          {/* RIGHT — Sonuçlar */}
          {sonuc && (
            <div className="space-y-5">
              {/* Verdict */}
              {!isNaN(sonuc.irrAylikPct) && (
                <div className={`flex items-center gap-4 p-5 rounded-2xl border-2 ${sonuc.tfDahaAvantajli ? 'bg-success-50 border-success-300' : 'bg-blue-50 border-blue-300'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${sonuc.tfDahaAvantajli ? 'bg-success-100' : 'bg-blue-100'}`}>
                    {sonuc.tfDahaAvantajli ? <TrendingUp className="w-6 h-6 text-success-600" /> : <Building2 className="w-6 h-6 text-blue-600" />}
                  </div>
                  <div>
                    <p className={`text-base font-extrabold ${sonuc.tfDahaAvantajli ? 'text-success-800' : 'text-blue-800'}`}>
                      {sonuc.tfDahaAvantajli
                        ? '✓ Tasarruf Finansmanı Daha Avantajlı'
                        : '✓ Banka Kredisi Daha Uygun'}
                    </p>
                    <p className={`text-sm mt-0.5 ${sonuc.tfDahaAvantajli ? 'text-success-600' : 'text-blue-600'}`}>
                      {sonuc.krDahaUcuz
                        ? `Banka alternatifiniz ${formatTL(sonuc.fark)} daha ucuz`
                        : `TF sistemi ${formatTL(sonuc.fark)} daha avantajlı`
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* IRR & stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="TF Efektif Faiz (IRR)"
                  value={isNaN(sonuc.irrAylikPct) ? '—' : `%${sonuc.irrAylikPct.toFixed(2)}`}
                  sub="Aylık"
                  color={sonuc.tfDahaAvantajli ? 'green' : 'amber'}
                />
                <StatCard
                  label="IRR Yıllık Bileşik"
                  value={isNaN(sonuc.irrYillik) ? '—' : `%${sonuc.irrYillik.toFixed(1)}`}
                  sub="vs banka faizi"
                  color={sonuc.tfDahaAvantajli ? 'green' : 'amber'}
                />
                <StatCard label="TF Toplam Maliyet" value={formatTL(sonuc.tfToplam)} color="blue" />
                <StatCard label="Kredi Alt. Toplam" value={formatTL(sonuc.altToplam)} color="indigo" />
              </div>

              {/* Detaylar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* TF tarafı */}
                <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5">
                  <h3 className="font-bold text-sm text-neutral-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success-600" />
                    Tasarruf Finansmanı
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      ['Vade', `${sonuc.vade} ay`],
                      ['Teslimat Ayı', `${sonuc.teslimAy}. ay`],
                      ['Peşinat', formatTL(params.pesinat)],
                      ['Org. Bedeli', formatTL(sonuc.orgBedeli)],
                      ['Toplam Maliyet', formatTL(sonuc.tfToplam)],
                      ['IRR (Aylık)', isNaN(sonuc.irrAylikPct) ? '—' : `%${sonuc.irrAylikPct.toFixed(2)}`],
                      ['IRR (Yıllık)', isNaN(sonuc.irrYillik) ? '—' : `%${sonuc.irrYillik.toFixed(2)}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">{k}</span>
                        <span className="font-semibold text-neutral-800">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kredi tarafı */}
                <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5">
                  <h3 className="font-bold text-sm text-neutral-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    Kredi Alternatifi
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      ['Birikim (teslimde)', formatTL(sonuc.birikilenToplam)],
                      ['Kredi İhtiyacı', formatTL(sonuc.krediIhtiyaci)],
                      ['Kalan Vade', `${sonuc.kalanVade} ay`],
                      ['Kredi Taksiti', sonuc.krTaksit > 0 ? formatTL(sonuc.krTaksit) : '—'],
                      ['Kredi Faizi', formatTL(sonuc.krFaizToplam)],
                      ['Toplam Maliyet', formatTL(sonuc.altToplam)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">{k}</span>
                        <span className="font-semibold text-neutral-800">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Karşılaştırmalı Ödeme Planı Tablosu */}
              <div className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                  <h3 className="font-bold text-sm text-neutral-800">Karşılaştırmalı Ödeme Planı</h3>
                  <button
                    onClick={() => setShowAllRows(v => !v)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    {showAllRows ? <><ChevronUp className="w-3.5 h-3.5" />Daralt</> : <><ChevronDown className="w-3.5 h-3.5" />Tümünü Gör ({sonuc.rows.length} ay + 3 başlangıç)</>}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-100">
                        <th className="px-4 py-2.5 text-left font-semibold text-neutral-500">Ay</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-success-600">TF Taksit</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-success-600">TF Kümülatif</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-blue-600">Alt. Taksit</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-blue-600">Alt. Kümülatif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 3 başlangıç satırı: Peşinat / Taksit (Ay 1) / Org. Bedeli */}
                      {[
                        { label: 'Peşinat', tf: params.pesinat, tfK: params.pesinat },
                        { label: '1. Taksit', tf: sonuc.rows[0]?.tfTaksit ?? 0, tfK: params.pesinat + (sonuc.rows[0]?.tfTaksit ?? 0) },
                        { label: 'Org. Bedeli', tf: sonuc.orgBedeli, tfK: sonuc.rows[0]?.tfKumul ?? params.pesinat + sonuc.orgBedeli },
                      ].map((r, i) => (
                        <tr key={`init-${i}`} className="border-b border-neutral-100 bg-neutral-50/40">
                          <td className="px-4 py-2">
                            <span className="text-[10px] font-semibold bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded">1</span>
                            <span className="ml-1.5 text-xs font-semibold text-neutral-600">{r.label}</span>
                          </td>
                          <td className="px-4 py-2 text-right text-neutral-700 text-xs">{Math.round(r.tf).toLocaleString('tr-TR')} ₺</td>
                          <td className="px-4 py-2 text-right text-success-700 text-xs">{Math.round(r.tfK).toLocaleString('tr-TR')} ₺</td>
                          <td className="px-4 py-2 text-right text-neutral-300 text-xs">—</td>
                          <td className="px-4 py-2 text-right text-neutral-300 text-xs">—</td>
                        </tr>
                      ))}
                      {/* Ay 2'den itibaren normal satırlar */}
                      {(showAllRows ? sonuc.rows.slice(1) : sonuc.rows.slice(1, 25)).map(row => (
                        <tr
                          key={row.ay}
                          className={`border-b border-neutral-50 ${row.isTeslim ? 'bg-amber-50 font-bold' : 'hover:bg-neutral-50/60'}`}
                        >
                          <td className="px-4 py-2">
                            <span className="font-semibold text-neutral-700">{row.ay}</span>
                            {row.isTeslim && <span className="ml-1.5 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">Teslimat</span>}
                          </td>
                          <td className="px-4 py-2 text-right text-neutral-700">{Math.round(row.tfTaksit).toLocaleString('tr-TR')} ₺</td>
                          <td className="px-4 py-2 text-right text-success-700">{Math.round(row.tfKumul).toLocaleString('tr-TR')} ₺</td>
                          <td className="px-4 py-2 text-right text-neutral-700">{Math.round(row.altTaksit).toLocaleString('tr-TR')} ₺</td>
                          <td className="px-4 py-2 text-right text-blue-700">{Math.round(row.altKumul).toLocaleString('tr-TR')} ₺</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-50 border-t border-neutral-200">
                        <td className="px-4 py-2.5 font-bold text-neutral-700">Toplam</td>
                        <td className="px-4 py-2.5" />
                        <td className="px-4 py-2.5 text-right font-bold text-success-700">{Math.round(sonuc.tfToplam).toLocaleString('tr-TR')} ₺</td>
                        <td className="px-4 py-2.5" />
                        <td className="px-4 py-2.5 text-right font-bold text-blue-700">{Math.round(sonuc.altToplam).toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5">
                <h3 className="font-bold text-sm text-neutral-800 mb-4">Kümülatif Ödeme Karşılaştırması</h3>
                <KarsilastirmaChart params={params} sonuc={sonuc} />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700">
                  Bu analiz yalnızca bilgilendirme amaçlıdır. Gerçek maliyet firmanın uyguladığı koşullara göre değişebilir.
                  Karar vermeden önce ilgili firmadan resmi teklif alınız.
                </p>
              </div>

              <AdBanner placement="table_below" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
