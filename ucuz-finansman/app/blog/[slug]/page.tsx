import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createAnonClient } from '@/lib/supabase'
import SiteLayout from '@/components/layout/SiteLayout'
import AdBanner from '@/components/ui/AdBanner'
import { Clock, Tag, ArrowLeft, Calendar, User } from 'lucide-react'
import type { BlogPost } from '@/types'

interface Props {
  params: { slug: string }
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const db = createAnonClient()
    const { data } = await db
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
    return (data as BlogPost) ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Yazı Bulunamadı' }

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    keywords: post.seo_keywords?.split(',').map(k => k.trim()),
    authors: post.author_name ? [{ name: post.author_name }] : undefined,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || undefined,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      images: post.og_image ? [{ url: post.og_image }] : post.cover_image ? [{ url: post.cover_image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || undefined,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const schemaType = post.schema_type || 'Article'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: post.title,
    description: post.seo_description || post.excerpt,
    image: post.og_image || post.cover_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Person', name: post.author_name || 'Ucuz Finansman' },
    publisher: {
      '@type': 'Organization',
      name: 'Ucuz Finansman',
      url: process.env.NEXT_PUBLIC_SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`,
    },
  }

  return (
    <SiteLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="bg-neutral-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8">
            {/* Main */}
            <article className="min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
                <Link href="/blog" className="hover:text-primary-600 transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Blog
                </Link>
                <span>/</span>
                {post.category && <span className="text-primary-600 font-medium">{post.category}</span>}
              </div>

              {/* Cover */}
              {post.cover_image && (
                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-7">
                  <Image src={post.cover_image} alt={post.title} fill className="object-cover" priority />
                </div>
              )}

              {/* Header */}
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 sm:p-8 mb-6">
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  {post.category && (
                    <span className="text-xs font-semibold bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full">{post.category}</span>
                  )}
                  {post.reading_time && (
                    <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <Clock className="w-3.5 h-3.5" /> {post.reading_time} dk okuma
                    </span>
                  )}
                  {post.published_at && (
                    <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                  {post.author_name && (
                    <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <User className="w-3.5 h-3.5" /> {post.author_name}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight leading-snug mb-4">{post.title}</h1>

                {post.excerpt && (
                  <p className="text-neutral-500 text-sm leading-relaxed border-l-2 border-primary-400 pl-4">{post.excerpt}</p>
                )}
              </div>

              {/* Content */}
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 sm:p-8 mb-6">
                <div
                  className="blog-content"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-neutral-400" />
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-5">
              <AdBanner placement="sidebar" />

              <div className="bg-white rounded-2xl border border-neutral-100 p-4">
                <h3 className="font-bold text-xs text-neutral-600 uppercase tracking-wide mb-3">Hızlı Hesaplama</h3>
                <div className="space-y-2">
                  {[
                    { href: '/karsilastirma', label: 'TF vs Kredi Karşılaştır' },
                    { href: '/tasarruf-finansmani', label: 'TF Planı Hesapla' },
                    { href: '/kredi-hesaplama', label: 'Kredi Hesapla' },
                  ].map(l => (
                    <Link key={l.href} href={l.href} className="flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-primary-50">
                      <span className="w-1 h-1 rounded-full bg-primary-400" />
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
