import Link from 'next/link'
import { ArrowRight, Building2, RefreshCw } from 'lucide-react'
import { formatPct } from '@/lib/hesaplamalar'
import type { BankRate } from '@/types'

interface BankRatesSectionProps {
  rates: BankRate[]
}

export default function BankRatesSection({ rates }: BankRatesSectionProps) {
  if (rates.length === 0) return null

  return (
    <section className="py-14 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Building2 className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Güncel Oranlar</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">Banka Kredi Faiz Oranları</h2>
            <p className="text-sm text-neutral-500 mt-1">Admin panelinden düzenli olarak güncellenmektedir</p>
          </div>
          <Link
            href="/kredi-hesaplama"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-neutral-200 text-sm font-semibold text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all shadow-card"
          >
            Kredi Hesapla
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Banka</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Aylık Faiz</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Yıllık (Bileşik)</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Min Vade</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Max Vade</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide" />
                </tr>
              </thead>
              <tbody>
                {rates.map((rate, idx) => (
                  <tr key={rate.id} className={`border-b border-neutral-50 hover:bg-neutral-50 transition-colors ${idx === 0 ? 'bg-success-50/50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          {rate.logo_url
                            ? <img src={rate.logo_url} alt={rate.banka_adi} className="w-full h-full object-contain" />
                            : <Building2 className="w-4 h-4 text-neutral-400" />
                          }
                        </div>
                        <div>
                          <p
                            className="text-sm font-semibold text-neutral-800 max-w-[180px] truncate"
                            title={rate.banka_adi}
                          >
                            {rate.banka_adi}
                          </p>
                          {idx === 0 && <span className="text-xs text-success-600 font-medium">En Düşük</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold text-neutral-800">{formatPct(rate.aylik_faiz)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-semibold text-neutral-600">
                        {formatPct((Math.pow(1 + rate.aylik_faiz / 100, 12) - 1) * 100)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-neutral-600">{rate.min_vade} ay</td>
                    <td className="px-5 py-3.5 text-right text-sm text-neutral-600">{rate.max_vade} ay</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/kredi-hesaplama?faiz=${rate.aylik_faiz}`}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                      >
                        Hesapla →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-neutral-100 flex items-center gap-1.5 text-xs text-neutral-400">
            <RefreshCw className="w-3 h-3" />
            Oranlar bilgilendirme amaçlıdır, değişkenlik gösterebilir. Güncel oran için bankanızla iletişime geçin.
          </div>
        </div>
      </div>
    </section>
  )
}
