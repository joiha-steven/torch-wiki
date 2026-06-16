import { supabase } from '@/lib/supabase'
import { brandSlug } from '@/lib/brand'
import { SITE_URL as BASE } from '@/lib/seo'

// Regenerate hourly - content is reference data, not real-time
export const revalidate = 3600

export async function GET() {
  const [{ count }, { data: brandRows }] = await Promise.all([
    supabase.from('flashlights').select('*', { count: 'exact', head: true }),
    supabase.rpc('get_distinct_brands'),
  ])

  const brands = ((brandRows ?? []) as { brand: string }[])
    .map(r => r.brand)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  const brandLines = brands
    .map(name => `- [${name}](${BASE}/brand/${brandSlug(name)}): All ${name} flashlights with specs, organized by release year.`)
    .join('\n')

  const body = `# torch.EDC.wiki

> A community-maintained reference database of flashlights for collectors and enthusiasts. Each flashlight has full specifications (output in lumens, beam distance, emitter/LED, battery, charging, dimensions, weight, material, IP rating, price), reviews, images and release history. Covers EDC, tactical, thrower, flood, headlamp, weapon-light, search-and-rescue, diving and custom flashlights.

The database currently holds ${count ?? 'hundreds of'} flashlights across ${brands.length} brands and custom makers. Data is contributed and reviewed by the community. Content is free to read and cite; please attribute torch.EDC.wiki and link back to the source page.

## Key pages

- [Browse all flashlights](${BASE}/): Filterable, searchable index of every flashlight by category, brand, battery, emitter, output, price and country of origin.
- [Brands & makers](${BASE}/brands): Index of every brand and custom maker with model counts and company info.
- [Top lists](${BASE}/top): Curated rankings - recently added, newest releases, most expensive, best value.
- [Compare flashlights](${BASE}/compare): Side-by-side spec comparison of up to four lights.
- [Updates](${BASE}/updates): Changelog of new flashlights, features and improvements.
- [Contribute](${BASE}/contribute): How to add a flashlight or improve existing data.

## Data conventions

- Each flashlight lives at ${BASE}/{slug} and exposes Schema.org Product structured data (JSON-LD).
- Output is given as max/min lumens; beam distance ("throw") in metres.
- Battery support can list alternatives (e.g. 2x 18350 or 1x 18650).
- "Brand origin" is where the company is based; "Made in" is where products are manufactured (these can differ).

## Brands

${brandLines}

## More

- [Sitemap](${BASE}/sitemap.xml): Machine-readable list of every flashlight, brand and page URL.
- [Report an issue](${BASE}/report): Flag incorrect data or a missing flashlight.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
