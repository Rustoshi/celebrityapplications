import mongoose, { Schema, Document, Model } from "mongoose";
import { PAYMENT_METHOD_TYPES } from "@/lib/constants";
import type { PaymentMethodType } from "@/types";

/** Cloudinary image structure */
interface CloudinaryImage {
  url: string;
  publicId: string;
}

/** Payment method details flexible structure */
export interface PaymentMethodDetails {
  walletAddress?: string;
  network?: string;
  qrCodeImage?: CloudinaryImage;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  ibanNumber?: string;
  bankAddress?: string;
  email?: string;
  paypalLink?: string;
  acceptedBrands?: string[];
  redemptionInstructions?: string;
  acceptedGiftCards?: string[];
  giftCardInstructions?: string;
  [key: string]: unknown;
}

/** Payment method document interface */
export interface IPaymentMethod extends Document {
  _id: mongoose.Types.ObjectId;
  type: PaymentMethodType;
  label: string;
  instructions?: string;
  details: PaymentMethodDetails;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** QR code image subdocument schema */
const QRCodeImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

/** Payment method details subdocument schema */
const PaymentMethodDetailsSchema = new Schema(
  {
    walletAddress: { type: String },
    network: { type: String },
    qrCodeImage: QRCodeImageSchema,
    bankName: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
    routingNumber: { type: String },
    swiftCode: { type: String },
    ibanNumber: { type: String },
    bankAddress: { type: String },
    email: { type: String },
    paypalLink: { type: String },
    acceptedBrands: { type: [String] },
    redemptionInstructions: { type: String },
    acceptedGiftCards: { type: [String] },
    giftCardInstructions: { type: String },
  },
  { _id: false, strict: false }
);

/** Payment method schema definition */
const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    type: {
      type: String,
      required: [true, "Payment method type is required"],
      enum: PAYMENT_METHOD_TYPES.map((t) => t.value),
    },
    label: {
      type: String,
      required: [true, "Label is required"],
      trim: true,
    },
    instructions: {
      type: String,
    },
    details: {
      type: PaymentMethodDetailsSchema,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/** Indexes for efficient queries */
PaymentMethodSchema.index({ type: 1 });
PaymentMethodSchema.index({ isActive: 1 });
PaymentMethodSchema.index({ sortOrder: 1 });

/** Ensure virtuals are included in JSON output */
PaymentMethodSchema.set("toJSON", { virtuals: true });
PaymentMethodSchema.set("toObject", { virtuals: true });

/** PaymentMethod model - uses existing model if available (for hot reloading) */
export const PaymentMethod: Model<IPaymentMethod> =
  mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);

export default PaymentMethod;
