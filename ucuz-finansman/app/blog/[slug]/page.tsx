import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createAnonClient } from '@/lib/supabase'
import SiteLayout from '@/components/layout/SiteLayout'
import AdBanner from '@/components/ui/AdBanner'
import BlogSidebarCalc from '@/components/blog/BlogSidebarCalc'
import { Clock, Tag, ArrowLeft, Calendar, User } from 'lucide-react'
import type { BlogPost } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
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

async function getPopularPosts(excludeSlug: string): Promise<Pick<BlogPost, 'slug' | 'title' | 'reading_time' | 'category' | 'published_at'>[]> {
  try {
    const db = createAnonClient()
    const { data } = await db
      .from('blog_posts')
      .select('slug, title, reading_time, category, published_at')
      .eq('published', true)
      .neq('slug', excludeSlug)
      .order('published_at', { ascending: false })
      .limit(5)
    return (data as Pick<BlogPost, 'slug' | 'title' | 'reading_time' | 'category' | 'published_at'>[]) ?? []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
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
  const { slug } = await params
  const [post, popularPosts] = await Promise.all([getPost(slug), getPopularPosts(slug)])
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

            {/* Main article */}
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

                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-snug mb-4">{post.title}</h1>

                {post.excerpt && (
                  <p className="text-neutral-500 text-base leading-relaxed border-l-4 border-primary-400 pl-4">{post.excerpt}</p>
                )}
              </div>

              {/* Content */}
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 sm:p-10 mb-6">
                <div
                  className="blog-content prose prose-neutral max-w-none prose-headings:font-extrabold prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-p:leading-relaxed prose-p:text-neutral-700 prose-li:text-neutral-700"
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
            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
              <AdBanner placement="sidebar" />

              {/* Mini karşılaştırma hesaplayıcı */}
              <BlogSidebarCalc />

              {/* Popüler yazılar */}
              {popularPosts.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-100 p-4">
                  <h3 className="font-bold text-xs text-neutral-600 uppercase tracking-wide mb-3">Son Yazılar</h3>
                  <div className="space-y-3">
                    {popularPosts.map(p => (
                      <Link
                        key={p.slug}
                        href={`/blog/${p.slug}`}
                        className="block group"
                      >
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-700 group-hover:text-primary-600 transition-colors leading-snug line-clamp-2">{p.title}</p>
                            {p.reading_time && (
                              <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{p.reading_time} dk
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/blog" className="block mt-4 text-center text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                    Tüm yazıları gör →
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
