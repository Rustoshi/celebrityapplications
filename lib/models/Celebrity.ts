import mongoose, { Schema, Document, Model } from "mongoose";
import { CELEBRITY_CATEGORIES, BOOKING_TYPES } from "@/lib/constants";
import type { BookingType, CelebrityCategory, SocialLinks } from "@/types";

/** Cloudinary image structure */
interface CloudinaryImage {
  url: string;
  publicId: string;
}

/** Gallery image with optional caption */
interface GalleryImage extends CloudinaryImage {
  caption?: string;
}

/** Available service offering structure */
export interface CelebrityService {
  type: BookingType;
  isActive: boolean;
  basePrice: number;
  description?: string;
  requirements?: string;
}

/** Concert ticket tier structure */
export interface TicketTier {
  name: string;
  price: number;
  totalSlots: number;
  soldSlots: number;
  perks?: string;
}

/** Concert details structure */
export interface ConcertDetails {
  title?: string;
  venue?: string;
  date?: Date;
  city?: string;
  country?: string;
  description?: string;
  posterImage?: CloudinaryImage;
  ticketTiers: TicketTier[];
}

/** Celebrity document interface */
export interface ICelebrity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  bio?: string;
  shortBio?: string;
  category: CelebrityCategory;
  subcategories?: string[];
  profileImage?: CloudinaryImage;
  coverImage?: CloudinaryImage;
  gallery?: GalleryImage[];
  nationality?: string;
  knownFor?: string;
  achievements?: string[];
  languages?: string[];
  socialLinks?: SocialLinks;
  availableServices: CelebrityService[];
  concertEnabled: boolean;
  concertDetails?: ConcertDetails;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  agencyName?: string;
  internalNotes?: string;
  featured: boolean;
  isActive: boolean;
  sortOrder: number;
  totalBookings: number;
  totalRevenue: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isAvailable: boolean;
}

/** Cloudinary image subdocument schema */
const CloudinaryImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

/** Gallery image subdocument schema */
const GalleryImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String },
  },
  { _id: false }
);

/** Available service subdocument schema */
const CelebrityServiceSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: BOOKING_TYPES.map((t) => t.value),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
    },
    requirements: {
      type: String,
    },
  },
  { _id: false }
);

/** Ticket tier subdocument schema */
const TicketTierSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    totalSlots: { type: Number, required: true, min: 0 },
    soldSlots: { type: Number, default: 0, min: 0 },
    perks: { type: String },
  },
  { _id: false }
);

/** Concert details subdocument schema */
const ConcertDetailsSchema = new Schema(
  {
    title: { type: String },
    venue: { type: String },
    date: { type: Date },
    city: { type: String },
    country: { type: String },
    description: { type: String },
    posterImage: CloudinaryImageSchema,
    ticketTiers: [TicketTierSchema],
  },
  { _id: false }
);

/** Social links subdocument schema */
const SocialLinksSchema = new Schema(
  {
    instagram: { type: String },
    twitter: { type: String },
    tiktok: { type: String },
    youtube: { type: String },
    facebook: { type: String },
    linkedin: { type: String },
    spotify: { type: String },
    soundcloud: { type: String },
  },
  { _id: false }
);

/** Celebrity schema definition */
const CelebritySchema = new Schema<ICelebrity>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
    },
    bio: {
      type: String,
    },
    shortBio: {
      type: String,
      maxlength: [300, "Short bio cannot exceed 300 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: CELEBRITY_CATEGORIES,
    },
    subcategories: {
      type: [String],
    },
    profileImage: CloudinaryImageSchema,
    coverImage: CloudinaryImageSchema,
    gallery: {
      type: [GalleryImageSchema],
      validate: [
        (val: GalleryImage[]) => val.length <= 20,
        "Gallery cannot exceed 20 images",
      ],
    },
    nationality: {
      type: String,
    },
    knownFor: {
      type: String,
    },
    achievements: {
      type: [String],
    },
    languages: {
      type: [String],
    },
    socialLinks: SocialLinksSchema,
    availableServices: {
      type: [CelebrityServiceSchema],
      default: [],
    },
    concertEnabled: {
      type: Boolean,
      default: false,
    },
    concertDetails: ConcertDetailsSchema,
    managerName: {
      type: String,
    },
    managerEmail: {
      type: String,
    },
    managerPhone: {
      type: String,
    },
    agencyName: {
      type: String,
    },
    internalNotes: {
      type: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

/** Indexes for efficient queries */
CelebritySchema.index({ slug: 1 }, { unique: true });
CelebritySchema.index({ category: 1 });
CelebritySchema.index({ isActive: 1 });
CelebritySchema.index({ featured: 1 });
CelebritySchema.index({ sortOrder: 1 });
CelebritySchema.index({ tags: 1 });
CelebritySchema.index(
  { name: "text", bio: "text", shortBio: "text", knownFor: "text", tags: "text" },
  { name: "celebrity_text_search" }
);

/** Virtual for availability check */
CelebritySchema.virtual("isAvailable").get(function () {
  if (!this.isActive) return false;
  return this.availableServices.some((service) => service.isActive);
});

/** Ensure virtuals are included in JSON output */
CelebritySchema.set("toJSON", { virtuals: true });
CelebritySchema.set("toObject", { virtuals: true });

/** Celebrity model - uses existing model if available (for hot reloading) */
export const Celebrity: Model<ICelebrity> =
  mongoose.models.Celebrity ||
  mongoose.model<ICelebrity>("Celebrity", CelebritySchema);

export default Celebrity;
