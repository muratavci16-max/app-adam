'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, TrendingUp, Calculator, BarChart2, Home, User, LogOut, ChevronDown, Coins } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navItems = [
  { href: '/',                   label: 'Anasayfa',             icon: Home },
  { href: '/tasarruf-finansmani', label: 'Tasarruf Finansmanı', icon: TrendingUp },
  { href: '/kredi-hesaplama',    label: 'Kredi Hesaplama',      icon: Calculator },
  { href: '/karsilastirma',      label: 'Karşılaştırma',        icon: BarChart2 },
  { href: '/blog',               label: 'Blog',                 icon: Coins },
]

export default function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then((res) => setUser(res.data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserMenuOpen(false)
    window.location.href = '/'
  }

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-0">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 mr-8">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-[0_2px_10px_rgba(14,165,233,.35)]">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
              </svg>
            </div>
            <div>
              <span className="text-[1.05rem] font-extrabold text-neutral-900 tracking-tight">Ucuz Finansman</span>
              <span className="hidden sm:inline-block text-[0.6rem] font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full ml-1.5">BETA</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.8rem] font-medium transition-all duration-150 whitespace-nowrap ${
                    active
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[0.8rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate">{user.email}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-card-md border border-neutral-100 py-1 z-50">
                    <Link
                      href="/hesaplamarim"
                      className="flex items-center gap-2 px-4 py-2.5 text-[0.82rem] text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <BarChart2 className="w-4 h-4 text-neutral-400" />
                      Hesaplamalarım
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[0.82rem] text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/giris"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.8rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-all"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/karsilastirma"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white text-[0.8rem] font-semibold shadow-[0_2px_8px_rgba(14,165,233,.35)] hover:shadow-[0_4px_14px_rgba(14,165,233,.45)] hover:-translate-y-px transition-all duration-150 whitespace-nowrap"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">Karşılaştır</span>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-neutral-100 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[0.85rem] font-medium transition-all ${
                    active
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
            {!user && (
              <Link
                href="/auth/giris"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[0.85rem] font-medium text-neutral-600 hover:bg-neutral-50"
              >
                <User className="w-4 h-4" />
                Giriş Yap
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
