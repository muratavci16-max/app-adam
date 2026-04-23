import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ucuzfinansman.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/tasarruf-finansmani`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/kredi-hesaplama`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/karsilastirma`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/optimizasyon`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ]

  try {
    const db = createAdminClient()
    const { data: posts } = await db
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true)

    const blogPages: MetadataRoute.Sitemap = (posts ?? []).map(post => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...blogPages]
  } catch {
    return staticPages
  }
}
