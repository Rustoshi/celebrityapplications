"use server";

import { connectDB } from "@/lib/db";
import SiteSettings from "@/lib/models/SiteSettings";

export interface PublicSiteSettings {
  siteName: string;
  siteDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  businessHours?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    facebook?: string;
  };
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    await connectDB();

    const settings = await SiteSettings.findOrCreate();

    return {
      siteName: settings.siteName || "CelebConnect",
      siteDescription: settings.siteDescription,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      contactAddress: settings.contactAddress,
      contactCity: settings.contactCity,
      businessHours: settings.businessHours,
      socialLinks: settings.socialLinks
        ? {
            instagram: settings.socialLinks.instagram,
            twitter: settings.socialLinks.twitter,
            tiktok: settings.socialLinks.tiktok,
            youtube: settings.socialLinks.youtube,
            facebook: settings.socialLinks.facebook,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching public site settings:", error);
    return {
      siteName: "CelebConnect",
    };
  }
}
