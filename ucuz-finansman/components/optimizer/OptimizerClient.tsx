'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Sparkles, BarChart2, Info, AlertTriangle, ChevronDown } from 'lucide-react'
import {
  parseOptimizerUrl,
  resolveOptimizerInitialState,
} from '@/lib/url-params'
import {
  DEFAULT_OPTIMIZER_STATE,
  handleOptimizeForChange,
  handleTutarChange,
  handlePesinatChange,
  handleTaksitChange,
  handleVarlikTuruChange,
  toOptimizeInput,
  type OptimizerFormState,
  type OptimizerMarketState,
} from '@/lib/optimizer-state'
import { optimizeTF, type OptimizeCase, type OptimizeInput } from '@/lib/tf-optimize'
import { VADE_CAPS } from '@/lib/karsilastirma-state'
import { numericOnlyBeforeInput } from '@/lib/input-filter'
import OptionCard from './OptionCard'
import FlipConditions from './FlipConditions'
import OptimizerYasalPaneli from './OptimizerYasalPaneli'

const DeltaSweepChart = dynamic(() => import('./DeltaSweepChart'), { ssr: false })

const MODE_OPTIONS: Array<{ value: OptimizeCase; label: string; hint: string }> = [
  { value: 'tutar', label: "Tutar'ı bul", hint: 'Peşinat ve taksiti biliyorum' },
  { value: 'taksit', label: "Taksit'i bul", hint: 'Tutar ve peşinatı biliyorum' },
  { value: 'pesinat', label: "Peşinat'ı bul", hint: 'Tutar ve taksiti biliyorum' },
]

const VARLIK_OPTIONS = [
  { value: 'konut' as const, label: 'Konut' },
  { value: 'isyeri' as const, label: 'İş Yeri' },
  { value: 'tasit' as const, label: 'Taşıt' },
]

const DEFAULT_MARKET: OptimizerMarketState = {
  orgPct: 8.5,
  krFaizAylik: 2.49,
  mevduatYillik: 40,
}

export default function OptimizerClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initial = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? '')
    const urlInput = parseOptimizerUrl(sp)
    return resolveOptimizerInitialState(urlInput, DEFAULT_MARKET)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [form, setForm] = useState<OptimizerFormState>(initial.form)
  const [market, setMarket] = useState<OptimizerMarketState>(initial.market)

  const optimizeInput = useMemo<OptimizeInput | null>(
    () => toOptimizeInput(form, market),
    [form, market],
  )

  const result = useMemo(() => {
    if (!optimizeInput) return null
    return optimizeTF(optimizeInput, 3)
  }, [optimizeInput])

  // Push an option's configuration into /karsilastirma for deeper inspection.
  const pushToCompare = (opt: (typeof result) extends null ? never : NonNullable<typeof result>['options'][number]) => {
    const sp = new URLSearchParams()
    sp.set('tutar', String(Math.round(opt.tutar)))
    sp.set('pesinat', String(Math.round(opt.pesinat)))
    sp.set('taksit', String(Math.round(opt.taksit)))
    sp.set('months', String(opt.vade))
    sp.set('varlikTuru', form.varlikTuru)
    sp.set('orgPct', String(market.orgPct))
    sp.set('kr_faiz', String(market.krFaizAylik))
    sp.set('mevduat_y', String(market.mevduatYillik))
    router.push(`/karsilastirma?${sp.toString()}`)
  }

  const inputClass =
    'w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed'
  const labelClass = 'block text-xs font-semibold text-neutral-500 mb-1.5'

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Banner */}
      <div
        className="py-8 px-4"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0c4a6e 100%)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 mb-2">
            <Sparkles className="w-5 h-5 text-primary-300" />
            <span className="text-xs font-semibold text-primary-300 uppercase tracking-wide">
              TF Optimizer
            </span>
          </div>
          <h1 className="text-white text-xl sm:text-2xl font-extrabold tracking-tight">
            En Uygun Vadeyi Bul
          </h1>
          <p className="text-primary-200 text-sm mt-1">
            Tasarruf finansmanı sözleşmeniz için bankaya göre en avantajlı yapılandırmayı bulur.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* LEFT — Form */}
          <div className="space-y-4">
            {/* Mode selector */}
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5">
              <h2 className="font-bold text-neutral-800 text-sm mb-1 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary-600" />
                Ne Bulmak İstiyorsunuz?
              </h2>
              <p className="text-xs text-neutral-500 mb-3.5 leading-relaxed">
                Bildiğiniz iki bilgiyi girin, optimizer en uygun vadeyi ve üçüncü bilinmeyeni
                hesaplasın.
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {MODE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(prev => handleOptimizeForChange(prev, opt.value))}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                      form.optimizeFor === opt.value
                        ? 'bg-primary-50 border-primary-300 text-primary-700'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      {form.optimizeFor === opt.value && (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-primary-600">Seçili</span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 font-normal mt-0.5">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Varlık türü + inputs */}
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5">
              <h2 className="font-bold text-neutral-800 text-sm mb-3">TF Parametreleri</h2>
              <div className="space-y-3.5">
                <div>
                  <label className={labelClass}>Finansman Konusu</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {VARLIK_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(prev => handleVarlikTuruChange(prev, opt.value))}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          form.varlikTuru === opt.value
                            ? 'bg-success-50 border-success-300 text-success-700'
                            : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Mevzuat üst sınırı: {VADE_CAPS[form.varlikTuru]} ay (Yön. m. 22/3)
                  </p>
                </div>

                <NumericInputRow
                  label="Toplam Finansman Tutarı"
                  suffix="₺"
                  value={form.tutar}
                  onChange={val => setForm(prev => handleTutarChange(prev, val))}
                  disabled={form.optimizeFor === 'tutar'}
                  derivedLabel="Optimizer hesaplıyor"
                  inputClass={inputClass}
                  labelClass={labelClass}
                />
                <NumericInputRow
                  label="Peşinat"
                  suffix="₺"
                  value={form.pesinat}
                  onChange={val => setForm(prev => handlePesinatChange(prev, val))}
                  disabled={form.optimizeFor === 'pesinat'}
                  derivedLabel="Optimizer hesaplıyor"
                  inputClass={inputClass}
                  labelClass={labelClass}
                />
                <NumericInputRow
                  label="Aylık Taksit"
                  suffix="₺"
                  value={form.taksit}
                  onChange={val => setForm(prev => handleTaksitChange(prev, val))}
                  disabled={form.optimizeFor === 'taksit'}
                  derivedLabel="Optimizer hesaplıyor"
                  inputClass={inputClass}
                  labelClass={labelClass}
                />
              </div>
            </div>

            {/* Market params */}
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5">
              <h2 className="font-bold text-neutral-800 text-sm mb-3">Piyasa Parametreleri</h2>
              <div className="space-y-3.5">
                <NumericInputRow
                  label="Organizasyon Ücreti Oranı"
                  suffix="%"
                  value={market.orgPct}
                  onChange={val => setMarket(prev => ({ ...prev, orgPct: val }))}
                  inputClass={inputClass}
                  labelClass={labelClass}
                  allowDecimal
                />
                <NumericInputRow
                  label="Banka Aylık Kredi Faizi"
                  suffix="%/ay"
                  value={market.krFaizAylik}
                  onChange={val => setMarket(prev => ({ ...prev, krFaizAylik: val }))}
                  inputClass={inputClass}
                  labelClass={labelClass}
                  allowDecimal
                />
                <NumericInputRow
                  label="Mevduat Yıllık Faizi"
                  suffix="%/yıl"
                  value={market.mevduatYillik}
                  onChange={val => setMarket(prev => ({ ...prev, mevduatYillik: val }))}
                  inputClass={inputClass}
                  labelClass={labelClass}
                  allowDecimal
                />
              </div>
            </div>
          </div>

          {/* RIGHT — Results */}
          <div className="space-y-5">
            {!result && (
              <EmptyState />
            )}

            {result && result.options.length === 0 && (
              <NoFeasibleState allEvaluated={result.allEvaluated} />
            )}

            {result && result.options.length > 0 && result.tfAlwaysExpensive && optimizeInput && (
              <>
                <FlipConditions baseInput={optimizeInput} />
                <details className="bg-white rounded-2xl shadow-card border border-neutral-100">
                  <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-between">
                    <span>Yine de en az kayıp eden TF yapılandırmaları</span>
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  </summary>
                  <div className="px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {result.options.map((opt, i) => (
                      <OptionCard
                        key={opt.vade}
                        option={opt}
                        mode={form.optimizeFor}
                        rank={(i + 1) as 1 | 2 | 3}
                        tfAlwaysExpensive
                        onDetailClick={() => pushToCompare(opt)}
                      />
                    ))}
                  </div>
                </details>
              </>
            )}

            {result && result.options.length > 0 && !result.tfAlwaysExpensive && (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                  <BarChart2 className="w-4 h-4 text-success-600" />
                  En Uygun 3 Yapılandırma
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {result.options.map((opt, i) => (
                    <OptionCard
                      key={opt.vade}
                      option={opt}
                      mode={form.optimizeFor}
                      rank={(i + 1) as 1 | 2 | 3}
                      tfAlwaysExpensive={false}
                      onDetailClick={() => pushToCompare(opt)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Full sweep chart */}
            {result && (
              <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5">
                <h3 className="font-bold text-sm text-neutral-800 mb-1">
                  Tüm Vadelerin Karşılaştırması
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  1&apos;den {VADE_CAPS[form.varlikTuru]}&apos;e kadar her vade için TF &minus; Banka farkı.
                  Yeşil noktalar en uygun 3 vadeyi gösterir. Grafikteki boşluklar uygulanamaz
                  vadelere karşılık gelir.
                </p>
                <DeltaSweepChart
                  allEvaluated={result.allEvaluated}
                  topVades={result.options.map(o => o.vade)}
                />
              </div>
            )}

            {/* Regulatory disclosures */}
            <OptimizerYasalPaneli />
          </div>
        </div>
      </div>
    </div>
  )
}

function NumericInputRow({
  label,
  suffix,
  value,
  onChange,
  disabled = false,
  derivedLabel,
  inputClass,
  labelClass,
  allowDecimal = false,
}: {
  label: string
  suffix: string
  value: number | undefined
  onChange: (val: number) => void
  disabled?: boolean
  derivedLabel?: string
  inputClass: string
  labelClass: string
  allowDecimal?: boolean
}) {
  const [local, setLocal] = useState<string>(value != null ? String(value) : '')

  // Keep local string in sync when external state changes (e.g. mode switch).
  useEffect(() => {
    if (value == null) setLocal('')
    else if (parseFloat(local) !== value) setLocal(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div>
      <label className={labelClass}>
        {label}
        {disabled && derivedLabel && (
          <span className="ml-1.5 text-[10px] font-normal text-primary-500">— {derivedLabel}</span>
        )}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          onBeforeInput={numericOnlyBeforeInput}
          className={inputClass}
          value={disabled ? '' : local}
          placeholder={disabled ? '—' : undefined}
          disabled={disabled}
          onChange={e => {
            const v = e.target.value
            setLocal(v)
            // Normalize TR decimal comma to dot before parsing.
            const parsed = parseFloat(v.replace(',', '.'))
            if (Number.isFinite(parsed) && parsed >= 0) {
              onChange(parsed)
            }
          }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">{suffix}</span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-8 text-center">
      <Info className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
      <h3 className="font-bold text-sm text-neutral-700 mb-1">Bekleniyor</h3>
      <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
        Sol taraftaki formu doldurun. Bildiğiniz iki bilgiyi girdiğinizde optimizer her
        vade için maliyet farkını hesaplayıp en uygun 3 yapılandırmayı gösterir.
      </p>
    </div>
  )
}

function NoFeasibleState({ allEvaluated }: { allEvaluated: Array<{ reason?: string; feasible: boolean }> }) {
  const firstReason = allEvaluated.find(o => !o.feasible)?.reason
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-bold text-sm text-amber-900 mb-1">
          Uygun vade bulunamadı
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed">
          Girdiğiniz değerlerle hiçbir vade için geçerli bir yapılandırma hesaplanamadı.
          {firstReason && (
            <>
              {' '}Sebep: <em>{firstReason}</em>.
            </>
          )}
          {' '}
          Lütfen değerleri kontrol edin — örneğin Mod C&apos;de (peşinatı bul) taksitiniz
          tutara bölündüğünde 1&apos;den küçük olmalı.
        </p>
      </div>
    </div>
  )
}
