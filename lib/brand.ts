// Brand name → URL slug. "Cool Fall" → "cool-fall", "LED Lenser" → "led-lenser".
// Brand pages live at /brand/[slug]; slugs are derived from the distinct brand
// names on flashlights, so every brand gets a page even without a `brands` row.
export function brandSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
