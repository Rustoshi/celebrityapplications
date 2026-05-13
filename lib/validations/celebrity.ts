import { z } from "zod";
import { CELEBRITY_CATEGORIES, BOOKING_TYPES } from "@/lib/constants";

/** URL validation helper - allows empty string or valid URL */
const optionalUrlSchema = z
  .string()
  .refine((val) => val === "" || z.string().url().safeParse(val).success, {
    message: "Please enter a valid URL",
  })
  .optional()
  .or(z.literal(""));

/** Social links validation schema */
const socialLinksSchema = z.object({
  instagram: optionalUrlSchema,
  twitter: optionalUrlSchema,
  tiktok: optionalUrlSchema,
  youtube: optionalUrlSchema,
  facebook: optionalUrlSchema,
  linkedin: optionalUrlSchema,
  spotify: optionalUrlSchema,
  soundcloud: optionalUrlSchema,
});

/** Booking type values as const array */
const bookingTypeValues = BOOKING_TYPES.map((t) => t.value) as [string, ...string[]];

/** Available service validation schema */
const availableServiceSchema = z.object({
  type: z.enum(bookingTypeValues, {
    message: "Please select a valid service type",
  }),
  isActive: z.boolean().default(true),
  basePrice: z
    .number()
    .positive("Base price must be a positive number")
    .or(z.string().transform((val) => parseFloat(val))),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  requirements: z.string().max(1000, "Requirements cannot exceed 1000 characters").optional(),
});

/** Ticket tier validation schema */
const ticketTierSchema = z.object({
  name: z.string().min(1, "Tier name is required"),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .or(z.string().transform((val) => parseFloat(val))),
  totalSlots: z
    .number()
    .int()
    .min(1, "Total slots must be at least 1")
    .or(z.string().transform((val) => parseInt(val))),
  soldSlots: z
    .number()
    .int()
    .min(0)
    .default(0)
    .or(z.string().transform((val) => parseInt(val))),
  perks: z.string().optional(),
});

/** Concert details validation schema */
const concertDetailsSchema = z.object({
  title: z.string().max(200, "Title cannot exceed 200 characters").optional(),
  venue: z.string().max(200, "Venue cannot exceed 200 characters").optional(),
  date: z.coerce.date().optional(),
  city: z.string().max(100, "City cannot exceed 100 characters").optional(),
  country: z.string().max(100, "Country cannot exceed 100 characters").optional(),
  description: z.string().max(2000, "Description cannot exceed 2000 characters").optional(),
  posterImage: z
    .object({
      url: z.string().url(),
      publicId: z.string(),
    })
    .optional(),
  ticketTiers: z.array(ticketTierSchema).default([]),
});

/** Celebrity creation/edit form validation schema */
export const celebritySchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    shortBio: z
      .string()
      .max(300, "Short bio cannot exceed 300 characters")
      .optional()
      .or(z.literal("")),
    bio: z
      .string()
      .max(5000, "Bio cannot exceed 5000 characters")
      .optional()
      .or(z.literal("")),
    category: z.enum(CELEBRITY_CATEGORIES as [string, ...string[]], {
      message: "Please select a valid category",
    }),
    subcategories: z.array(z.string()).optional().default([]),
    nationality: z.string().max(100).optional().or(z.literal("")),
    knownFor: z.string().max(500).optional().or(z.literal("")),
    achievements: z.array(z.string()).optional().default([]),
    languages: z.array(z.string()).optional().default([]),
    socialLinks: socialLinksSchema.optional(),
    availableServices: z.array(availableServiceSchema).default([]),
    concertEnabled: z.boolean().default(false),
    concertDetails: concertDetailsSchema.optional(),
    managerName: z.string().max(100).optional().or(z.literal("")),
    managerEmail: z
      .string()
      .email("Please enter a valid email")
      .optional()
      .or(z.literal("")),
    managerPhone: z.string().max(30).optional().or(z.literal("")),
    agencyName: z.string().max(100).optional().or(z.literal("")),
    tags: z.array(z.string()).optional().default([]),
    featured: z.boolean().default(false),
    isActive: z.boolean().default(true),
    internalNotes: z.string().max(2000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.concertEnabled && data.concertDetails) {
      if (!data.concertDetails.title) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Concert title is required when concert is enabled",
          path: ["concertDetails", "title"],
        });
      }
    }
  });

/** Inferred type for celebrity form input */
export type CelebrityInput = z.infer<typeof celebritySchema>;

/** Available service input type */
export type AvailableServiceInput = z.infer<typeof availableServiceSchema>;

/** Concert details input type */
export type ConcertDetailsInput = z.infer<typeof concertDetailsSchema>;

/** Ticket tier input type */
export type TicketTierInput = z.infer<typeof ticketTierSchema>;
