/**
 * SchoolVan brand tokens, shared across both apps so the driver and parent
 * experiences stay visually consistent.
 */

export const Brand = {
  /** Primary — school-bus yellow. */
  primary: '#F5B301',
  primaryDark: '#C68E00',
  /** Accent used for live/active states. */
  accent: '#2F6BFF',
  success: '#1FA463',
  warning: '#E8870B',
  danger: '#E5484D',
  neutral: '#60646C',
} as const;

/** Colors for a ride status chip, keyed by RideStatus. */
export const RideStatusColor = {
  waiting: Brand.neutral,
  onboard: Brand.accent,
  dropped: Brand.success,
  absent: Brand.danger,
} as const;

export const RideStatusLabel = {
  waiting: 'Waiting',
  onboard: 'On board',
  dropped: 'Dropped off',
  absent: 'Absent',
} as const;

export type RideStatus = keyof typeof RideStatusColor;
