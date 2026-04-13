'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart2, TrendingUp, Calculator, Trash2, ExternalLink, Plus, BookmarkCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatTL } from '@/lib/hesaplamalar'
import type { SavedPlan } from '@/types'
import { showToast } from '@/components/ui/Toast'

const typeIcons = {
  tasarruf: { icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50', label: 'TF Planı', href: '/tasarruf-finansmani' },
  kredi: { icon: Calculator, color: 'text-accent-600', bg: 'bg-accent-50', label: 'Kredi', href: '/kredi-hesaplama' },
  karsilastirma: { icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Karşılaştırma', href: '/karsilastirma' },
}

export default function HesaplamarimClient() {
  const [plans, setPlans] = useState<SavedPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<null | { email?: string }>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then((res) => {
      const data = res.data
      if (!data.user) {
        router.push('/auth/giris')
        return
      }
      setUser({ email: data.user.email })
      loadPlans(data.user.id)
    })
  }, [router])

  const loadPlans = async (userId: string) => {
    const { data } = await supabase
      .from('saved_plans')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    setPlans((data as SavedPlan[]) ?? [])
    setLoading(false)
  }

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from('saved_plans').delete().eq('id', id)
    if (!error) {
      setPlans(prev => prev.filter(p => p.id !== id))
      showToast('Plan silindi', 'success')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2.5 mb-2">
            <BookmarkCheck className="w-5 h-5 text-neutral-300" />
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">Kayıtlı Planlar</span>
          </div>
          <h1 className="text-white text-xl font-extrabold">Hesaplamalarım</h1>
          <p className="text-neutral-400 text-sm mt-1">{user?.email}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {plans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="w-7 h-7 text-neutral-400" />
            </div>
            <h2 className="text-base font-bold text-neutral-700 mb-2">Henüz kayıtlı plan yok</h2>
            <p className="text-sm text-neutral-500 mb-6">Hesaplamalarınızı kaydederek buradan kolayca erişebilirsiniz.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/karsilastirma" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-all">
                <Plus className="w-4 h-4" /> Yeni Hesaplama
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => {
              const t = typeIcons[plan.type]
              const Icon = t.icon
              return (
                <div key={plan.id} className="bg-white rounded-2xl border border-neutral-100 shadow-card p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${t.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${t.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-neutral-800 text-sm truncate">{plan.name}</p>
                      <span className={`text-xs font-semibold ${t.color} ${t.bg} px-2 py-0.5 rounded-full flex-shrink-0`}>{t.label}</span>
                    </div>
                    {plan.result_snapshot && (
                      <div className="flex gap-4 text-xs text-neutral-500">
                        {plan.result_snapshot.toplamOdeme && <span>Toplam: <strong>{formatTL(plan.result_snapshot.toplamOdeme)}</strong></span>}
                        {plan.result_snapshot.aylikTaksit && <span>Taksit: <strong>{formatTL(plan.result_snapshot.aylikTaksit)}</strong></span>}
                        {plan.result_snapshot.irrAylikPct !== undefined && (
                          <span>IRR: <strong>%{plan.result_snapshot.irrAylikPct.toFixed(2)}/ay</strong></span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(plan.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={t.href}
                      className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-primary-600 transition-all"
                      title="Hesaplamaya git"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="p-2 rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
