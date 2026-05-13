import mongoose, { Schema, Document, Model } from "mongoose";
import { generateFanCardNumber } from "@/lib/utils";

/** Cloudinary image structure */
interface CloudinaryImage {
  url: string;
  publicId: string;
}

/** Fan card document interface */
export interface IFanCard extends Document {
  _id: mongoose.Types.ObjectId;
  celebrityId: mongoose.Types.ObjectId;
  cardNumber: string;
  title: string;
  description?: string;
  design: CloudinaryImage;
  backDesign?: CloudinaryImage;
  price: number;
  currency: string;
  isLimitedEdition: boolean;
  totalIssued: number;
  maxIssue: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  remainingSlots: number;
}

/** Cloudinary image subdocument schema */
const CloudinaryImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

/** Fan card schema definition */
const FanCardSchema = new Schema<IFanCard>(
  {
    celebrityId: {
      type: Schema.Types.ObjectId,
      ref: "Celebrity",
      required: [true, "Celebrity is required"],
    },
    cardNumber: {
      type: String,
      required: [true, "Card number is required"],
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    design: {
      type: CloudinaryImageSchema,
      required: [true, "Card design image is required"],
    },
    backDesign: {
      type: CloudinaryImageSchema,
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
    isLimitedEdition: {
      type: Boolean,
      default: false,
    },
    totalIssued: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxIssue: {
      type: Number,
      default: 0,
      min: 0,
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
FanCardSchema.index({ cardNumber: 1 }, { unique: true });
FanCardSchema.index({ celebrityId: 1 });
FanCardSchema.index({ isActive: 1 });
FanCardSchema.index({ isLimitedEdition: 1 });
FanCardSchema.index({ sortOrder: 1 });
FanCardSchema.index({ createdAt: -1 });

/** Virtual for remaining slots (limited edition) */
FanCardSchema.virtual("remainingSlots").get(function () {
  if (!this.isLimitedEdition || this.maxIssue === 0) return Infinity;
  return Math.max(0, this.maxIssue - this.totalIssued);
});

/** Pre-save hook to auto-generate cardNumber if not set */
FanCardSchema.pre("save", async function () {
  if (!this.cardNumber) {
    this.cardNumber = generateFanCardNumber();
  }
});

/** Ensure virtuals are included in JSON output */
FanCardSchema.set("toJSON", { virtuals: true });
FanCardSchema.set("toObject", { virtuals: true });

/** FanCard model - uses existing model if available (for hot reloading) */
export const FanCard: Model<IFanCard> =
  mongoose.models.FanCard || mongoose.model<IFanCard>("FanCard", FanCardSchema);

export default FanCard;
