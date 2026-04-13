'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, EyeOff, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toast'
import { AdminSectionTitle, btnPrimary } from '../AdminCard'
import type { BlogPost } from '@/types'

export default function BlogListAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
      .then((res) => { setPosts((res.data as BlogPost[]) ?? []); setLoading(false) })
  }, [])

  const togglePublish = async (post: BlogPost) => {
    const published = !post.published
    const published_at = published ? new Date().toISOString() : null
    const { error } = await supabase.from('blog_posts').update({ published, published_at }).eq('id', post.id)
    if (!error) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, published, published_at } : p))
      showToast(published ? 'Yayınlandı' : 'Yayından kaldırıldı', 'success')
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm('Bu yazıyı silmek istediğinizden emin misiniz?')) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== id))
      showToast('Yazı silindi', 'success')
    }
  }

  if (loading) return <div className="text-center py-20 text-neutral-400 text-sm">Yükleniyor...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <AdminSectionTitle title="Blog Yazıları" desc="SEO odaklı blog içerik yönetimi" />
        <Link href="/admin/blog/yeni" className={btnPrimary}>
          <Plus className="w-4 h-4" /> Yeni Yazı
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
          <p className="text-neutral-400 text-sm mb-4">Henüz blog yazısı yok.</p>
          <Link href="/admin/blog/yeni" className={btnPrimary}>
            <Plus className="w-4 h-4" /> İlk Yazıyı Oluştur
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500">Başlık</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-neutral-500">Kategori</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-neutral-500">Okuma</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-neutral-500">Durum</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-neutral-500">Tarih</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800 truncate max-w-[300px]">{post.title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5 font-mono">/blog/{post.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {post.category ? (
                      <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">{post.category}</span>
                    ) : <span className="text-neutral-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {post.reading_time ? (
                      <span className="flex items-center gap-1 justify-center text-xs text-neutral-500">
                        <Clock className="w-3 h-3" />{post.reading_time} dk
                      </span>
                    ) : <span className="text-neutral-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${post.published ? 'bg-success-50 text-success-600' : 'bg-neutral-100 text-neutral-500'}`}>
                      {post.published ? 'Yayında' : 'Taslak'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-neutral-400">
                    {new Date(post.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => togglePublish(post)}
                        className={`p-1.5 rounded-lg transition-all ${post.published ? 'text-success-500 hover:bg-success-50' : 'text-neutral-400 hover:bg-neutral-100'}`}
                        title={post.published ? 'Yayından kaldır' : 'Yayınla'}
                      >
                        {post.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <Link href={`/admin/blog/${post.id}`} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 transition-all">
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => deletePost(post.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
