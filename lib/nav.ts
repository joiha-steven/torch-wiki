// Shared top-nav links. Used by BOTH the global Header and the browse-page
// BrowseHeader so the nav can't drift between them (was duplicated in each).
export const NAV = [
  { href: '/',        label: 'Browse' },
  { href: '/brands',  label: 'Brands' },
  { href: '/top',     label: 'Top' },
  { href: '/compare', label: 'Compare' },
  { href: '/updates', label: 'Updates' },
  { href: '/report',  label: 'Report' },
] as const
