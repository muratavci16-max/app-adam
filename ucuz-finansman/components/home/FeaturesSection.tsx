import Link from 'next/link'
import { TrendingUp, Calculator, BarChart2, ArrowRight, Shield, Zap, BookOpen } from 'lucide-react'

const features = [
  {
    icon: TrendingUp,
    color: 'from-primary-600 to-primary-400',
    bg: 'bg-primary-50',
    iconColor: 'text-primary-600',
    title: 'Tasarruf Finansmanı Planı',
    description: 'Aylık taksitinizi girin, teslim tarihinizi ve tüm ödeme planınızı anında hesaplayın. Eşit veya artışlı taksit seçenekleri.',
    href: '/tasarruf-finansmani',
    cta: 'Planı Hesapla',
    badge: 'TF Hesaplayıcı',
  },
  {
    icon: Calculator,
    color: 'from-accent-600 to-accent-400',
    bg: 'bg-accent-50',
    iconColor: 'text-accent-600',
    title: 'Banka Kredisi Planı',
    description: 'Annüite formülü ile tam amortisman tablosu. Her taksitin faiz/anapara dağılımını görün.',
    href: '/kredi-hesaplama',
    cta: 'Krediyi Hesapla',
    badge: 'Kredi Hesaplayıcı',
  },
  {
    icon: BarChart2,
    color: 'from-success-600 to-success-400',
    bg: 'bg-success-50',
    iconColor: 'text-success-600',
    title: 'IRR Karşılaştırma Analizi',
    description: 'Efektif faiz oranı (IRR) ile her iki sistemi bilimsel metodla karşılaştırın. Hangi seçenek daha ucuz?',
    href: '/karsilastirma',
    cta: 'Karşılaştır',
    badge: 'En Popüler',
  },
]

const highlights = [
  { icon: Shield, title: 'Güvenilir Hesaplama', desc: 'Newton-Raphson algoritması ile yüksek doğruluklu IRR hesaplama' },
  { icon: Zap, title: 'Anlık Sonuç', desc: 'Parametreleri girin, milisaniyeler içinde detaylı plan hazır' },
  { icon: BookOpen, title: 'Bilgi Kaynağı', desc: 'Blog yazılarıyla finansman sistemi hakkında derinlemesine bilgi edinin' },
]

export default function FeaturesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full mb-3">
            <Zap className="w-3 h-3" /> Tüm Araçlar
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mb-3">
            Finansal Kararınızı Bilinçli Verin
          </h2>
          <p className="text-neutral-500 text-sm max-w-lg mx-auto leading-relaxed">
            Üç güçlü hesaplama aracı ile tasarruf finansmanı veya banka kredisi seçimini veriye dayalı yapın.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.href} className="group bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-card-md hover:-translate-y-1 transition-all duration-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${f.iconColor}`} />
                    </div>
                    <span className={`text-xs font-semibold ${f.iconColor} ${f.bg} px-2.5 py-1 rounded-full`}>{f.badge}</span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2 group-hover:text-primary-700 transition-colors">{f.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-5">{f.description}</p>
                  <Link
                    href={f.href}
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${f.iconColor} hover:gap-2.5 transition-all`}
                  >
                    {f.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Highlights row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-50 rounded-2xl p-6">
          {highlights.map((h) => {
            const Icon = h.icon
            return (
              <div key={h.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 shadow-card flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{h.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
