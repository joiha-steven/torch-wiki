import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { brandSlug } from '@/lib/brand'
import { SITE_URL as BASE } from '@/lib/seo'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await supabase
    .from('flashlights')
    .select('slug, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  const flashlightUrls: MetadataRoute.Sitemap = (data ?? []).map(f => ({
    url: `${BASE}/${f.slug}`,
    lastModified: new Date(f.updated_at),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const { data: brandRows } = await supabase.rpc('get_distinct_brands')
  const brandUrls: MetadataRoute.Sitemap = ((brandRows ?? []) as { brand: string }[])
    .map(r => r.brand)
    .filter(Boolean)
    .map(name => ({
      url: `${BASE}/brand/${brandSlug(name)}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  return [
    ...brandUrls,
    { url: BASE,                   lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/brands`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/top`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/log`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/guide`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contribute`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/compare`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/report`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ...flashlightUrls,
  ]
}
