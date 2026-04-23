'use client'

import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react'
import { formatTL } from '@/lib/hesaplamalar'
import type { OptimizeCase, OptimizeOption } from '@/lib/tf-optimize'

interface OptionCardProps {
  option: OptimizeOption
  mode: OptimizeCase
  rank: 1 | 2 | 3
  tfAlwaysExpensive: boolean
  onDetailClick?: () => void
}

const MODE_LABELS: Record<OptimizeCase, { derived: string; derivedTr: string }> = {
  tutar: { derived: 'tutar', derivedTr: 'Toplam Tutar' },
  taksit: { derived: 'taksit', derivedTr: 'Aylık Taksit' },
  pesinat: { derived: 'pesinat', derivedTr: 'Peşinat' },
}

const RANK_LABELS: Record<1 | 2 | 3, string> = {
  1: 'En İyi',
  2: '2. Sıra',
  3: '3. Sıra',
}

/** One-liner that explains WHY this vade won. Pure function of option fields. */
function nedenCopy(o: OptimizeOption, tfAlwaysExpensive: boolean): string {
  if (tfAlwaysExpensive) {
    return `Teslim ${o.teslimAy}. ayda. Kalan ${o.kalanVade} ayda TF taksiti bankadan yüksek kalıyor — en az farkı bu vade veriyor.`
  }
  if (o.tfDahaUcuz) {
    return `Teslim ${o.teslimAy}. ayda gerçekleşiyor ve kalan ${o.kalanVade} ayda TF taksiti banka anüitesinin altında kalıyor.`
  }
  return `Teslim ${o.teslimAy}. ay, kalan ${o.kalanVade} ay. Bu vadede TF ile banka arasındaki fark minimum.`
}

export default function OptionCard({
  option,
  mode,
  rank,
  tfAlwaysExpensive,
  onDetailClick,
}: OptionCardProps) {
  const modeInfo = MODE_LABELS[mode]
  const derivedValue =
    mode === 'tutar' ? option.tutar
    : mode === 'taksit' ? option.taksit
    : option.pesinat

  const showTfFavorable = option.tfDahaUcuz && !tfAlwaysExpensive
  const absDelta = Math.abs(option.delta)

  // Determine ring color
  const ringClass =
    rank === 1
      ? showTfFavorable ? 'ring-2 ring-success-400' : 'ring-2 ring-neutral-300'
      : 'ring-1 ring-neutral-200'

  return (
    <div
      className={`bg-white rounded-2xl shadow-card border border-neutral-100 p-5 ${ringClass}`}
      data-testid={`option-card-rank-${rank}`}
    >
      {/* Rank + badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
          {RANK_LABELS[rank]}
        </span>
        {showTfFavorable ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-50 text-success-700">
            <TrendingDown className="w-3 h-3" />
            TF {formatTL(absDelta)} daha ucuz
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">
            <TrendingUp className="w-3 h-3" />
            Banka {formatTL(absDelta)} daha ucuz
          </span>
        )}
      </div>

      {/* Headline: vade + derived value */}
      <p className="text-xs font-semibold text-neutral-500 mb-1">
        {option.vade} ay vade · {modeInfo.derivedTr}
      </p>
      <p className="text-2xl font-extrabold text-neutral-900 mb-3 tracking-tight">
        {derivedValue != null ? formatTL(derivedValue) : '—'}
      </p>

      {/* Detail rows */}
      <div className="space-y-1.5 text-xs mb-3 border-t border-neutral-100 pt-3">
        {mode !== 'tutar' && (
          <DetailRow label="Tutar" value={formatTL(option.tutar)} />
        )}
        {mode !== 'pesinat' && (
          <DetailRow label="Peşinat" value={formatTL(option.pesinat)} />
        )}
        {mode !== 'taksit' && (
          <DetailRow label="Taksit" value={formatTL(option.taksit)} />
        )}
        <DetailRow label="Teslim Ayı" value={`${option.teslimAy}. ay`} />
        <DetailRow label="Kalan Vade" value={`${option.kalanVade} ay`} />
        <DetailRow label="Kredi İhtiyacı" value={formatTL(option.krediIhtiyaci)} />
        <DetailRow label="Eşdeğer Banka Taksiti" value={formatTL(option.esdegerBankaTaksiti)} />
      </div>

      {/* "Neden?" footer */}
      <div className="bg-neutral-50 rounded-xl px-3 py-2 mb-3">
        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide mb-0.5">
          Neden?
        </p>
        <p className="text-xs text-neutral-700 leading-snug">
          {nedenCopy(option, tfAlwaysExpensive)}
        </p>
      </div>

      {/* CTA */}
      {onDetailClick && (
        <button
          type="button"
          onClick={onDetailClick}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-semibold transition-colors"
        >
          Detaylı incele
          <ArrowUpRight className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="font-semibold text-neutral-800">{value}</span>
    </div>
  )
}
