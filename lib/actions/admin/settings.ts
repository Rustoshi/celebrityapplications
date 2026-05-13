"use server";

import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { requireAdmin, getCurrentAdmin } from "@/lib/auth-utils";
import { Admin, SiteSettings } from "@/lib/models";
import { deleteImage } from "@/lib/cloudinary";
import {
  siteSettingsSchema,
  adminProfileSchema,
  createAdminSchema,
} from "@/lib/validations/settings";

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface SiteSocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
}

interface SerializedSiteSettings {
  _id: string;
  siteName: string;
  siteDescription?: string;
  logo?: CloudinaryImage;
  favicon?: CloudinaryImage;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: CloudinaryImage;
  heroCtaPrimary?: string;
  heroCtaSecondary?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  businessHours?: string;
  socialLinks?: SiteSocialLinks;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: CloudinaryImage;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  showFeaturedOnly: boolean;
  termsOfService?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
  createdAt: string;
  updatedAt: string;
}

interface SerializedAdmin {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

function serializeSiteSettings(doc: Record<string, unknown>): SerializedSiteSettings {
  return {
    _id: String(doc._id),
    siteName: (doc.siteName as string) || "CelebConnect",
    siteDescription: doc.siteDescription as string | undefined,
    logo: doc.logo as CloudinaryImage | undefined,
    favicon: doc.favicon as CloudinaryImage | undefined,
    heroTitle: doc.heroTitle as string | undefined,
    heroSubtitle: doc.heroSubtitle as string | undefined,
    heroImage: doc.heroImage as CloudinaryImage | undefined,
    heroCtaPrimary: doc.heroCtaPrimary as string | undefined,
    heroCtaSecondary: doc.heroCtaSecondary as string | undefined,
    contactEmail: doc.contactEmail as string | undefined,
    contactPhone: doc.contactPhone as string | undefined,
    contactAddress: doc.contactAddress as string | undefined,
    contactCity: doc.contactCity as string | undefined,
    businessHours: doc.businessHours as string | undefined,
    socialLinks: doc.socialLinks as SiteSocialLinks | undefined,
    metaTitle: doc.metaTitle as string | undefined,
    metaDescription: doc.metaDescription as string | undefined,
    ogImage: doc.ogImage as CloudinaryImage | undefined,
    maintenanceMode: Boolean(doc.maintenanceMode),
    registrationEnabled: doc.registrationEnabled !== false,
    showFeaturedOnly: Boolean(doc.showFeaturedOnly),
    termsOfService: doc.termsOfService as string | undefined,
    privacyPolicy: doc.privacyPolicy as string | undefined,
    refundPolicy: doc.refundPolicy as string | undefined,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as Date).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as Date).toISOString()
      : new Date().toISOString(),
  };
}

function serializeAdmin(doc: Record<string, unknown>): SerializedAdmin {
  return {
    _id: String(doc._id),
    firstName: doc.firstName as string,
    lastName: doc.lastName as string,
    email: doc.email as string,
    role: doc.role as string,
    avatar: doc.avatar as string | undefined,
    isActive: doc.isActive !== false,
    lastLogin: doc.lastLogin
      ? new Date(doc.lastLogin as Date).toISOString()
      : undefined,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as Date).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Get current site settings
 */
export async function getSiteSettings() {
  try {
    await connectDB();
    await requireAdmin();

    const settings = await SiteSettings.findOrCreate();

    return {
      success: true,
      data: serializeSiteSettings(settings.toObject() as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return {
      success: false,
      error: "Failed to fetch site settings",
    };
  }
}

/**
 * Update site settings with optional pre-uploaded images
 */
export async function updateSiteSettings(
  data: Record<string, unknown>,
  logo?: CloudinaryImage,
  favicon?: CloudinaryImage,
  heroImage?: CloudinaryImage,
  ogImage?: CloudinaryImage
) {
  try {
    await connectDB();
    await requireAdmin();

    const validation = siteSettingsSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Invalid data",
      };
    }

    const updateData: Record<string, unknown> = { ...validation.data };
    const settings = await SiteSettings.findOrCreate();

    if (logo) {
      if (settings.logo?.publicId) {
        await deleteImage(settings.logo.publicId).catch(console.error);
      }
      updateData.logo = logo;
    }

    if (favicon) {
      if (settings.favicon?.publicId) {
        await deleteImage(settings.favicon.publicId).catch(console.error);
      }
      updateData.favicon = favicon;
    }

    if (heroImage) {
      if (settings.heroImage?.publicId) {
        await deleteImage(settings.heroImage.publicId).catch(console.error);
      }
      updateData.heroImage = heroImage;
    }

    if (ogImage) {
      if (settings.ogImage?.publicId) {
        await deleteImage(settings.ogImage.publicId).catch(console.error);
      }
      updateData.ogImage = ogImage;
    }

    const updated = await SiteSettings.findOneAndUpdate({}, updateData, {
      new: true,
      upsert: true,
    }).lean();

    return {
      success: true,
      data: serializeSiteSettings(updated as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error updating site settings:", error);
    return {
      success: false,
      error: "Failed to update site settings",
    };
  }
}

/**
 * Get current admin's profile
 */
export async function getAdminProfile() {
  try {
    await connectDB();
    const admin = await getCurrentAdmin();

    if (!admin) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const adminDoc = await Admin.findById(admin.id).select("-password").lean();

    if (!adminDoc) {
      return {
        success: false,
        error: "Admin not found",
      };
    }

    return {
      success: true,
      data: serializeAdmin(adminDoc as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return {
      success: false,
      error: "Failed to fetch admin profile",
    };
  }
}

/**
 * Update current admin's profile
 */
export async function updateAdminProfile(data: Record<string, unknown>) {
  try {
    await connectDB();
    const admin = await getCurrentAdmin();

    if (!admin) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const validation = adminProfileSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Invalid data",
      };
    }

    const existingAdmin = await Admin.findOne({
      email: validation.data.email,
      _id: { $ne: admin.id },
    });

    if (existingAdmin) {
      return {
        success: false,
        error: "Email is already in use",
      };
    }

    const updated = await Admin.findByIdAndUpdate(admin.id, validation.data, {
      new: true,
    })
      .select("-password")
      .lean();

    if (!updated) {
      return {
        success: false,
        error: "Admin not found",
      };
    }

    return {
      success: true,
      data: serializeAdmin(updated as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return {
      success: false,
      error: "Failed to update admin profile",
    };
  }
}

/**
 * Change current admin's password
 */
export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  try {
    await connectDB();
    const admin = await getCurrentAdmin();

    if (!admin) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const adminDoc = await Admin.findById(admin.id);
    if (!adminDoc) {
      return {
        success: false,
        error: "Admin not found",
      };
    }

    const isValidPassword = await bcrypt.compare(currentPassword, adminDoc.password);
    if (!isValidPassword) {
      return {
        success: false,
        error: "Current password is incorrect",
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        error: "New password must be at least 8 characters",
      };
    }

    if (!/[A-Z]/.test(newPassword)) {
      return {
        success: false,
        error: "New password must contain at least one uppercase letter",
      };
    }

    if (!/[a-z]/.test(newPassword)) {
      return {
        success: false,
        error: "New password must contain at least one lowercase letter",
      };
    }

    if (!/[0-9]/.test(newPassword)) {
      return {
        success: false,
        error: "New password must contain at least one number",
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    adminDoc.password = hashedPassword;
    await adminDoc.save();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      error: "Failed to change password",
    };
  }
}

/**
 * Get all admins (super_admin only)
 */
export async function getAdminList() {
  try {
    await connectDB();
    const admin = await getCurrentAdmin();

    if (!admin) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    if (admin.role !== "super_admin") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const admins = await Admin.find({}).select("-password").sort({ createdAt: -1 }).lean();

    return {
      success: true,
      data: admins.map((a) => serializeAdmin(a as unknown as Record<string, unknown>)),
    };
  } catch (error) {
    console.error("Error fetching admin list:", error);
    return {
      success: false,
      error: "Failed to fetch admin list",
    };
  }
}

/**
 * Create new admin (super_admin only)
 */
export async function createAdmin(data: Record<string, unknown>) {
  try {
    await connectDB();
    const admin = await getCurrentAdmin();

    if (!admin) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    if (admin.role !== "super_admin") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const validation = createAdminSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Invalid data",
      };
    }

    const existingAdmin = await Admin.findOne({ email: validation.data.email });
    if (existingAdmin) {
      return {
        success: false,
        error: "Email is already in use",
      };
    }

    const hashedPassword = await bcrypt.hash(validation.data.password, 12);

    const newAdmin = await Admin.create({
      ...validation.data,
      password: hashedPassword,
    });

    const adminDoc = await Admin.findById(newAdmin._id).select("-password").lean();

    return {
      success: true,
      data: serializeAdmin(adminDoc as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error creating admin:", error);
    return {
      success: false,
      error: "Failed to create admin",
    };
  }
}

/**
 * Delete admin (super_admin only)
 */
export async function deleteAdmin(id: string) {
  try {
    await connectDB();
    const admin = await getCurrentAdmin();

    if (!admin) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    if (admin.role !== "super_admin") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    if (admin.id === id) {
      return {
        success: false,
        error: "Cannot delete your own account",
      };
    }

    const deleted = await Admin.findByIdAndDelete(id);

    if (!deleted) {
      return {
        success: false,
        error: "Admin not found",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting admin:", error);
    return {
      success: false,
      error: "Failed to delete admin",
    };
  }
}
