'use client'

import { Fragment, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { BarChart2, TrendingUp, Building2, AlertTriangle } from 'lucide-react'
import { karsilastirmaHesapla, formatTL, formatPct, parseInput } from '@/lib/hesaplamalar'
import { numericOnlyBeforeInput } from '@/lib/input-filter'
import { useNumericInputState } from '@/lib/useNumericInputState'
import { useIntRangeInput } from '@/lib/useIntRangeInput'
import type { KarsilastirmaParams, KarsilastirmaSonuc } from '@/lib/hesaplamalar'
import {
  handleTutarChange as handleTutarChangePure,
  handleTaksitChange as handleTaksitChangePure,
  handlePesinatChange as handlePesinatChangePure,
  handleMonthsChange as handleMonthsChangePure,
  handleVarlikTuruChange as handleVarlikTuruChangePure,
  getMaxMonths,
  DEFAULT_VARLIK,
  type KarsilastirmaFormState,
  type VarlikTuru,
} from '@/lib/karsilastirma-state'
import { parseKarsilastirmaUrl, resolveInitialState } from '@/lib/url-params'
import { StatCard } from '@/components/ui/Card'
import AdBanner from '@/components/ui/AdBanner'
import YasalBilgiPaneli from './YasalBilgiPaneli'

// SSR hatası almamak için dinamik import
const KarsilastirmaChart = dynamic(() => import('./KarsilastirmaChart'), { ssr: false })

// "Other" params — non-form-state fields needed by karsilastirmaHesapla
interface OtherParams {
  orgPct: number
  krFaizAylik: number
  mevduatYillik: number
  takTuru: 'sabit' | 'artisli'
  artisAy: number
  yeniTaksit: number
  kalanVadeOverride?: number
}

const DEFAULT_FORM: {
  tutar: number
  pesinat: number
  taksit: number
  months: number
  varlikTuru: VarlikTuru
} = {
  tutar: 1_800_000,
  pesinat: 300_000,
  taksit: 60_000,
  months: 25,
  varlikTuru: DEFAULT_VARLIK,
}

const DEFAULT_OTHER: OtherParams = {
  orgPct: 8.5,
  krFaizAylik: 2.49,
  mevduatYillik: 40,
  takTuru: 'sabit',
  artisAy: 0,
  yeniTaksit: 0,
}

export default function KarsilastirmaClient() {
  const searchParams = useSearchParams()

  // Next.js returns ReadonlyURLSearchParams; wrap it in a fresh URLSearchParams
  // so the pure `parseKarsilastirmaUrl` (which expects URLSearchParams) is happy.
  const spSnapshot = useMemo(
    () => new URLSearchParams(searchParams?.toString() ?? ''),
    // snapshot once at mount — initial-state resolution only uses mount-time URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Initial form state: URL-derived, with defaults as fallback.
  const [formState, setFormState] = useState<KarsilastirmaFormState>(() => {
    const urlInput = parseKarsilastirmaUrl(spSnapshot)
    return resolveInitialState(urlInput, DEFAULT_FORM)
  })

  // "Other" params — non-form-state fields used by karsilastirmaHesapla.
  const [otherParams, setOtherParams] = useState<OtherParams>(() => {
    const sp = spSnapshot
    const urlInput = parseKarsilastirmaUrl(sp)
    // Legacy URL keys (org_pct, kr_faiz, mevduat_y) are not covered by
    // parseKarsilastirmaUrl; read those directly as a best-effort fallback.
    const orgPctLegacy = parseFloat(sp.get('org_pct') ?? '')
    const krFaizLegacy = parseFloat(sp.get('kr_faiz') ?? '')
    const mevduatLegacy = parseFloat(sp.get('mevduat_y') ?? '')
    return {
      orgPct:
        urlInput.orgPct !== undefined
          ? urlInput.orgPct
          : Number.isFinite(orgPctLegacy) && orgPctLegacy > 0
          ? orgPctLegacy
          : DEFAULT_OTHER.orgPct,
      krFaizAylik:
        urlInput.krFaiz !== undefined
          ? urlInput.krFaiz
          : Number.isFinite(krFaizLegacy) && krFaizLegacy > 0
          ? krFaizLegacy
          : DEFAULT_OTHER.krFaizAylik,
      mevduatYillik:
        urlInput.mevduatYillik !== undefined
          ? urlInput.mevduatYillik
          : Number.isFinite(mevduatLegacy) && mevduatLegacy > 0
          ? mevduatLegacy
          : DEFAULT_OTHER.mevduatYillik,
      takTuru: DEFAULT_OTHER.takTuru,
      artisAy: DEFAULT_OTHER.artisAy,
      yeniTaksit: DEFAULT_OTHER.yeniTaksit,
    }
  })

  const [kalanVadeStr, setKalanVadeStr] = useState<string>('')
  const userEditedKalanVade = useRef(false)

  const [sonuc, setSonuc] = useState<KarsilastirmaSonuc | null>(null)

  // Merge formState + otherParams → KarsilastirmaParams for computation.
  const params: KarsilastirmaParams = useMemo(
    () => ({
      tutar: formState.tutar,
      pesinat: formState.pesinat,
      taksit0: formState.taksit,
      orgPct: otherParams.orgPct,
      krFaizAylik: otherParams.krFaizAylik,
      mevduatYillik: otherParams.mevduatYillik,
      takTuru: otherParams.takTuru,
      artisAy: otherParams.artisAy,
      yeniTaksit: otherParams.yeniTaksit,
      kalanVadeOverride: otherParams.kalanVadeOverride,
    }),
    [formState, otherParams],
  )

  const hesapla = useCallback(() => {
    try {
      setSonuc(karsilastirmaHesapla(params))
    } catch {
      /* ignore */
    }
  }, [params])

  useEffect(() => {
    hesapla()
  }, [hesapla])

  // Sync kalanVadeStr from auto-calc when user hasn't overridden
  useEffect(() => {
    if (sonuc && !userEditedKalanVade.current) {
      setKalanVadeStr(sonuc.kalanVade.toString())
    }
  }, [sonuc])

  // --- Form handlers route through the pure state-machine module ---
  const onTutarChange = (val: number) => {
    setFormState(prev => handleTutarChangePure(prev, val))
  }

  const onTaksitChange = (val: number) => {
    setFormState(prev => handleTaksitChangePure(prev, val))
  }

  const onPesinatChange = (val: number) => {
    setFormState(prev => handlePesinatChangePure(prev, val))
  }

  const onMonthsChange = (val: number) => {
    setFormState(prev => handleMonthsChangePure(prev, val))
  }

  const onVarlikTuruChange = (val: VarlikTuru) => {
    setFormState(prev => handleVarlikTuruChangePure(prev, val))
  }

  const maxMonths = getMaxMonths(formState.varlikTuru)

  // Display-state hooks: keep the text the user typed stable during typing.
  const tutarInput = useNumericInputState(formState.tutar, onTutarChange)
  const pesinatInput = useNumericInputState(formState.pesinat, onPesinatChange)
  const taksitInput = useNumericInputState(formState.taksit, onTaksitChange)
  const monthsInput = useIntRangeInput(formState.months, onMonthsChange, { min: 1, max: maxMonths })

  const VARLIK_OPTIONS: Array<{ value: VarlikTuru; label: string }> = [
    { value: 'konut', label: 'Konut' },
    { value: 'isyeri', label: 'İş Yeri' },
    { value: 'tasit', label: 'Taşıt' },
  ]

  const setOther = <K extends keyof OtherParams>(key: K, val: OtherParams[K]) => {
    setOtherParams(prev => ({ ...prev, [key]: val }))
  }

  const handleKalanVadeChange = (val: string) => {
    setKalanVadeStr(val)
    const n = parseInt(val) || 0
    userEditedKalanVade.current = n > 0
    setOtherParams(prev => ({ ...prev, kalanVadeOverride: n > 0 ? n : undefined }))
  }

  const resetKalanVade = () => {
    userEditedKalanVade.current = false
    setOtherParams(prev => ({ ...prev, kalanVadeOverride: undefined }))
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
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Maliyet Karşılaştırma Analizi</span>
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
                  <label className={labelClass}>Finansman Konusu</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {VARLIK_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onVarlikTuruChange(opt.value)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          formState.varlikTuru === opt.value
                            ? 'bg-success-50 border-success-300 text-success-700'
                            : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Toplam Finansman Tutarı</label>
                  <div className="relative">
                    <input type="text" inputMode="decimal" onBeforeInput={numericOnlyBeforeInput} className={inputClass} {...tutarInput} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₺</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Peşinat</label>
                  <div className="relative">
                    <input type="text" inputMode="decimal" onBeforeInput={numericOnlyBeforeInput} className={inputClass} {...pesinatInput} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₺</span>
                  </div>
                </div>
                <div>
                  <label
                    className={labelClass}
                    title="Mevzuatta 'organizasyon ücreti' olarak geçer; bazı şirketler 'hizmet bedeli' de diyebilir (Kanun 6361 m. 3/j). Ödenen organizasyon ücreti, 14 gün içinde cayma halinde iade edilir (Kanun 6361 m. 39/A fıkra 3)."
                  >
                    Organizasyon Ücreti
                  </label>
                  <div className="relative">
                    <input type="number" step="0.1" className={inputClass} value={otherParams.orgPct}
                      onChange={e => setOther('orgPct', parseFloat(e.target.value) || 0)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
                  </div>
                </div>
                {false && (
                  <div>
                    <label className={labelClass}>Taksit Türü</label>
                    <div className="flex gap-2">
                      {(['sabit', 'artisli'] as const).map(t => (
                        <button key={t} type="button"
                          onClick={() => setOther('takTuru', t)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${otherParams.takTuru === t ? 'bg-success-50 border-success-300 text-success-700' : 'bg-white border-neutral-200 text-neutral-500'}`}>
                          {t === 'sabit' ? 'Sabit' : 'Artışlı'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label
                    className={labelClass}
                    title="Planınızın dışında ara dönemlerde ek ödeme yapmanız tahsisat (teslim) tarihini öne çekmez. Tahsisat için yalnızca taahhüt ettiğiniz tasarruf planı dikkate alınır (Yönetmelik m. 21/3)."
                  >
                    Başlangıç Taksit <span className="text-neutral-400 font-normal" aria-hidden>ⓘ</span>
                  </label>
                  <div className="relative">
                    <input type="text" inputMode="decimal" onBeforeInput={numericOnlyBeforeInput} className={inputClass} {...taksitInput} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₺</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    Vade (Ay)
                    {!monthsInput.isValid && (
                      <span className="ml-1.5 text-[10px] text-red-500 font-normal">— geçersiz (1-{maxMonths})</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={maxMonths}
                      value={monthsInput.value}
                      onChange={monthsInput.onChange}
                      onFocus={monthsInput.onFocus}
                      onBlur={monthsInput.onBlur}
                      className={
                        monthsInput.isValid
                          ? inputClass
                          : "w-full border border-red-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all bg-red-50/50"
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">ay</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Mevzuat üst sınırı: {maxMonths} ay (Yön. m. 22/3)
                  </p>
                </div>
                {false && otherParams.takTuru === 'artisli' && (
                  <div className="grid grid-cols-2 gap-3 bg-amber-50 p-3 rounded-xl">
                    <div>
                      <label className={labelClass}>Artış Başlangıç Ayı</label>
                      <input type="number" className={inputClass} value={otherParams.artisAy}
                        onChange={e => setOther('artisAy', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className={labelClass}>Yeni Taksit</label>
                      <div className="relative">
                        <input type="text" className={inputClass} value={Math.round(otherParams.yeniTaksit).toLocaleString('tr-TR')}
                          onChange={e => setOther('yeniTaksit', parseInput(e.target.value, false))} />
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
                    <p className="text-xs text-primary-700 mt-0.5">
                      {sonuc.bagliyayanEsik === 'tasarruf'
                        ? `Tasarruf %40 şartı ${sonuc.tasarrufEsikAyi}. ayda sağlanıyor; süre şartı daha önce karşılanmış.`
                        : sonuc.bagliyayanEsik === 'sure'
                        ? `Süre şartı ${sonuc.sureEsikAyi}. ayda sağlanıyor; tasarruf %40 şartı daha önce (${sonuc.tasarrufEsikAyi}. ay) karşılanmış.`
                        : `Her iki şart da ${sonuc.teslimAy}. ayda karşılanıyor.`}
                    </p>
                    <p className="text-[10px] text-primary-500 mt-1 leading-relaxed">
                      Mevzuat: hem tasarrufun %40&apos;ı hem sözleşme süresinin %40&apos;ı birlikte aranır; süre şartı peşinat oranı ile azaltılabilir (Yön. m. 21/2-a, 21/3). En erken 5. aydan itibaren.
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
                    <input type="number" step="0.01" className={inputClass} value={otherParams.krFaizAylik}
                      onChange={e => setOther('krFaizAylik', parseFloat(e.target.value) || 0)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Alternatif Mevduat Getirisi (Yıllık)</label>
                  <div className="relative">
                    <input type="number" step="0.5" className={inputClass} value={otherParams.mevduatYillik}
                      onChange={e => setOther('mevduatYillik', parseFloat(e.target.value) || 0)} />
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
              {/* Verdict — etkin faiz vs banka faizi (rate-bazlı) */}
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
                      ? `Mevduat+kredi alternatifi ${formatTL(sonuc.fark)} daha az ödeme ile bitiriyor`
                      : `TF sistemi ${formatTL(sonuc.fark)} daha az ödeme ile bitiriyor`
                    }
                  </p>
                  <p className="text-xs mt-0.5 text-neutral-500">
                    TF maliyet oranı (referans) <strong>{formatPct(sonuc.irrAylikPct)}</strong> · banka efektif faiz <strong>{formatPct(otherParams.krFaizAylik)}</strong>
                  </p>
                </div>
              </div>

              {/* Ana karşılaştırma (TL) + ikincil (maliyet oranları) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="TF Toplam Maliyet"
                  value={formatTL(sonuc.tfToplam)}
                  color={sonuc.tfDahaAvantajli ? 'green' : 'blue'}
                />
                <StatCard
                  label="Kredi Alt. Toplam"
                  value={formatTL(sonuc.altToplam)}
                  sub={
                    isFinite(sonuc.fark)
                      ? `${sonuc.krDahaUcuz ? '−' : '+'}${formatTL(sonuc.fark)}`
                      : '—'
                  }
                  color={sonuc.krDahaUcuz ? 'green' : 'indigo'}
                />
                <StatCard
                  label="TF Aylık Maliyet Oranı (referans)"
                  value={formatPct(sonuc.irrAylikPct)}
                  sub={`vs banka ${formatPct(otherParams.krFaizAylik)}`}
                  color="amber"
                  tooltip="Bu oran yalnızca banka kredisi faiz eşdeğeri referans amacıyla hesaplanmıştır; TF sözleşmesi mevzuat gereği faizsiz finansman esaslıdır (Kanun 6361 m. 3/l, m. 39/B fıkra 3)."
                />
                <StatCard
                  label="TF Yıllık Maliyet Oranı (referans)"
                  value={formatPct(sonuc.irrYillik)}
                  sub="Bileşik"
                  color="amber"
                  tooltip="Bu oran yalnızca banka kredisi faiz eşdeğeri referans amacıyla hesaplanmıştır; TF sözleşmesi mevzuat gereği faizsiz finansman esaslıdır (Kanun 6361 m. 3/l, m. 39/B fıkra 3)."
                />
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
                      ['Peşinat', formatTL(formState.pesinat)],
                      ['Org. Bedeli', formatTL(sonuc.orgBedeli)],
                      ['Toplam Maliyet', formatTL(sonuc.tfToplam)],
                      ['TF Aylık Maliyet Oranı (referans)', formatPct(sonuc.irrAylikPct)],
                      ['TF Yıllık Maliyet Oranı (referans)', formatPct(sonuc.irrYillik)],
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
                <div className="px-5 py-4 border-b border-neutral-100">
                  <h3 className="font-bold text-sm text-neutral-800">Karşılaştırmalı Ödeme Planı</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    TF ödemeleri aynı miktarda mevduata yatırılarak birikiyor; teslimat ayında kalan tutar krediyle karşılanıyor.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <th className="px-4 py-2.5 text-left font-semibold text-neutral-500 bg-neutral-50">Ay</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-success-600 bg-success-50/40">TF Taksit</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-success-600 bg-success-50/40">TF Kümülatif</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-blue-600 bg-blue-50/40">Alt. Ödeme</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-emerald-600 bg-emerald-50/40">+Faiz</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-blue-600 bg-blue-50/40">Mevd. Bakiye*</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* ── AY 1: 3 başlangıç satırı (TF tarafı ayrıntılı; alt taraf ay 1'de toplu mevduata girer) ── */}
                      {[
                        { label: 'Peşinat',    tf: formState.pesinat,               tfK: formState.pesinat },
                        { label: 'Org. Bedeli',tf: sonuc.orgBedeli,                 tfK: formState.pesinat + sonuc.orgBedeli },
                        { label: '',           tf: sonuc.rows[0]?.tfTaksit ?? 0,    tfK: sonuc.rows[0]?.tfKumul ?? formState.pesinat + sonuc.orgBedeli },
                      ].map((r, i) => (
                        <tr key={`init-${i}`} className="border-b border-neutral-50 hover:bg-neutral-50/60">
                          <td className="px-4 py-2 bg-neutral-50/60">
                            <span className="font-semibold text-neutral-700">1</span>
                          </td>
                          <td className="px-4 py-2 text-right text-neutral-700">
                            {r.label && <span className="mr-1.5 text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">{r.label}</span>}
                            {Math.round(r.tf).toLocaleString('tr-TR')} ₺
                          </td>
                          <td className="px-4 py-2 text-right text-success-700">{Math.round(r.tfK).toLocaleString('tr-TR')} ₺</td>
                          <td className="px-4 py-2 text-right text-neutral-300">—</td>
                          <td className="px-4 py-2 text-right text-neutral-300">—</td>
                          <td className="px-4 py-2 text-right text-neutral-300">—</td>
                        </tr>
                      ))}

                      {/* ── AY 2'den itibaren satırlar ── */}
                      {sonuc.rows.slice(1).map(row => {
                        if (row.isTeslim) {
                          // Teslimat ayı: 3 alt satır (Biriken Tutar / Çekilen Kredi / 1. Taksit)
                          return (
                            <Fragment key={`t-${row.ay}`}>
                              {/* Alt-satır 1: Biriken mevduat tutarı */}
                              <tr key={`t-${row.ay}-1`} className="bg-amber-50/80 border-b border-amber-100">
                                <td rowSpan={3} className="px-4 py-2 align-middle bg-amber-50 border-r border-amber-100">
                                  <div className="flex flex-col items-start gap-1">
                                    <span className="font-bold text-neutral-800">{row.ay}</span>
                                    <span className="text-[10px] bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded-full font-semibold">Teslimat</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-right text-neutral-700">{Math.round(row.tfTaksit).toLocaleString('tr-TR')} ₺</td>
                                <td className="px-4 py-2 text-right text-success-700 font-semibold">{Math.round(row.tfKumul).toLocaleString('tr-TR')} ₺</td>
                                <td className="px-4 py-2 text-right">
                                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded mr-1">Biriken</span>
                                  <span className="text-emerald-700 font-semibold">{Math.round(sonuc.birikilenToplam).toLocaleString('tr-TR')} ₺</span>
                                </td>
                                <td className="px-4 py-2 text-right text-neutral-300">—</td>
                                <td className="px-4 py-2 text-right text-emerald-700 font-bold">{Math.round(sonuc.birikilenToplam).toLocaleString('tr-TR')} ₺</td>
                              </tr>
                              {/* Alt-satır 2: Çekilen kredi tutarı */}
                              <tr key={`t-${row.ay}-2`} className="bg-amber-50/80 border-b border-amber-100">
                                <td className="px-4 py-2 text-right text-neutral-300">—</td>
                                <td className="px-4 py-2 text-right text-neutral-300">—</td>
                                <td className="px-4 py-2 text-right">
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-1">Kredi</span>
                                  <span className="text-blue-700 font-semibold">{Math.round(sonuc.krediIhtiyaci).toLocaleString('tr-TR')} ₺</span>
                                </td>
                                <td className="px-4 py-2 text-right text-neutral-300">—</td>
                                <td className="px-4 py-2 text-right text-neutral-300">—</td>
                              </tr>
                              {/* Alt-satır 3: İlk kredi taksiti */}
                              <tr key={`t-${row.ay}-3`} className="bg-amber-50/80 border-b border-neutral-100">
                                <td className="px-4 py-2 text-right text-neutral-300">—</td>
                                <td className="px-4 py-2 text-right text-neutral-300">—</td>
                                <td className="px-4 py-2 text-right">
                                  <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded mr-1">1. Taksit</span>
                                  <span className="text-neutral-700">{Math.round(row.altTaksit).toLocaleString('tr-TR')} ₺</span>
                                </td>
                                <td className="px-4 py-2 text-right text-neutral-300">—</td>
                                <td className="px-4 py-2 text-right text-blue-700 font-semibold">{Math.round(row.altKumul).toLocaleString('tr-TR')} ₺</td>
                              </tr>
                            </Fragment>
                          )
                        }
                        // Normal satır: teslimat öncesi ise mevduatta (ay < teslimAy); sonrası kredi
                        const isPreDelivery = row.ay < sonuc.teslimAy
                        return (
                          <tr key={row.ay} className="border-b border-neutral-50 hover:bg-neutral-50/60">
                            <td className="px-4 py-2 bg-neutral-50/40">
                              <span className="font-semibold text-neutral-700">{row.ay}</span>
                            </td>
                            <td className="px-4 py-2 text-right text-neutral-700">{Math.round(row.tfTaksit).toLocaleString('tr-TR')} ₺</td>
                            <td className="px-4 py-2 text-right text-success-700">{Math.round(row.tfKumul).toLocaleString('tr-TR')} ₺</td>
                            <td className="px-4 py-2 text-right text-neutral-700">{Math.round(row.altTaksit).toLocaleString('tr-TR')} ₺</td>
                            <td className="px-4 py-2 text-right">
                              {isPreDelivery
                                ? <span className="text-emerald-600 font-medium">+{Math.round(row.altFaiz).toLocaleString('tr-TR')} ₺</span>
                                : <span className="text-neutral-300">—</span>}
                            </td>
                            <td className={`px-4 py-2 text-right font-medium ${isPreDelivery ? 'text-emerald-700' : 'text-blue-700'}`}>
                              {Math.round(row.altKumul).toLocaleString('tr-TR')} ₺
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-50 border-t-2 border-neutral-200">
                        <td className="px-4 py-3 font-bold text-neutral-700 text-xs">Toplam Ödeme</td>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3 text-right font-bold text-success-700">{Math.round(sonuc.tfToplam).toLocaleString('tr-TR')} ₺</td>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3 text-right font-bold text-blue-700">{Math.round(sonuc.altToplam).toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50">
                  <p className="text-[10px] text-neutral-400">* Teslimat öncesi: mevduat bakiyesi (yatırım + kazanılan faiz) · Teslimat sonrası: kümülatif kredi ödemesi</p>
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

              {/* Yasal Bilgilendirme — cayma, mevduat sigortası, sözleşme tipi */}
              <YasalBilgiPaneli />

              <AdBanner placement="table_below" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
