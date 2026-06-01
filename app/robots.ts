import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/adminroot', '/api/'],
    },
    sitemap: 'https://torch.edc.wiki/sitemap.xml',
  }
}
