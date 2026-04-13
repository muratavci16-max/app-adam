import Link from 'next/link'
import { ClipboardList, Calculator, BarChart2, CheckCircle2, ArrowRight } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: ClipboardList,
    title: 'Parametrelerinizi Girin',
    description: 'Finansman tutarı, peşinat, aylık taksit veya faiz oranı gibi temel bilgileri girin.',
  },
  {
    step: '02',
    icon: Calculator,
    title: 'Anında Hesaplayın',
    description: 'Sistem saniyeler içinde tüm ödeme planını, teslim tarihini ve maliyet analizini hesaplar.',
  },
  {
    step: '03',
    icon: BarChart2,
    title: 'Karşılaştırın & Karar Verin',
    description: 'IRR bazlı karşılaştırma ile hangi finansman türünün gerçekten daha ucuz olduğunu görün.',
  },
  {
    step: '04',
    icon: CheckCircle2,
    title: 'Kaydedin & Paylaşın',
    description: 'Hesaplamanızı kaydedin, farklı senaryolarla karşılaştırın, bilinçli kararınızı verin.',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mb-3">Nasıl Kullanılır?</h2>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">4 basit adımda finansal kararınızı netleştirin</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((s, idx) => {
            const Icon = s.icon
            return (
              <div key={idx} className="relative">
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-neutral-100 z-0" style={{ width: 'calc(100% - 2rem)' }} />
                )}
                <div className="bg-neutral-50 rounded-2xl p-5 relative z-10">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-xs font-black text-primary-400 bg-primary-50 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">{s.step}</span>
                    <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4.5 h-4.5 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-800 mb-1.5">{s.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{s.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-extrabold mb-2">Hemen Başlayın</h3>
          <p className="text-primary-200 text-sm mb-6 max-w-md mx-auto">
            Kayıt gerektirmez. Saniyeler içinde hesaplamanızı yapın.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/karsilastirma"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-700 font-bold text-sm hover:bg-primary-50 transition-all"
            >
              <BarChart2 className="w-4 h-4" />
              Karşılaştır
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/tasarruf-finansmani"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 border border-primary-500 text-white font-semibold text-sm hover:bg-primary-500 transition-all"
            >
              TF Planı Hesapla
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
