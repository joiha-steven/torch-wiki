// Shared top-nav links. Used by BOTH the global Header and the browse-page
// BrowseHeader so the nav can't drift between them (was duplicated in each).
export const NAV = [
  { href: '/',        label: 'Browse' },
  { href: '/brands',  label: 'Brands' },
  { href: '/top',     label: 'Top' },
  { href: '/compare', label: 'Compare' },
  { href: '/report',  label: 'Report' },
] as const

// Grouped under the "Information" dropdown (rendered by components/InfoMenu,
// styled like the user menu). On mobile these are flattened into the nav list.
export const INFO_NAV = [
  { href: '/log',      label: 'Log' },
  { href: '/guide',    label: 'Guide' },
  { href: '/terms',    label: 'Terms' },
] as const
