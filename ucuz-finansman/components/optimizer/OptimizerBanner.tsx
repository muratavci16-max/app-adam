import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import type { VarlikTuru } from '@/lib/karsilastirma-state'

interface Props {
  tutar: number
  pesinat: number
  varlikTuru: VarlikTuru
  orgPct: number
  krFaizAylik: number
  mevduatYillik: number
}

/**
 * Inline entry point to /optimizasyon shown above the main karsilastirma
 * results. Pre-fills the optimizer with the user's current form values.
 *
 * Mode default is 'taksit' (Mode B — simplest) because the user is on the
 * karsilastirma page which presumes they know tutar + peşinat.
 */
export default function OptimizerBanner({
  tutar,
  pesinat,
  varlikTuru,
  orgPct,
  krFaizAylik,
  mevduatYillik,
}: Props) {
  const sp = new URLSearchParams()
  sp.set('mode', 'taksit')
  if (tutar > 0) sp.set('tutar', String(Math.round(tutar)))
  if (pesinat >= 0) sp.set('pesinat', String(Math.round(pesinat)))
  sp.set('varlikTuru', varlikTuru)
  sp.set('orgPct', String(orgPct))
  sp.set('krFaiz', String(krFaizAylik))
  sp.set('mevduatYillik', String(mevduatYillik))

  return (
    <Link
      href={`/optimizasyon?${sp.toString()}`}
      className="group flex items-center gap-3 bg-gradient-to-r from-primary-50 via-accent-50 to-primary-50 border border-primary-200 rounded-2xl px-5 py-4 hover:border-primary-300 hover:shadow-md transition-all"
    >
      <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
        <Sparkles className="w-4 h-4 text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-primary-900 leading-tight">
          Hangi vade daha uygun?
        </p>
        <p className="text-xs text-primary-700 mt-0.5">
          Optimizer&apos;da tüm vadeleri karşılaştırın — mevzuat sınırları içinde en avantajlı
          yapılandırmayı bulur.
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-primary-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  )
}
