'use client'

import { useMemo, useState } from 'react'
import { Sliders, Scale } from 'lucide-react'
import { formatTL, formatPct } from '@/lib/hesaplamalar'
import { optimizeTF, type OptimizeInput } from '@/lib/tf-optimize'

interface FlipConditionsProps {
  baseInput: OptimizeInput
}

/**
 * Shown when optimizeTF returned tfAlwaysExpensive === true for the user's
 * inputs. Two live sliders let the user perturb kredi faizi / mevduat yıllık
 * and see the optimizer re-run instantly. The flip point — where TF starts
 * winning — is the teaching moment.
 *
 * Regulatory anchor (Kanun 6361 m. 3/l + m. 39/B f. 3): TF'nin amacı faiz
 * kazancı/maliyeti değil, faizsiz finansmandır. UI is honest about current
 * market but frames the result as market-dependent, not TF-intrinsic.
 */
export default function FlipConditions({ baseInput }: FlipConditionsProps) {
  const [krFaiz, setKrFaiz] = useState(baseInput.krFaizAylik)
  const [mevduat, setMevduat] = useState(baseInput.mevduatYillik)

  const result = useMemo(() => {
    return optimizeTF({ ...baseInput, krFaizAylik: krFaiz, mevduatYillik: mevduat }, 1)
  }, [baseInput, krFaiz, mevduat])

  const best = result.options[0]
  const flipped = !result.tfAlwaysExpensive && best && best.tfDahaUcuz

  return (
    <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sliders className="w-4 h-4 text-primary-600" />
        <h3 className="font-bold text-sm text-neutral-800">
          Koşullar değişirse TF kazanır mı?
        </h3>
      </div>
      <p className="text-xs text-neutral-500 leading-relaxed mb-5">
        Girdiğiniz piyasa koşullarında TF, banka kredisi alternatifinden daha
        ucuz çıkmıyor. Bu, TF&apos;nin doğasından kaynaklanan bir kusur değil —
        mevduat faizi (%
        {baseInput.mevduatYillik.toFixed(2).replace('.', ',')}
        /yıl) kredi faizi aylık değerinin bileşik karşılığının üzerinde.
        Aşağıdaki kaydırıcılarla koşulları değiştirin ve sonucun nasıl
        değiştiğini görün.
      </p>

      <div className="space-y-5 mb-5">
        <SliderRow
          label="Kredi aylık faizi"
          value={krFaiz}
          min={0}
          max={8}
          step={0.01}
          unit="%/ay"
          baseline={baseInput.krFaizAylik}
          baselineLabel="Mevcut"
          onChange={setKrFaiz}
        />
        <SliderRow
          label="Mevduat yıllık faizi"
          value={mevduat}
          min={0}
          max={80}
          step={0.5}
          unit="%/yıl"
          baseline={baseInput.mevduatYillik}
          baselineLabel="Mevcut"
          onChange={setMevduat}
        />
      </div>

      {/* Live result */}
      <div
        className={`rounded-xl px-4 py-3 text-sm ${
          flipped
            ? 'bg-success-50 border border-success-200 text-success-800'
            : 'bg-neutral-50 border border-neutral-200 text-neutral-700'
        }`}
        data-testid="flip-result"
      >
        {best ? (
          flipped ? (
            <p>
              <strong>Bu koşullarda TF kazanıyor:</strong>
              {' '}
              {best.vade}. ay vadeli konfigürasyonda TF, banka alternatifinden
              {' '}<strong>{formatTL(Math.abs(best.delta))}</strong>{' '}
              daha ucuz.
            </p>
          ) : (
            <p>
              Bu koşullarda da TF bankadan{' '}
              <strong>{formatTL(Math.abs(best.delta))}</strong>{' '}
              daha pahalı (en iyi vade: {best.vade} ay).
            </p>
          )
        ) : (
          <p className="text-neutral-500">Hiçbir vade uygun değil.</p>
        )}
      </div>

      {/* Regulatory anchor */}
      <div className="mt-5 pt-4 border-t border-neutral-100 flex items-start gap-2">
        <Scale className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-neutral-500 leading-relaxed">
          TF&apos;nin amacı faiz kazancı veya maliyeti değil,
          {' '}<strong>faizsiz finansman</strong>{' '}
          sağlamaktır. Yani &ldquo;ucuzluk&rdquo; değil, &ldquo;faizsizlik&rdquo;
          kriteri esastır. Enflasyonun mevduat faizini kredi faizinin üzerine
          çıkardığı dönemlerde TF geleneksel alternatiften pahalı
          görünebilir — bu beklenen bir durumdur.
          <br />
          <span className="text-neutral-400">
            Kaynak: Kanun 6361 m. 3/l; m. 39/B fıkra 3.
          </span>
        </p>
      </div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  baseline,
  baselineLabel,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  baseline: number
  baselineLabel: string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  const basePct = ((baseline - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-xs font-semibold text-neutral-500">{label}</label>
        <span className="text-xs font-bold text-neutral-800">
          {formatPct(value).replace('%', '')} <span className="text-neutral-400 font-normal">{unit}</span>
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-600"
          aria-label={label}
        />
        {/* Baseline marker */}
        <div
          className="absolute top-0 w-0.5 h-3 bg-neutral-400 pointer-events-none"
          style={{ left: `calc(${basePct}% - 1px)` }}
          title={`${baselineLabel}: ${baseline}${unit}`}
        />
      </div>
      <div className="flex justify-between text-[9px] text-neutral-400 mt-0.5">
        <span>{min}</span>
        <span>{baselineLabel}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
