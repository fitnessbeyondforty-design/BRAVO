import type { MetadataRoute } from 'next'
import { getCategoriesWithCounts, getPublishedSlugs } from '@/server/db/queries'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://bravoworldrecords.com'
  const [records, cats] = await Promise.all([getPublishedSlugs(), getCategoriesWithCounts()])
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/records`, changeFrequency: 'daily', priority: 0.9 },
    ...['about', 'contact', 'terms'].map((p) => ({ url: `${base}/${p}`, changeFrequency: 'yearly' as const, priority: 0.3 })),
    ...cats.map((c) => ({ url: `${base}/records?category=${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...records.map((r) => ({ url: `${base}/records/${r.slug}`, lastModified: r.publishedAt ?? undefined, priority: 0.7 })),
  ]
}
