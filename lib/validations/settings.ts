import { z } from "zod";

/** URL validation helper - allows empty string or valid URL */
const optionalUrlSchema = z
  .string()
  .refine((val) => val === "" || z.string().url().safeParse(val).success, {
    message: "Please enter a valid URL",
  })
  .optional()
  .or(z.literal(""));

/** Email validation helper - allows empty string or valid email */
const optionalEmailSchema = z
  .string()
  .refine((val) => val === "" || z.string().email().safeParse(val).success, {
    message: "Please enter a valid email",
  })
  .optional()
  .or(z.literal(""));

/** Social links validation schema for site settings */
const siteSocialLinksSchema = z.object({
  instagram: optionalUrlSchema,
  twitter: optionalUrlSchema,
  tiktok: optionalUrlSchema,
  youtube: optionalUrlSchema,
  facebook: optionalUrlSchema,
});

/** Cloudinary image schema */
const cloudinaryImageSchema = z
  .object({
    url: z.string().url(),
    publicId: z.string(),
  })
  .optional();

/** Site settings validation schema */
export const siteSettingsSchema = z.object({
  siteName: z
    .string()
    .min(2, "Site name must be at least 2 characters")
    .max(100, "Site name cannot exceed 100 characters")
    .optional(),
  siteDescription: z
    .string()
    .max(500, "Site description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  logo: cloudinaryImageSchema,
  favicon: cloudinaryImageSchema,
  heroTitle: z
    .string()
    .max(200, "Hero title cannot exceed 200 characters")
    .optional()
    .or(z.literal("")),
  heroSubtitle: z
    .string()
    .max(500, "Hero subtitle cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  heroImage: cloudinaryImageSchema,
  heroCtaPrimary: z.string().max(50).optional().or(z.literal("")),
  heroCtaSecondary: z.string().max(50).optional().or(z.literal("")),
  contactEmail: optionalEmailSchema,
  contactPhone: z.string().max(30).optional().or(z.literal("")),
  contactAddress: z.string().max(200).optional().or(z.literal("")),
  contactCity: z.string().max(100).optional().or(z.literal("")),
  businessHours: z.string().max(100).optional().or(z.literal("")),
  socialLinks: siteSocialLinksSchema.optional(),
  metaTitle: z.string().max(100).optional().or(z.literal("")),
  metaDescription: z.string().max(300).optional().or(z.literal("")),
  ogImage: cloudinaryImageSchema,
  maintenanceMode: z.boolean().optional(),
  registrationEnabled: z.boolean().optional(),
  showFeaturedOnly: z.boolean().optional(),
  termsOfService: z.string().optional().or(z.literal("")),
  privacyPolicy: z.string().optional().or(z.literal("")),
  refundPolicy: z.string().optional().or(z.literal("")),
});

/** Inferred type for site settings input */
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

/** Admin profile update validation schema */
export const adminProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

/** Inferred type for admin profile input */
export type AdminProfileInput = z.infer<typeof adminProfileSchema>;

/** Admin creation schema (for super_admin creating new admins) */
export const createAdminSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["admin", "super_admin"], {
    message: "Please select a valid role",
  }),
});

/** Inferred type for create admin input */
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
