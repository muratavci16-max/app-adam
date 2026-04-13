'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Save, Eye, EyeOff, ArrowLeft, Clock, Tag, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toast'
import { inputCls, labelCls, btnPrimary, btnSecondary } from '../AdminCard'
import type { BlogPost } from '@/types'

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false })

interface Props {
  mode: 'create' | 'edit'
  postId?: string
}

const emptyPost: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'> = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  published: false,
  published_at: null,
  author_name: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  og_image: '',
  schema_type: 'Article',
  reading_time: null,
  category: '',
  tags: [],
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function calcReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, '')
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export default function BlogEditorClient({ mode, postId }: Props) {
  const [post, setPost] = useState<typeof emptyPost>(emptyPost)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content')
  const [tagInput, setTagInput] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (mode === 'edit' && postId) {
      supabase.from('blog_posts').select('*').eq('id', postId).single()
        .then(({ data }) => {
          if (data) {
            const { id, created_at, updated_at, ...rest } = data as BlogPost
            void id; void created_at; void updated_at
            setPost(rest)
            setTagInput((rest.tags ?? []).join(', '))
          }
          setLoading(false)
        })
    }
  }, [mode, postId])

  const set = (field: keyof typeof emptyPost, val: string | boolean | string[] | null | number) =>
    setPost(p => ({ ...p, [field]: val }))

  const handleTitleChange = (title: string) => {
    setPost(p => ({
      ...p,
      title,
      slug: p.slug || slugify(title),
      seo_title: p.seo_title || title,
    }))
  }

  const handleContentChange = (html: string) => {
    setPost(p => ({
      ...p,
      content: html,
      reading_time: calcReadingTime(html),
    }))
  }

  const handleTagsBlur = () => {
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean)
    set('tags', tags)
  }

  const handleSave = async (publish?: boolean) => {
    if (!post.title.trim()) { showToast('Başlık gerekli', 'error'); return }
    if (!post.slug.trim()) { showToast('Slug gerekli', 'error'); return }

    setSaving(true)
    const payload = {
      ...post,
      slug: slugify(post.slug),
      published: publish ?? post.published,
      published_at: (publish ?? post.published) ? (post.published_at ?? new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    }

    try {
      if (mode === 'create') {
        const { data, error } = await supabase.from('blog_posts').insert({ ...payload, created_at: new Date().toISOString() }).select('id').single()
        if (error) throw error
        showToast('Yazı oluşturuldu', 'success')
        router.push(`/admin/blog/${data.id}`)
      } else {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', postId!)
        if (error) throw error
        showToast('Yazı güncellendi', 'success')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      showToast('Hata: ' + msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-neutral-400 text-sm">Yükleniyor...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/blog')} className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-neutral-900">{mode === 'create' ? 'Yeni Yazı' : 'Yazıyı Düzenle'}</h1>
            {post.reading_time && (
              <span className="flex items-center gap-1 text-xs text-neutral-400">
                <Clock className="w-3 h-3" /> Tahmini okuma: {post.reading_time} dk
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => handleSave(false)} disabled={saving} className={btnSecondary}>
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Kaydediliyor...' : 'Taslak Kaydet'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className={btnPrimary}>
            <Eye className="w-3.5 h-3.5" />
            {post.published ? 'Güncelle' : 'Yayınla'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-neutral-100 p-1 rounded-xl w-fit">
        {(['content', 'seo', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab ? 'bg-white text-neutral-800 shadow-card' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            {tab === 'content' ? 'İçerik' : tab === 'seo' ? 'SEO' : 'Ayarlar'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        {/* Main content area */}
        <div className="space-y-4">
          {activeTab === 'content' && (
            <>
              <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
                <div>
                  <input
                    className="w-full text-2xl font-extrabold text-neutral-900 border-none outline-none placeholder:text-neutral-300 bg-transparent"
                    value={post.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Yazı başlığı..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Özet (excerpt)</label>
                  <textarea
                    className={inputCls + ' resize-none h-16'}
                    value={post.excerpt ?? ''}
                    onChange={e => set('excerpt', e.target.value)}
                    placeholder="Kısa açıklama (liste sayfasında gösterilir)"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <div className="border-b border-neutral-100 px-5 py-3">
                  <p className="text-xs font-semibold text-neutral-500">İçerik Editörü</p>
                </div>
                <div className="p-5">
                  <TiptapEditor content={post.content} onChange={handleContentChange} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'seo' && (
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-primary-600" />
                <h2 className="font-bold text-sm text-neutral-800">SEO Ayarları</h2>
              </div>

              {/* Preview */}
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <p className="text-xs text-neutral-400 mb-2 font-medium">Google Arama Önizlemesi</p>
                <p className="text-blue-600 text-sm font-medium hover:underline cursor-pointer truncate">
                  {post.seo_title || post.title || 'Sayfa Başlığı'}
                </p>
                <p className="text-green-700 text-xs mt-0.5">ucuzfinansman.com/blog/{post.slug || 'yazi-slug'}</p>
                <p className="text-neutral-600 text-xs mt-1 line-clamp-2">
                  {post.seo_description || post.excerpt || 'Meta açıklama buraya gelecek...'}
                </p>
              </div>

              <div>
                <label className={labelCls}>SEO Başlığı (Title tag)</label>
                <input className={inputCls} value={post.seo_title ?? ''} onChange={e => set('seo_title', e.target.value)} placeholder={post.title} />
                <p className={`text-xs mt-1 ${(post.seo_title?.length ?? 0) > 60 ? 'text-amber-500' : 'text-neutral-400'}`}>
                  {post.seo_title?.length ?? 0}/60 karakter {(post.seo_title?.length ?? 0) > 60 && '— çok uzun!'}
                </p>
              </div>

              <div>
                <label className={labelCls}>Meta Açıklama (Description)</label>
                <textarea className={inputCls + ' resize-none h-20'} value={post.seo_description ?? ''} onChange={e => set('seo_description', e.target.value)} />
                <p className={`text-xs mt-1 ${(post.seo_description?.length ?? 0) > 160 ? 'text-amber-500' : 'text-neutral-400'}`}>
                  {post.seo_description?.length ?? 0}/160 karakter
                </p>
              </div>

              <div>
                <label className={labelCls}>Keywords (virgülle ayırın)</label>
                <input className={inputCls} value={post.seo_keywords ?? ''} onChange={e => set('seo_keywords', e.target.value)} placeholder="tasarruf finansmanı, kredi hesaplama" />
              </div>

              <div>
                <label className={labelCls}>OG Image URL</label>
                <input className={inputCls} value={post.og_image ?? ''} onChange={e => set('og_image', e.target.value)} placeholder="https://..." />
                <p className="text-xs text-neutral-400 mt-1">Sosyal medya paylaşımlarında görünecek görsel (1200x630 önerilir)</p>
              </div>

              <div>
                <label className={labelCls}>Schema Type</label>
                <select className={inputCls} value={post.schema_type ?? 'Article'} onChange={e => set('schema_type', e.target.value)}>
                  <option value="Article">Article</option>
                  <option value="BlogPosting">BlogPosting</option>
                  <option value="HowTo">HowTo</option>
                  <option value="FAQPage">FAQPage</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
              <h2 className="font-bold text-sm text-neutral-800 mb-2">Yazı Ayarları</h2>

              <div>
                <label className={labelCls}>URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 flex-shrink-0">/blog/</span>
                  <input
                    className={inputCls}
                    value={post.slug}
                    onChange={e => set('slug', e.target.value)}
                    onBlur={e => set('slug', slugify(e.target.value))}
                    placeholder="yazi-url-slug"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Yazar</label>
                <input className={inputCls} value={post.author_name ?? ''} onChange={e => set('author_name', e.target.value)} placeholder="Yazar adı" />
              </div>

              <div>
                <label className={labelCls}>Kategori</label>
                <input className={inputCls} value={post.category ?? ''} onChange={e => set('category', e.target.value)} placeholder="Tasarruf Finansmanı, Kredi..." />
              </div>

              <div>
                <label className={labelCls}>Etiketler (virgülle ayırın)</label>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {(post.tags ?? []).map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" />{tag}
                    </span>
                  ))}
                </div>
                <input
                  className={inputCls}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onBlur={handleTagsBlur}
                  placeholder="tasarruf, kredi, irr hesaplama"
                />
              </div>

              <div>
                <label className={labelCls}>Kapak Görseli URL</label>
                <input className={inputCls} value={post.cover_image ?? ''} onChange={e => set('cover_image', e.target.value)} placeholder="https://..." />
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                <input type="checkbox" id="published" checked={post.published} onChange={e => set('published', e.target.checked)} className="rounded accent-primary-600 cursor-pointer" />
                <label htmlFor="published" className="text-sm font-medium text-neutral-700 cursor-pointer flex items-center gap-2">
                  {post.published ? <Eye className="w-4 h-4 text-success-600" /> : <EyeOff className="w-4 h-4 text-neutral-400" />}
                  {post.published ? 'Yayında' : 'Taslak'}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-neutral-100 p-4">
            <h3 className="font-bold text-xs text-neutral-600 uppercase tracking-wide mb-3">Hızlı Bilgiler</h3>
            <div className="space-y-2.5 text-xs">
              {[
                ['Slug', `/${post.slug || '—'}`],
                ['Okuma Süresi', post.reading_time ? `${post.reading_time} dk` : '—'],
                ['Kategori', post.category || '—'],
                ['Durum', post.published ? '🟢 Yayında' : '⚫ Taslak'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-start gap-2">
                  <span className="text-neutral-400">{k}</span>
                  <span className="font-medium text-neutral-700 text-right truncate max-w-[160px]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-4">
            <h3 className="font-bold text-xs text-neutral-600 uppercase tracking-wide mb-3">SEO Skoru</h3>
            <div className="space-y-2">
              {[
                { label: 'Başlık uzunluğu', ok: post.title.length >= 30 && post.title.length <= 60 },
                { label: 'Meta açıklama', ok: (post.seo_description?.length ?? 0) >= 100 },
                { label: 'SEO başlığı', ok: !!post.seo_title },
                { label: 'Slug belirlendi', ok: !!post.slug },
                { label: 'Özet eklendi', ok: !!post.excerpt },
                { label: 'Kapak görseli', ok: !!post.cover_image },
                { label: 'Kategori seçildi', ok: !!post.category },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white flex-shrink-0 ${item.ok ? 'bg-success-500' : 'bg-neutral-200'}`}>
                    {item.ok ? '✓' : '·'}
                  </span>
                  <span className={item.ok ? 'text-neutral-700' : 'text-neutral-400'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
