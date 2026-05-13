import { z } from "zod";
import { FAN_CARD_ORDER_STATUSES } from "@/lib/constants";

/** Fan card creation/update validation schema (admin) */
export const fanCardSchema = z.object({
  celebrityId: z.string().min(1, "Celebrity is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  design: z.string().min(1, "Card design image is required"),
  backDesign: z.string().optional().or(z.literal("")),
  price: z
    .number()
    .positive("Price must be a positive number")
    .or(z.string().transform((val) => parseFloat(val))),
  isLimitedEdition: z.boolean().default(false),
  maxIssue: z
    .number()
    .min(0, "Max issue cannot be negative")
    .default(0)
    .or(z.string().transform((val) => parseInt(val, 10))),
  isActive: z.boolean().default(true),
  sortOrder: z
    .number()
    .min(0)
    .default(0)
    .or(z.string().transform((val) => parseInt(val, 10))),
});

/** Inferred type for fan card input */
export type FanCardInput = z.infer<typeof fanCardSchema>;

/** Fan card order submission validation schema (client) */
export const fanCardOrderSchema = z
  .object({
    fanCardId: z.string().min(1, "Fan card is required"),
    deliveryType: z.enum(["digital", "physical"], {
      message: "Please select a valid delivery type",
    }),
    shippingAddress: z
      .object({
        fullName: z.string().min(1, "Full name is required"),
        street: z.string().min(1, "Street address is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().optional().or(z.literal("")),
        country: z.string().min(1, "Country is required"),
        postalCode: z.string().min(1, "Postal code is required"),
        phone: z.string().optional().or(z.literal("")),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.deliveryType === "physical" && !data.shippingAddress) {
        return false;
      }
      return true;
    },
    {
      message: "Shipping address is required for physical delivery",
      path: ["shippingAddress"],
    }
  );

/** Inferred type for fan card order input */
export type FanCardOrderInput = z.infer<typeof fanCardOrderSchema>;

/** Fan card order status update schema (admin) */
export const fanCardOrderStatusSchema = z.object({
  status: z.enum(
    FAN_CARD_ORDER_STATUSES.map((s) => s.value) as [string, ...string[]],
    {
      message: "Please select a valid status",
    }
  ),
  adminNote: z.string().max(500).optional(),
});

/** Inferred type for fan card order status update input */
export type FanCardOrderStatusInput = z.infer<typeof fanCardOrderStatusSchema>;

/** Fan card payment upload validation schema */
export const fanCardPaymentUploadSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentMethodUsed: z.string().min(1, "Payment method is required"),
  paymentMethodType: z.string().optional(),
  paymentReceipt: z.string().url("Please provide a valid receipt URL"),
});

/** Inferred type for fan card payment upload input */
export type FanCardPaymentUploadInput = z.infer<typeof fanCardPaymentUploadSchema>;
