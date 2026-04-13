import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase'
import SiteLayout from '@/components/layout/SiteLayout'
import { Clock, Tag, BookOpen, ArrowRight } from 'lucide-react'
import type { BlogPost } from '@/types'

export const metadata: Metadata = {
  title: 'Blog — Tasarruf Finansmanı & Kredi Rehberi',
  description: 'Tasarruf finansmanı, banka kredisi ve finansal kararlar hakkında detaylı yazılar. IRR hesaplama, TF nedir, banka seçimi ve daha fazlası.',
  openGraph: {
    title: 'Blog | Ucuz Finansman',
    description: 'Finansman kararlarınızı aydınlatacak detaylı yazılar.',
  },
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const db = createAdminClient()
    const { data } = await db
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image, category, tags, reading_time, published_at, author_name')
      .eq('published', true)
      .order('published_at', { ascending: false })
    return (data as BlogPost[]) ?? []
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <SiteLayout>
      <div className="bg-neutral-50 min-h-screen">
        {/* Banner */}
        <div className="bg-white border-b border-neutral-100 py-10 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary-600" />
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Blog</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mb-3">
              Finansman Rehberi
            </h1>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">
              Tasarruf finansmanı, banka kredisi ve finansal kararlar hakkında detaylı yazılar
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-100 p-16 text-center">
              <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-400 text-sm">Henüz blog yazısı yayınlanmamış.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map(post => (
                <article key={post.id} className="group bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-card-md hover:-translate-y-1 transition-all overflow-hidden">
                  {post.cover_image && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image src={post.cover_image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {post.category && (
                        <span className="text-xs font-semibold bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{post.category}</span>
                      )}
                      {post.reading_time && (
                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          <Clock className="w-3 h-3" />{post.reading_time} dk
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-neutral-900 text-sm leading-snug mb-2 group-hover:text-primary-700 transition-colors line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>
                    {post.excerpt && (
                      <p className="text-xs text-neutral-500 leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : ''}
                      </span>
                      <Link href={`/blog/${post.slug}`} className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:gap-2 transition-all">
                        Oku <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  )
}
