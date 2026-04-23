'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart2, TrendingUp, ChevronRight, Zap } from 'lucide-react'
import type { HeroSlide } from '@/types'
import { numericOnlyBeforeInput } from '@/lib/input-filter'
import { useNumericInputState } from '@/lib/useNumericInputState'
import { useIntRangeInput } from '@/lib/useIntRangeInput'
import {
  handleTutarChange,
  handleTaksitChange,
  handlePesinatChange,
  handleMonthsChange,
  handleVarlikTuruChange,
  getMaxMonths,
  DEFAULT_VARLIK,
  type KarsilastirmaFormState,
  type VarlikTuru,
} from '@/lib/karsilastirma-state'

interface HeroSectionProps {
  slides: HeroSlide[]
}

const SLIDE_INTERVAL = 5000

export default function HeroSection({ slides }: HeroSectionProps) {
  const [current, setCurrent] = useState(0)
  const [formState, setFormState] = useState<KarsilastirmaFormState>({
    tutar: 2_000_000,
    pesinat: 400_000,
    taksit: 80_000,
    months: 20,
    primaryField: 'tutar',
    varlikTuru: DEFAULT_VARLIK,
  })
  const [faiz, setFaiz] = useState('2.49')
  const tutarInput = useNumericInputState(
    formState.tutar,
    val => setFormState(prev => handleTutarChange(prev, val)),
  )
  const pesinatInput = useNumericInputState(
    formState.pesinat,
    val => setFormState(prev => handlePesinatChange(prev, val)),
  )
  const taksitInput = useNumericInputState(
    formState.taksit,
    val => setFormState(prev => handleTaksitChange(prev, val)),
  )
  const maxMonths = getMaxMonths(formState.varlikTuru)
  const monthsInput = useIntRangeInput(
    formState.months,
    val => setFormState(prev => handleMonthsChange(prev, val)),
    { min: 1, max: maxMonths },
  )
  const router = useRouter()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length)
    }, SLIDE_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [slides.length])

  const goTo = (idx: number) => {
    setCurrent(idx)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length)
    }, SLIDE_INTERVAL)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (formState.tutar > 0) params.set('tutar', String(formState.tutar))
    if (formState.pesinat >= 0) params.set('pesinat', String(formState.pesinat))
    if (formState.taksit > 0) params.set('taksit', String(formState.taksit))
    params.set('months', String(formState.months))
    params.set('varlikTuru', formState.varlikTuru)
    const faizNum = parseFloat(faiz.replace(',', '.'))
    if (Number.isFinite(faizNum) && faizNum >= 0) params.set('kr_faiz', String(faizNum))
    router.push(`/karsilastirma?${params}`)
  }

  const VARLIK_OPTIONS: Array<{ value: VarlikTuru; label: string }> = [
    { value: 'konut', label: 'Konut' },
    { value: 'isyeri', label: 'İş Yeri' },
    { value: 'tasit', label: 'Taşıt' },
  ]

  const slide = slides[current]

  const highlight = (text: string, vurgu: string) => {
    if (!vurgu || !text.includes(vurgu)) return text
    const parts = text.split(vurgu)
    return (
      <>
        {parts[0]}
        <span className="text-primary-400">{vurgu}</span>
        {parts[1]}
      </>
    )
  }

  return (
    <section className="relative overflow-hidden min-h-[560px] flex items-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0c4a6e 100%)' }}>
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(14,165,233,.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,.12) 0%, transparent 50%)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-center">
          {/* Left — Slider */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Zap className="w-3 h-3" />
              {slide.badge}
            </div>

            {/* Title */}
            <h1 className="text-white font-extrabold leading-tight mb-4 tracking-tight" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}>
              {highlight(slide.baslik, slide.vurgu)}
            </h1>

            <p className="text-white/72 text-sm leading-relaxed mb-7 font-light max-w-lg">{slide.aciklama}</p>

            {/* Stats */}
            {slide.stats && (
              <div className="flex gap-4 flex-wrap mb-8">
                {slide.stats.map((s, i) => (
                  <div key={i} className="bg-white/7 border border-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                    <div className="text-lg font-extrabold text-primary-400">{s.val ?? '—'}</div>
                    <div className="text-[0.65rem] text-white/60 mt-0.5 font-normal">{s.lbl ?? ''}</div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/karsilastirma"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <BarChart2 className="w-4 h-4" />
                Karşılaştır
              </Link>
              <Link
                href="/tasarruf-finansmani"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/15 transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                TF Hesapla
              </Link>
            </div>

            {/* Dots */}
            <div className="flex items-center gap-2 mt-8">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full border-none transition-all cursor-pointer ${i === current ? 'bg-primary-400 w-6' : 'bg-white/30 w-2'}`}
                />
              ))}
            </div>
          </div>

          {/* Right — Quick calc form */}
          <div className="bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,.25)] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-700 to-accent-600 px-6 py-5">
              <h2 className="text-white font-bold text-sm mb-1">Hızlı Karşılaştırma</h2>
              <p className="text-white/85 text-xs">Tasarruf finansmanı ve kredi bilgilerini girin, IRR analiziyle gerçek maliyeti görün</p>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3.5">
              {/* Varlık türü seçici — Yön. m. 22/3 vade üst sınırını belirler */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-500">Finansman Konusu</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {VARLIK_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormState(prev => handleVarlikTuruChange(prev, opt.value))}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        formState.varlikTuru === opt.value
                          ? 'bg-primary-50 border-primary-300 text-primary-700'
                          : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ortak */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-500">Finansman / Kredi Tutarı</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    onBeforeInput={numericOnlyBeforeInput}
                    {...tutarInput}
                    placeholder="2.000.000"
                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 pr-8 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">₺</span>
                </div>
              </div>

              {/* TF alanları */}
              <div className="rounded-xl bg-success-50/60 border border-success-100 p-3 space-y-3">
                <p className="text-[11px] font-semibold text-success-700 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Tasarruf Finansmanı Tarafı
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Peşinat</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      onBeforeInput={numericOnlyBeforeInput}
                      {...pesinatInput}
                      placeholder="400.000"
                      className="w-full border border-neutral-200 rounded-xl px-3.5 py-2 pr-8 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">₺</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Aylık Taksit</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        onBeforeInput={numericOnlyBeforeInput}
                        {...taksitInput}
                        placeholder="80.000"
                        className="w-full border border-neutral-200 rounded-xl px-3.5 py-2 pr-8 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">₺</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500">
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
                        onBlur={monthsInput.onBlur}
                        onFocus={monthsInput.onFocus}
                        placeholder="20"
                        className={`w-full border rounded-xl px-3.5 py-2 pr-10 text-sm font-semibold transition-all bg-white focus:outline-none focus:ring-2 ${
                          monthsInput.isValid
                            ? 'border-neutral-200 text-neutral-800 focus:ring-primary-300 focus:border-primary-400'
                            : 'border-red-300 text-red-600 focus:ring-red-200 focus:border-red-400 bg-red-50/50'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">ay</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-400 -mt-1">
                  Mevzuat üst sınırı: {maxMonths} ay (Yön. m. 22/3). Tutar ve taksit otomatik senkronize edilir.
                </p>
              </div>

              {/* Kredi alanları */}
              <div className="rounded-xl bg-primary-50/60 border border-primary-100 p-3 space-y-3">
                <p className="text-[11px] font-semibold text-primary-700 uppercase tracking-wide flex items-center gap-1.5">
                  <BarChart2 className="w-3 h-3" /> Banka Kredisi Tarafı
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Aylık Faiz Oranı</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={faiz}
                      onChange={e => setFaiz(e.target.value)}
                      placeholder="2.49"
                      className="w-full border border-neutral-200 rounded-xl px-3.5 py-2 pr-8 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">%</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-1 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-primary-700 hover:to-primary-600 hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(14,165,233,.35)]"
              >
                <BarChart2 className="w-4 h-4" />
                Karşılaştır
                <ChevronRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-neutral-400">
                Ücretsiz · Kayıt gerekmez · Anlık sonuç
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
