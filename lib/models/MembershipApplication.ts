import mongoose, { Schema, Document, Model } from "mongoose";
import { MEMBERSHIP_STATUSES } from "@/lib/constants";
import { generateMembershipNumber } from "@/lib/utils";
import type { MembershipStatus, PaymentMethodType } from "@/types";

/** Membership application document interface */
export interface IMembershipApplication extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tierId: mongoose.Types.ObjectId;
  membershipCardNumber: string;
  status: MembershipStatus;
  amount: number;
  currency: string;
  paymentMethodUsed?: string;
  paymentMethodType?: PaymentMethodType;
  paymentReceipt?: string;
  paymentReceiptPublicId?: string;
  paymentUploadedAt?: Date;
  autoRenew: boolean;
  adminNote?: string;
  appliedAt: Date;
  approvedAt?: Date;
  activatedAt?: Date;
  expiresAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
  isExpired: boolean;
}

/** Membership application schema definition */
const MembershipApplicationSchema = new Schema<IMembershipApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    tierId: {
      type: Schema.Types.ObjectId,
      ref: "MembershipTier",
      required: [true, "Membership tier is required"],
    },
    membershipCardNumber: {
      type: String,
      required: [true, "Membership card number is required"],
      unique: true,
    },
    status: {
      type: String,
      required: true,
      enum: MEMBERSHIP_STATUSES.map((s) => s.value),
      default: "pending",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentMethodUsed: {
      type: String,
    },
    paymentMethodType: {
      type: String,
      enum: [
        "credit_card",
        "debit_card",
        "bank_transfer",
        "paypal",
        "crypto",
        "wire_transfer",
      ],
    },
    paymentReceipt: {
      type: String,
    },
    paymentReceiptPublicId: {
      type: String,
    },
    paymentUploadedAt: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    adminNote: {
      type: String,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    activatedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/** Indexes for efficient queries */
MembershipApplicationSchema.index({ membershipCardNumber: 1 }, { unique: true });
MembershipApplicationSchema.index({ userId: 1 });
MembershipApplicationSchema.index({ tierId: 1 });
MembershipApplicationSchema.index({ status: 1 });
MembershipApplicationSchema.index({ userId: 1, status: 1 });
MembershipApplicationSchema.index({ expiresAt: 1 });
MembershipApplicationSchema.index({ createdAt: -1 });

/** Virtual for checking if membership is expired */
MembershipApplicationSchema.virtual("isExpired").get(function () {
  if (this.status !== "active") return false;
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

/** Pre-save hook to auto-generate membershipCardNumber if not set */
MembershipApplicationSchema.pre("save", async function () {
  if (!this.membershipCardNumber) {
    this.membershipCardNumber = generateMembershipNumber();
  }
});

/** Ensure virtuals are included in JSON output */
MembershipApplicationSchema.set("toJSON", { virtuals: true });
MembershipApplicationSchema.set("toObject", { virtuals: true });

/** MembershipApplication model - uses existing model if available (for hot reloading) */
export const MembershipApplication: Model<IMembershipApplication> =
  mongoose.models.MembershipApplication ||
  mongoose.model<IMembershipApplication>(
    "MembershipApplication",
    MembershipApplicationSchema
  );

export default MembershipApplication;
