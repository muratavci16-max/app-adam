'use client'

import { useState } from 'react'
import { ChevronDown, Scale } from 'lucide-react'

interface Item {
  id: string
  title: string
  body: React.ReactNode
  source: string
}

const ITEMS: Item[] = [
  {
    id: 'cayma',
    title: '14 Günlük Cayma Hakkı',
    body: (
      <>
        Sözleşmeyi imzaladıktan sonra <strong>14 gün içinde</strong>, herhangi bir gerekçe
        göstermeksizin ve cezai şart ödemeksizin cayma hakkınız vardır. <strong>Organizasyon
        ücreti dahil</strong> tahsil edilen tüm tutarlar, cayma bildiriminin şirkete
        ulaşmasından itibaren 14 gün içinde <strong>iade</strong> edilir. Kesinti yapılamaz.
      </>
    ),
    source: 'Kanun 6361 m. 39/A fıkra 3; Yönetmelik m. 17 fıkra 8',
  },
  {
    id: 'mevduat-sigortasi',
    title: 'Mevduat Sigortası Kapsamı Dışındadır',
    body: (
      <>
        TF şirketlerinde biriktirdiğiniz tutarlar <strong>mevduat sigortası veya benzeri bir
        kamu güvence sistemi kapsamında değildir</strong>. Şirketin faaliyet izninin
        kaldırılması veya iradi tasfiyesi halinde geri ödemeler, Kanun 6361 m. 50/A
        kapsamında Kurul tarafından atanan tasfiye komisyonu tarafından yürütülür.
      </>
    ),
    source: 'Kanun 6361 m. 50/A; BDDK SSS',
  },
  {
    id: 'sozlesme-tipi',
    title: 'Sözleşme Tipi ve Teslim Şartları',
    body: (
      <>
        Bu hesaplayıcı <strong>müşteri-bazlı (çekilişsiz)</strong> TF sözleşmelerini
        modeller. Çekilişli sözleşmelerde tahsisat tarihi çekiliş sonucuna bağlıdır. Her iki
        sözleşme türünde de mevzuat, tahsisat için hem <strong>tasarrufun %40&apos;ı</strong> hem
        <strong> sözleşme süresinin %40&apos;ı</strong> şartını birlikte arar; müşteri-bazlı
        sözleşmelerde süre şartı peşinat oranı ile (<strong>150 gün + 5 ödeme</strong>
        sonrasında) azaltılabilir.
      </>
    ),
    source: 'Yönetmelik m. 21/2-a, m. 21/3, m. 21/4',
  },
]

export default function YasalBilgiPaneli() {
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
