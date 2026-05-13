import { z } from "zod";
import { BOOKING_TYPES, BOOKING_STATUSES } from "@/lib/constants";

/** Booking type values as const array */
const bookingTypeValues = BOOKING_TYPES.map((t) => t.value) as [string, ...string[]];

/** Booking request submission validation schema */
export const bookingRequestSchema = z.object({
  celebrityId: z.string().min(1, "Celebrity is required"),
  type: z.enum(bookingTypeValues, {
    message: "Please select a valid booking type",
  }),
  details: z.record(z.string(), z.any()).default({}),
  amount: z
    .number()
    .positive("Amount must be a positive number")
    .or(z.string().transform((val) => parseFloat(val))),
  message: z
    .string()
    .max(2000, "Message cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),
});

/** Inferred type for booking request input */
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

/** Payment upload validation schema */
export const paymentUploadSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  paymentMethodUsed: z.string().min(1, "Payment method is required"),
  paymentMethodType: z.string().optional(),
  paymentReceipt: z.string().url("Please provide a valid receipt URL"),
});

/** Inferred type for payment upload input */
export type PaymentUploadInput = z.infer<typeof paymentUploadSchema>;

/** Booking review action values */
const reviewActionValues = ["approve", "reject", "complete", "cancel"] as const;

/** Booking review validation schema */
export const bookingReviewSchema = z
  .object({
    action: z.enum(reviewActionValues, {
      message: "Please select a valid action",
    }),
    adminNote: z.string().max(1000, "Admin note cannot exceed 1000 characters").optional(),
    rejectionReason: z.string().max(500, "Rejection reason cannot exceed 500 characters").optional(),
    completionNote: z.string().max(500, "Completion note cannot exceed 500 characters").optional(),
  })
  .refine(
    (data) => {
      if (data.action === "reject" && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: "Rejection reason is required when rejecting a booking",
      path: ["rejectionReason"],
    }
  );

/** Inferred type for booking review input */
export type BookingReviewInput = z.infer<typeof bookingReviewSchema>;

/** Booking status update schema for admin */
export const bookingStatusUpdateSchema = z.object({
  status: z.enum(BOOKING_STATUSES.map((s) => s.value) as [string, ...string[]], {
    message: "Please select a valid status",
  }),
  adminNote: z.string().max(1000).optional(),
});

/** Inferred type for booking status update input */
export type BookingStatusUpdateInput = z.infer<typeof bookingStatusUpdateSchema>;
