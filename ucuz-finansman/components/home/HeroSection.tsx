'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart2, TrendingUp, Calculator, ChevronRight, Zap } from 'lucide-react'
import type { HeroSlide } from '@/types'

interface HeroSectionProps {
  slides: HeroSlide[]
}

const SLIDE_INTERVAL = 5000

export default function HeroSection({ slides }: HeroSectionProps) {
  const [current, setCurrent] = useState(0)
  const [tutar, setTutar] = useState('2.000.000')
  const [pesinat, setPesinat] = useState('400.000')
  const [taksit, setTaksit] = useState('60.000')
  const [vade, setVade] = useState('120')
  const [faiz, setFaiz] = useState('2.49')
  const [activeTab, setActiveTab] = useState<'tasarruf' | 'kredi'>('tasarruf')
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
    const parseVal = (v: string) => v.replace(/\./g, '').replace(',', '.')
    if (activeTab === 'tasarruf') {
      const params = new URLSearchParams({ tutar: parseVal(tutar), pesinat: parseVal(pesinat), taksit: parseVal(taksit) })
      router.push(`/tasarruf-finansmani?${params}`)
    } else {
      const params = new URLSearchParams({ tutar: parseVal(tutar), vade, faiz })
      router.push(`/kredi-hesaplama?${params}`)
    }
  }

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
                    <div className="text-lg font-extrabold text-primary-400">{s.val}</div>
                    <div className="text-[0.65rem] text-white/60 mt-0.5 font-normal">{s.lbl}</div>
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
              <h2 className="text-white font-bold text-sm mb-1">Hızlı Hesaplama</h2>
              <p className="text-white/85 text-xs">Parametreleri girin, anında hesaplayın</p>
              {/* Tabs */}
              <div className="flex bg-black/15 rounded-lg p-0.5 gap-0.5 mt-3.5">
                {([
                  ['tasarruf', 'Tasarruf Finansmanı'],
                  ['kredi', 'Banka Kredisi'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === key ? 'bg-white text-primary-700' : 'text-white/70 hover:text-white'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-500">
                  {activeTab === 'tasarruf' ? 'Finansman Tutarı' : 'Kredi Tutarı'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tutar}
                    onChange={e => setTutar(e.target.value)}
                    placeholder="2.000.000"
                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 pr-8 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">₺</span>
                </div>
              </div>

              {activeTab === 'tasarruf' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Peşinat</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={pesinat}
                        onChange={e => setPesinat(e.target.value)}
                        placeholder="400.000"
                        className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 pr-8 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">₺</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Aylık Taksit</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={taksit}
                        onChange={e => setTaksit(e.target.value)}
                        placeholder="60.000"
                        className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 pr-8 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">₺</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 -mt-1">Diğer alanlar otomatik doldurulacak</p>
                </>
              )}

              {activeTab === 'kredi' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Vade</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vade}
                        onChange={e => setVade(e.target.value)}
                        placeholder="120"
                        className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">ay</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Aylık Faiz Oranı</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={faiz}
                        onChange={e => setFaiz(e.target.value)}
                        placeholder="2.49"
                        className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 pr-8 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">%</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 -mt-1">Detaylı plan için kredi hesaplama sayfasını kullanın</p>
                </>
              )}

              <button
                type="submit"
                className="w-full mt-1 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-primary-700 hover:to-primary-600 hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(14,165,233,.35)]"
              >
                <Calculator className="w-4 h-4" />
                Analizi Başlat
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
