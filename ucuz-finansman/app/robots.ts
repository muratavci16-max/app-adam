import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ucuzfinansman.com'
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/auth/'] },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
