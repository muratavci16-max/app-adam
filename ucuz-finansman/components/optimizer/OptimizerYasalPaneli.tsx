'use client'

import { useState } from 'react'
import { ChevronDown, Scale } from 'lucide-react'

interface Item {
  id: string
  title: string
  body: React.ReactNode
  source: string
}

/**
 * Regulatory disclosure panel for /optimizasyon. Mirrors the structure of
 * YasalBilgiPaneli on /karsilastirma but with the specific citations the
 * optimizer page makes use of.
 */
const ITEMS: Item[] = [
  {
    id: 'vade-cap',
    title: 'Vade Üst Sınırı — Varlık Türüne Göre',
    body: (
      <>
        Tasarruf finansmanı sözleşmelerinde finansman döneminin azami vadesi
        <strong> konut ve çatılı iş yeri</strong> sözleşmeleri için
        <strong> 120 ay</strong>, <strong>taşıt</strong> sözleşmeleri için
        <strong> 60 ay</strong>&apos;ı aşamaz. Optimizer bu sınırlar içinde her
        tam ay değerini dener ve en uygun vadeyi gösterir.
      </>
    ),
    source: 'BDDK Yönetmelik m. 22/3',
  },
  {
    id: 'faizsizlik',
    title: 'TF Faizsiz Finansman Esaslıdır',
    body: (
      <>
        Tasarruf finansman sistemi, <strong>faiz içermeyen</strong> bir finansal
        model olarak düzenlenmiştir. Müşteriden toplanan taksitler yalnızca
        organizasyon ücreti kadar ek bir yük taşır; kredi faizi benzeri bir
        maliyet kalemi bulunmaz. Optimizer&apos;ın gösterdiği &ldquo;TF maliyet
        oranı&rdquo; değerleri, yalnızca banka kredisi eşdeğerine tercüme
        amacıyla hesaplanan <strong>referans</strong> oranlardır; TF
        sözleşmesinin kendisi faizsizdir.
      </>
    ),
    source: 'Kanun 6361 m. 3/l; m. 39/B fıkra 3',
  },
  {
    id: 'teslim-uc-kapi',
    title: 'Teslim (Tahsisat) Ayı — Üç Kapı Kuralı',
    body: (
      <>
        Tahsisat için mevzuat iki şartı birlikte arar:
        {' '}
        <strong>sözleşme tutarının %40&apos;ı kadar tasarruf</strong> ve
        {' '}
        <strong>sözleşme süresinin %40&apos;ı</strong>. Müşteri-bazlı
        sözleşmelerde süre şartı, peşinat oranı ile orantılı olarak
        azaltılabilir — ancak yalnızca sözleşmeden
        {' '}
        <strong>150 gün geçmiş ve 5 tasarruf ödemesi yapılmışsa</strong>.
        Bu nedenle optimizer&apos;ın gösterdiği teslim ayı en erken 5. ay
        olabilir.
      </>
    ),
    source: 'BDDK Yönetmelik m. 21/2-a, m. 21/3',
  },
  {
    id: 'org-ucreti-iade',
    title: 'Organizasyon Ücreti ve Cayma',
    body: (
      <>
        Sözleşmeyi imzaladıktan sonra <strong>14 gün içinde</strong> cayma
        hakkınız vardır. <strong>Organizasyon ücreti dahil</strong> tahsil
        edilen tüm tutarlar, cayma bildiriminin şirkete ulaşmasından itibaren
        14 gün içinde <strong>iade</strong> edilir. Optimizer&apos;ın önerdiği
        yapılandırmalarda da bu hak geçerlidir.
      </>
    ),
    source: 'Kanun 6361 m. 39/A fıkra 3',
  },
]

export default function OptimizerYasalPaneli() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-2xl shadow-card border border-neutral-100">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
        <Scale className="w-4 h-4 text-primary-600" />
        <h3 className="font-bold text-sm text-neutral-800">Yasal Bilgilendirme</h3>
      </div>
      <div className="divide-y divide-neutral-100">
        {ITEMS.map(item => {
          const open = openId === item.id
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
                className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-neutral-50 transition-colors"
              >
                <span className="text-sm font-semibold text-neutral-800">{item.title}</span>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open && (
                <div className="px-5 pb-4 -mt-1">
                  <p className="text-xs text-neutral-600 leading-relaxed">{item.body}</p>
                  <p className="text-[10px] text-neutral-400 mt-2">
                    Kaynak: {item.source}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
