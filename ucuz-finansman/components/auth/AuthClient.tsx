'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn, UserPlus, Mail, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toast'
import { resolveRedirect } from '@/lib/auth-redirect'

interface AuthClientProps {
  mode: 'giris' | 'kayit'
}

export default function AuthClient({ mode }: AuthClientProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedEmail = email.trim()
    if (password.trim().length === 0) {
      showToast('Geçerli bir şifre giriniz.', 'error')
      return
    }

    setLoading(true)

    try {
      if (mode === 'giris') {
        const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password })
        if (error) {
          showToast(error.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı.' : error.message, 'error')
        } else {
          showToast('Giriş başarılı!', 'success')
          const target = resolveRedirect(searchParams.get('redirect'))
          router.push(target)
        }
      } else {
        const { error } = await supabase.auth.signUp({ email: trimmedEmail, password })
        if (error) {
          showToast(error.message, 'error')
        } else {
          setSuccess(true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-neutral-200 rounded-xl px-4 py-3 pl-10 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white"

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl shadow-card-md border border-neutral-100 p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-success-600" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">E-postanızı Doğrulayın</h2>
          <p className="text-sm text-neutral-500 mb-6">
            <strong className="text-neutral-700">{email}</strong> adresine doğrulama e-postası gönderdik.
            E-postanızdaki linke tıklayarak hesabınızı aktifleştirin.
          </p>
          <Link
            href="/auth/giris"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-all"
          >
            Giriş Sayfasına Git
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-card-md border border-neutral-100 p-8 max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
            {mode === 'giris' ? <LogIn className="w-6 h-6 text-primary-600" /> : <UserPlus className="w-6 h-6 text-primary-600" />}
          </div>
          <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
            {mode === 'giris' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {mode === 'giris' ? 'Hesaplamalarınıza erişin' : 'Ücretsiz hesap açın'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5">E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className={inputClass + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-primary-700 hover:to-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'giris' ? (
              <><LogIn className="w-4 h-4" /> Giriş Yap</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Kayıt Ol</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-500">
          {mode === 'giris' ? (
            <>Hesabınız yok mu?{' '}<Link href="/auth/kayit" className="text-primary-600 font-semibold hover:underline">Kayıt Ol</Link></>
          ) : (
            <>Zaten hesabınız var mı?{' '}<Link href="/auth/giris" className="text-primary-600 font-semibold hover:underline">Giriş Yap</Link></>
          )}
        </div>
      </div>
    </div>
  )
}
