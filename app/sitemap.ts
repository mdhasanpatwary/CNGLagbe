import { MetadataRoute } from 'next'

export const revalidate = 86400 // Revalidate once every 24 hours

const CANONICAL_SITE_URL = 'https://www.cnglagbe.com'

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  // Guard against missing, invalid, or localhost env variables leaking into production sitemap
  if (!envUrl || envUrl.includes('localhost') || !envUrl.startsWith('http')) {
    return CANONICAL_SITE_URL
  }
  return envUrl.replace(/\/+$/, '')
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      // Driver directory — public, content-rich, high crawl value
      url: `${baseUrl}/directory`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]
}

