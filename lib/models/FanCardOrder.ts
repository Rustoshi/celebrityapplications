import mongoose, { Schema, Document, Model } from "mongoose";
import { FAN_CARD_ORDER_STATUSES } from "@/lib/constants";
import { generateFanCardOrderNumber } from "@/lib/utils";
import type { FanCardOrderStatus, PaymentMethodType } from "@/types";

/** Shipping address structure */
export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  phone?: string;
}

/** Fan card order document interface */
export interface IFanCardOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  fanCardId: mongoose.Types.ObjectId;
  celebrityId: mongoose.Types.ObjectId;
  status: FanCardOrderStatus;
  amount: number;
  currency: string;
  deliveryType: "digital" | "physical";
  shippingAddress?: ShippingAddress;
  paymentMethodUsed?: string;
  paymentMethodType?: PaymentMethodType;
  paymentReceipt?: string;
  paymentReceiptPublicId?: string;
  paymentUploadedAt?: Date;
  adminNote?: string;
  confirmedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Shipping address subdocument schema */
const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

/** Fan card order schema definition */
const FanCardOrderSchema = new Schema<IFanCardOrder>(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      default: generateFanCardOrderNumber,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    fanCardId: {
      type: Schema.Types.ObjectId,
      ref: "FanCard",
      required: [true, "Fan card ID is required"],
    },
    celebrityId: {
      type: Schema.Types.ObjectId,
      ref: "Celebrity",
      required: [true, "Celebrity ID is required"],
    },
    status: {
      type: String,
      required: true,
      enum: FAN_CARD_ORDER_STATUSES.map((s) => s.value),
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
    deliveryType: {
      type: String,
      required: [true, "Delivery type is required"],
      enum: ["digital", "physical"],
      default: "digital",
    },
    shippingAddress: {
      type: ShippingAddressSchema,
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
    adminNote: {
      type: String,
    },
    confirmedAt: {
      type: Date,
    },
    deliveredAt: {
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
FanCardOrderSchema.index({ orderNumber: 1 }, { unique: true });
FanCardOrderSchema.index({ userId: 1 });
FanCardOrderSchema.index({ fanCardId: 1 });
FanCardOrderSchema.index({ celebrityId: 1 });
FanCardOrderSchema.index({ status: 1 });
FanCardOrderSchema.index({ userId: 1, status: 1 });
FanCardOrderSchema.index({ createdAt: -1 });

/** Pre-save hook to auto-generate orderNumber if not set */
FanCardOrderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    this.orderNumber = generateFanCardOrderNumber();
  }
});

/** Ensure virtuals are included in JSON output */
FanCardOrderSchema.set("toJSON", { virtuals: true });
FanCardOrderSchema.set("toObject", { virtuals: true });

/** FanCardOrder model - uses existing model if available (for hot reloading) */
export const FanCardOrder: Model<IFanCardOrder> =
  mongoose.models.FanCardOrder ||
  mongoose.model<IFanCardOrder>("FanCardOrder", FanCardOrderSchema);

export default FanCardOrder;
