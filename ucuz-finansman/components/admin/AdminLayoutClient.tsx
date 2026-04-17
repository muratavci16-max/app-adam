'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Image, Megaphone, FileText, Settings,
  Building2, Menu as MenuIcon, AlignLeft, BookOpen, LogOut,
  ChevronLeft, ChevronRight, X, HardDrive
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/slider', label: 'Hero Slider', icon: Image },
  { href: '/admin/reklamlar', label: 'Reklam Alanları', icon: Megaphone },
  { href: '/admin/komisyonlar', label: 'Banka Faizleri', icon: Building2 },
  { href: '/admin/menu', label: 'Menü Yönetimi', icon: MenuIcon },
  { href: '/admin/footer', label: 'Footer', icon: AlignLeft },
  { href: '/admin/icerik', label: 'Site İçeriği', icon: Settings },
  { href: '/admin/ortam', label: 'Ortam', icon: HardDrive },
  { href: '/admin/blog', label: 'Blog Yazıları', icon: BookOpen },
]

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then((res) => {
      const data = res.data
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      if (!data.user || (adminEmail && data.user.email !== adminEmail)) {
        router.push('/auth/giris?redirect=/admin')
        setAuthorized(false)
      } else {
        setAuthorized(true)
      }
    })
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 h-screen z-40 lg:z-auto
        flex flex-col bg-neutral-900 text-neutral-100
        transition-all duration-200
        ${collapsed ? 'w-16' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800 flex-shrink-0">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight">Admin Panel</span>
            </Link>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-white' : 'text-neutral-500 group-hover:text-white'}`} />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-3 space-y-1 flex-shrink-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all"
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Siteyi Görüntüle'}
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-neutral-400 hover:bg-red-900/40 hover:text-red-300 transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Çıkış Yap'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="text-sm font-semibold text-neutral-700">
            {navItems.find(n => n.exact ? pathname === n.href : pathname.startsWith(n.href))?.label ?? 'Admin'}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-neutral-500 hover:text-primary-600 transition-colors"
            >
              Siteyi Görüntüle →
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
