import { track } from '@vercel/analytics'

/**
 * Centralized Vercel Analytics custom events ("goals").
 *
 * Each key here maps to an event name shown in the Vercel dashboard
 * (Analytics → Events). To turn one into a conversion goal, open the
 * event in the dashboard and mark it as a goal.
 *
 * Vercel Analytics is cookieless, so these fire without cookie consent.
 * Keep custom-property values low-cardinality (no user ids / emails) —
 * the free plan caps custom-event properties.
 */
export const AnalyticsEvent = {
  Signup: 'Signup',
  CollectionAdd: 'Collection Add',
  WishlistAdd: 'Wishlist Add',
  ContributionNew: 'Contribution New',
  ContributionEdit: 'Contribution Edit',
} as const

type EventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent]

export function trackEvent(
  name: EventName,
  properties?: Record<string, string | number | boolean | null>,
) {
  track(name, properties)
}
