/**
 * Same location and services as forever-faded-platform (prisma/seed.js).
 * Used by Dashboard "Seed location & services" to match the platform.
 */

export const SEED_LOCATION = {
  name: 'Forever Faded — Waukesha',
  address: '1427 E Racine Ave Suite H',
  city: 'Waukesha',
  state: 'WI',
  zip: '53186',
  phone: '(262) 349-9289',
  timezone: 'America/Chicago',
  isActive: true,
} as const;

export const SEED_SERVICES = [
  { category: 'Test', name: 'Test Service', description: 'For testing payments only', durationMinutes: 15, priceCents: 100 },
  { category: 'Face', name: 'Beard & Head Lining', durationMinutes: 30, priceCents: 3500 },
  { category: 'Face', name: 'Beard Shave', durationMinutes: 30, priceCents: 2500 },
  { category: 'Face', name: 'Beard Lining', durationMinutes: 15, priceCents: 1500 },
  { category: 'Face', name: 'Head Lining', durationMinutes: 20, priceCents: 2000 },
  { category: 'Face', name: 'Full Facial', durationMinutes: 45, priceCents: 5500 },
  { category: 'Face', name: 'Full Facial and Hot Shave', durationMinutes: 60, priceCents: 7500 },
  { category: 'Adults', name: 'Cut', durationMinutes: 30, priceCents: 3500 },
  { category: 'Adults', name: 'Full Service', durationMinutes: 60, priceCents: 6500 },
  { category: 'Adults', name: 'Cut and Color', description: 'Simple bleach lightened process', durationMinutes: 90, priceCents: 9500 },
  { category: 'Adults', name: 'Custom Hair Design and Cut', durationMinutes: 45, priceCents: 5000 },
  { category: 'Adults', name: 'Female Undercut Design', durationMinutes: 45, priceCents: 5000 },
  { category: 'Adults', name: 'Hair Braiding', durationMinutes: 90, priceCents: 8500 },
  { category: 'Adults', name: 'Lining Taper', durationMinutes: 30, priceCents: 3500 },
  { category: 'Teens', name: 'Cut', durationMinutes: 30, priceCents: 3000 },
  { category: 'Teens', name: 'Full Service', durationMinutes: 60, priceCents: 5500 },
  { category: 'Children', name: 'Cut', durationMinutes: 25, priceCents: 2500 },
  { category: 'Seniors & Military', name: 'Cut', durationMinutes: 30, priceCents: 3000 },
  { category: 'Seniors & Military', name: 'Full Service', durationMinutes: 60, priceCents: 5500 },
] as const;
