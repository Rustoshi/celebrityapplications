/**
 * Site configuration - centralized site name and metadata
 * Values are read from environment variables for reusability
 */

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "CelebConnect",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || "Exclusive Celebrity Bookings",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Premium celebrity management and booking agency. Book exclusive experiences with your favorite celebrities for events, appearances, and more.",
} as const;

/** Helper to generate page titles */
export function pageTitle(page?: string): string {
  if (!page) return `${siteConfig.name} — ${siteConfig.tagline}`;
  return `${page} — ${siteConfig.name}`;
}

/** Helper for admin page titles */
export function adminPageTitle(page: string): string {
  return `${page} — ${siteConfig.name} Admin`;
}
