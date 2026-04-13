'use client'

import Link from 'next/link'
import { Image, Megaphone, Building2, Menu, AlignLeft, Settings, BookOpen, ArrowRight, BarChart3 } from 'lucide-react'

interface StatsProps {
  stats: { adsCount: number; plansCount: number; postsCount: number }
}

const quickLinks = [
  { href: '/admin/slider', icon: Image, label: 'Hero Slider', desc: 'Ana sayfa slider içerikleri', color: 'bg-primary-50 text-primary-600' },
  { href: '/admin/reklamlar', icon: Megaphone, label: 'Reklam Alanları', desc: 'Banner ve sponsor içerikler', color: 'bg-accent-50 text-accent-600' },
  { href: '/admin/komisyonlar', icon: Building2, label: 'Banka Faizleri', desc: 'Kredi faiz oranları tablosu', color: 'bg-success-50 text-success-600' },
  { href: '/admin/menu', icon: Menu, label: 'Menü Yönetimi', desc: 'Navigasyon linkleri', color: 'bg-orange-50 text-orange-600' },
  { href: '/admin/footer', icon: AlignLeft, label: 'Footer', desc: 'Alt bilgi ve iletişim', color: 'bg-purple-50 text-purple-600' },
  { href: '/admin/icerik', icon: Settings, label: 'Site İçeriği', desc: 'Başlıklar ve metinler', color: 'bg-neutral-100 text-neutral-600' },
  { href: '/admin/blog', icon: BookOpen, label: 'Blog Yazıları', desc: 'SEO\'lu blog yönetimi', color: 'bg-rose-50 text-rose-600' },
]

export default function AdminDashboardClient({ stats }: StatsProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-neutral-900">Yönetim Paneli</h1>
        <p className="text-sm text-neutral-500 mt-1">Tüm site içeriklerini buradan yönetebilirsiniz.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Aktif Reklam', value: stats.adsCount, icon: Megaphone, color: 'text-accent-600', bg: 'bg-accent-50' },
          { label: 'Kayıtlı Plan', value: stats.plansCount, icon: BarChart3, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Blog Yazısı', value: stats.postsCount, icon: BookOpen, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl border border-neutral-100 shadow-card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-neutral-900">{s.value}</p>
                <p className="text-xs text-neutral-500">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map(({ href, icon: Icon, label, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white rounded-xl border border-neutral-100 shadow-card hover:shadow-card-md hover:-translate-y-0.5 transition-all p-5 flex items-start gap-4"
          >
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-neutral-800 text-sm group-hover:text-primary-700 transition-colors">{label}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 transition-all mt-0.5 flex-shrink-0 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  )
}
