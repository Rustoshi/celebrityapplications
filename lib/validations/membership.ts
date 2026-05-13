import { z } from "zod";
import { MEMBERSHIP_STATUSES, MEMBERSHIP_BILLING_CYCLES } from "@/lib/constants";

/** Membership tier creation/update validation schema (admin) */
export const membershipTierSchema = z.object({
  name: z
    .string()
    .min(1, "Tier name is required")
    .max(50, "Name cannot exceed 50 characters"),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),
  shortDescription: z
    .string()
    .max(200, "Short description cannot exceed 200 characters")
    .optional()
    .or(z.literal("")),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .or(z.string().transform((val) => parseFloat(val))),
  billingCycle: z.enum(
    MEMBERSHIP_BILLING_CYCLES.map((c) => c.value) as [string, ...string[]],
    {
      message: "Please select a valid billing cycle",
    }
  ),
  features: z.array(z.string()).default([]),
  maxBookingsPerMonth: z
    .number()
    .min(0)
    .default(0)
    .or(z.string().transform((val) => parseInt(val, 10))),
  discountPercent: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .default(0)
    .or(z.string().transform((val) => parseFloat(val))),
  prioritySupport: z.boolean().default(false),
  earlyAccess: z.boolean().default(false),
  exclusiveContent: z.boolean().default(false),
  badge: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z
    .number()
    .min(0)
    .default(0)
    .or(z.string().transform((val) => parseInt(val, 10))),
});

/** Inferred type for membership tier input */
export type MembershipTierInput = z.infer<typeof membershipTierSchema>;

/** Membership application submission validation schema (client) */
export const membershipApplicationSchema = z.object({
  tierId: z.string().min(1, "Membership tier is required"),
  autoRenew: z.boolean().default(false),
});

/** Inferred type for membership application input */
export type MembershipApplicationInput = z.infer<typeof membershipApplicationSchema>;

/** Membership application status update schema (admin) */
export const membershipStatusSchema = z.object({
  status: z.enum(
    MEMBERSHIP_STATUSES.map((s) => s.value) as [string, ...string[]],
    {
      message: "Please select a valid status",
    }
  ),
  adminNote: z.string().max(500).optional(),
});

/** Inferred type for membership status update input */
export type MembershipStatusInput = z.infer<typeof membershipStatusSchema>;

/** Membership payment upload validation schema */
export const membershipPaymentUploadSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  paymentMethodUsed: z.string().min(1, "Payment method is required"),
  paymentMethodType: z.string().optional(),
  paymentReceipt: z.string().url("Please provide a valid receipt URL"),
});

/** Inferred type for membership payment upload input */
export type MembershipPaymentUploadInput = z.infer<typeof membershipPaymentUploadSchema>;
