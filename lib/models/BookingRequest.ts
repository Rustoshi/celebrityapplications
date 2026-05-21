import mongoose, { Schema, Document, Model } from "mongoose";
import { BOOKING_TYPES, BOOKING_STATUSES } from "@/lib/constants";
import { generateBookingId } from "@/lib/utils";
import type { BookingType, BookingStatus, PaymentMethodType } from "@/types";

/** Booking details flexible structure */
export interface BookingDetails {
  preferredDate?: Date;
  preferredEndDate?: Date;
  preferredCity?: string;
  preferredCountry?: string;
  venue?: string;
  specialRequests?: string;
  message?: string;
  guestCount?: number;
  eventType?: string;
  eventName?: string;
  duration?: string;
  companyName?: string;
  ticketTier?: string;
  ticketQuantity?: number;
  attendeeNames?: string[];
  occasion?: string;
  recipientName?: string;
  platform?: string;
  campaignDetails?: string;
  deliverables?: string;
  [key: string]: unknown;
}

/** Booking request document interface */
export interface IBookingRequest extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId: string;
  userId: mongoose.Types.ObjectId;
  celebrityId: mongoose.Types.ObjectId;
  type: BookingType;
  status: BookingStatus;
  details: BookingDetails;
  amount: number;
  currency: string;
  paymentMethodUsed?: string;
  paymentMethodType?: PaymentMethodType;
  paymentReceipt?: string;
  paymentReceiptPublicId?: string;
  paymentUploadedAt?: Date;
  giftCardType?: string;
  giftCardAmount?: number;
  giftCardCode?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  adminNote?: string;
  rejectionReason?: string;
  completionNote?: string;
  submittedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Booking details subdocument schema */
const BookingDetailsSchema = new Schema(
  {
    preferredDate: { type: Date },
    preferredEndDate: { type: Date },
    preferredCity: { type: String },
    preferredCountry: { type: String },
    venue: { type: String },
    specialRequests: { type: String },
    message: { type: String },
    guestCount: { type: Number },
    eventType: { type: String },
    eventName: { type: String },
    duration: { type: String },
    companyName: { type: String },
    ticketTier: { type: String },
    ticketQuantity: { type: Number },
    attendeeNames: { type: [String] },
    occasion: { type: String },
    recipientName: { type: String },
    platform: { type: String },
    campaignDetails: { type: String },
    deliverables: { type: String },
  },
  { _id: false, strict: false }
);

/** Booking request schema definition */
const BookingRequestSchema = new Schema<IBookingRequest>(
  {
    bookingId: {
      type: String,
      required: [true, "Booking ID is required"],
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    celebrityId: {
      type: Schema.Types.ObjectId,
      ref: "Celebrity",
      required: [true, "Celebrity ID is required"],
    },
    type: {
      type: String,
      required: [true, "Booking type is required"],
      enum: BOOKING_TYPES.map((t) => t.value),
    },
    status: {
      type: String,
      required: true,
      enum: BOOKING_STATUSES.map((s) => s.value),
      default: "pending",
    },
    details: {
      type: BookingDetailsSchema,
      default: {},
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
        "gift_card",
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
    giftCardType: {
      type: String,
    },
    giftCardAmount: {
      type: Number,
    },
    giftCardCode: {
      type: String,
    },
    reviewedBy: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    adminNote: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    completionNote: {
      type: String,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    completedAt: {
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
BookingRequestSchema.index({ bookingId: 1 }, { unique: true });
BookingRequestSchema.index({ userId: 1 });
BookingRequestSchema.index({ celebrityId: 1 });
BookingRequestSchema.index({ status: 1 });
BookingRequestSchema.index({ type: 1 });
BookingRequestSchema.index({ createdAt: -1 });
BookingRequestSchema.index({ userId: 1, status: 1 });
BookingRequestSchema.index({ celebrityId: 1, status: 1 });

/** Pre-validate hook to auto-generate bookingId if not set */
BookingRequestSchema.pre("validate", function () {
  if (!this.bookingId) {
    this.bookingId = generateBookingId();
  }
});

/** Ensure virtuals are included in JSON output */
BookingRequestSchema.set("toJSON", { virtuals: true });
BookingRequestSchema.set("toObject", { virtuals: true });

/** BookingRequest model - uses existing model if available (for hot reloading) */
export const BookingRequest: Model<IBookingRequest> =
  mongoose.models.BookingRequest ||
  mongoose.model<IBookingRequest>("BookingRequest", BookingRequestSchema);

export default BookingRequest;
