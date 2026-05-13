import { z } from "zod";
import { PAYMENT_METHOD_TYPES } from "@/lib/constants";

/** Payment method type values as const array */
const paymentMethodTypeValues = PAYMENT_METHOD_TYPES.map((t) => t.value) as [string, ...string[]];

/** Payment method validation schema */
export const paymentMethodSchema = z
  .object({
    type: z.enum(paymentMethodTypeValues, {
      message: "Please select a valid payment method type",
    }),
    label: z
      .string()
      .min(2, "Label must be at least 2 characters")
      .max(100, "Label cannot exceed 100 characters"),
    instructions: z
      .string()
      .max(1000, "Instructions cannot exceed 1000 characters")
      .optional()
      .or(z.literal("")),
    details: z.record(z.string(), z.any()).default({}),
    isActive: z.boolean().default(true),
    sortOrder: z
      .number()
      .int()
      .min(0)
      .optional()
      .or(z.string().transform((val) => parseInt(val))),
  })
  .superRefine((data, ctx) => {
    const { type, details } = data;

    if (type === "crypto") {
      if (!details.walletAddress || details.walletAddress.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Wallet address is required for cryptocurrency",
          path: ["details", "walletAddress"],
        });
      }
    }

    if (type === "bank_transfer" || type === "wire_transfer") {
      if (!details.bankName || details.bankName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bank name is required for bank/wire transfer",
          path: ["details", "bankName"],
        });
      }
      if (!details.accountNumber || details.accountNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Account number is required for bank/wire transfer",
          path: ["details", "accountNumber"],
        });
      }
    }

    if (type === "paypal") {
      if (!details.email || details.email.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email is required for PayPal",
          path: ["details", "email"],
        });
      }
    }
  });

/** Inferred type for payment method input */
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;

/** Crypto payment details schema */
export const cryptoDetailsSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required"),
  network: z.string().optional(),
  qrCodeImage: z
    .object({
      url: z.string().url(),
      publicId: z.string(),
    })
    .optional(),
});

/** Bank transfer details schema */
export const bankTransferDetailsSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountName: z.string().optional(),
  accountNumber: z.string().min(1, "Account number is required"),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  ibanNumber: z.string().optional(),
  bankAddress: z.string().optional(),
});

/** PayPal details schema */
export const paypalDetailsSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  paypalLink: z.string().url().optional().or(z.literal("")),
});

/** Inferred types for payment method details */
export type CryptoDetailsInput = z.infer<typeof cryptoDetailsSchema>;
export type BankTransferDetailsInput = z.infer<typeof bankTransferDetailsSchema>;
export type PaypalDetailsInput = z.infer<typeof paypalDetailsSchema>;
