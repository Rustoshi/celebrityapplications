import { z } from "zod";

/** Gender values */
const genderValues = ["male", "female", "other", "prefer_not_to_say"] as const;

/** Update profile validation schema for clients */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters"),
  phone: z.string().max(30, "Phone number is too long").optional().or(z.literal("")),
  dateOfBirth: z.coerce.date().optional().or(z.literal("")),
  gender: z
    .enum(genderValues, {
      message: "Please select a valid gender",
    })
    .optional(),
  country: z.string().max(100).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  company: z
    .string()
    .max(100, "Company name cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
});

/** Inferred type for update profile input */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Admin user update schema (admin editing a user) */
export const adminUpdateUserSchema = z.object({
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
  phone: z.string().max(30).optional().or(z.literal("")),
  status: z.enum(["active", "suspended", "pending"], {
    message: "Please select a valid status",
  }),
  emailVerified: z.boolean().optional(),
  country: z.string().max(100).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  company: z.string().max(100).optional().or(z.literal("")),
});

/** Inferred type for admin user update input */
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

/** User search/filter schema */
export const userSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["active", "suspended", "pending", "all"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
  sortBy: z.enum(["createdAt", "firstName", "lastName", "email", "totalBookings", "totalSpent"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

/** Inferred type for user search input */
export type UserSearchInput = z.infer<typeof userSearchSchema>;

/** Avatar upload schema */
export const avatarUploadSchema = z.object({
  avatar: z.string().url("Please provide a valid image URL"),
});

/** Inferred type for avatar upload input */
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;
