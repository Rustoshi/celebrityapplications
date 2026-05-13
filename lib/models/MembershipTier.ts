import mongoose, { Schema, Document, Model } from "mongoose";
import { MEMBERSHIP_BILLING_CYCLES } from "@/lib/constants";
import type { BillingCycle } from "@/types";

/** Cloudinary image structure */
interface CloudinaryImage {
  url: string;
  publicId: string;
}

/** Membership tier document interface */
export interface IMembershipTier extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  features: string[];
  maxBookingsPerMonth: number;
  discountPercent: number;
  prioritySupport: boolean;
  earlyAccess: boolean;
  exclusiveContent: boolean;
  badge?: CloudinaryImage;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  totalMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Cloudinary image subdocument schema */
const CloudinaryImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

/** Membership tier schema definition */
const MembershipTierSchema = new Schema<IMembershipTier>(
  {
    name: {
      type: String,
      required: [true, "Tier name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
    },
    shortDescription: {
      type: String,
      maxlength: [200, "Short description cannot exceed 200 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
    },
    billingCycle: {
      type: String,
      required: [true, "Billing cycle is required"],
      enum: MEMBERSHIP_BILLING_CYCLES.map((c) => c.value),
      default: "monthly",
    },
    features: {
      type: [String],
      default: [],
    },
    maxBookingsPerMonth: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },
    prioritySupport: {
      type: Boolean,
      default: false,
    },
    earlyAccess: {
      type: Boolean,
      default: false,
    },
    exclusiveContent: {
      type: Boolean,
      default: false,
    },
    badge: {
      type: CloudinaryImageSchema,
    },
    color: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    totalMembers: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/** Indexes for efficient queries */
MembershipTierSchema.index({ slug: 1 }, { unique: true });
MembershipTierSchema.index({ isActive: 1 });
MembershipTierSchema.index({ sortOrder: 1 });
MembershipTierSchema.index({ price: 1 });
MembershipTierSchema.index({ createdAt: -1 });

/** Ensure virtuals are included in JSON output */
MembershipTierSchema.set("toJSON", { virtuals: true });
MembershipTierSchema.set("toObject", { virtuals: true });

/** MembershipTier model - uses existing model if available (for hot reloading) */
export const MembershipTier: Model<IMembershipTier> =
  mongoose.models.MembershipTier ||
  mongoose.model<IMembershipTier>("MembershipTier", MembershipTierSchema);

export default MembershipTier;
