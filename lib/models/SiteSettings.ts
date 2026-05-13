import mongoose, { Schema, Document, Model } from "mongoose";

/** Cloudinary image structure */
interface CloudinaryImage {
  url: string;
  publicId: string;
}

/** Social links structure for site settings */
interface SiteSocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
}

/** Site settings document interface */
export interface ISiteSettings extends Document {
  _id: mongoose.Types.ObjectId;
  siteName: string;
  siteDescription?: string;
  logo?: CloudinaryImage;
  favicon?: CloudinaryImage;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: CloudinaryImage;
  heroCtaPrimary?: string;
  heroCtaSecondary?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  businessHours?: string;
  socialLinks?: SiteSocialLinks;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: CloudinaryImage;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  showFeaturedOnly: boolean;
  termsOfService?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Site settings model interface with static methods */
interface ISiteSettingsModel extends Model<ISiteSettings> {
  findOrCreate(): Promise<ISiteSettings>;
}

/** Cloudinary image subdocument schema */
const CloudinaryImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

/** Social links subdocument schema */
const SiteSocialLinksSchema = new Schema(
  {
    instagram: { type: String },
    twitter: { type: String },
    tiktok: { type: String },
    youtube: { type: String },
    facebook: { type: String },
  },
  { _id: false }
);

/** Site settings schema definition */
const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteName: {
      type: String,
      default: "CelebConnect",
    },
    siteDescription: {
      type: String,
    },
    logo: CloudinaryImageSchema,
    favicon: CloudinaryImageSchema,
    heroTitle: {
      type: String,
    },
    heroSubtitle: {
      type: String,
    },
    heroImage: CloudinaryImageSchema,
    heroCtaPrimary: {
      type: String,
    },
    heroCtaSecondary: {
      type: String,
    },
    contactEmail: {
      type: String,
    },
    contactPhone: {
      type: String,
    },
    contactAddress: {
      type: String,
    },
    contactCity: {
      type: String,
    },
    businessHours: {
      type: String,
    },
    socialLinks: SiteSocialLinksSchema,
    metaTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    ogImage: CloudinaryImageSchema,
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    registrationEnabled: {
      type: Boolean,
      default: true,
    },
    showFeaturedOnly: {
      type: Boolean,
      default: false,
    },
    termsOfService: {
      type: String,
    },
    privacyPolicy: {
      type: String,
    },
    refundPolicy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/** Static method to find or create the singleton settings document */
SiteSettingsSchema.statics.findOrCreate = async function (): Promise<ISiteSettings> {
  let settings = await this.findOne({});
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

/** Ensure virtuals are included in JSON output */
SiteSettingsSchema.set("toJSON", { virtuals: true });
SiteSettingsSchema.set("toObject", { virtuals: true });

/** SiteSettings model - uses existing model if available (for hot reloading) */
export const SiteSettings: ISiteSettingsModel =
  (mongoose.models.SiteSettings as ISiteSettingsModel) ||
  mongoose.model<ISiteSettings, ISiteSettingsModel>(
    "SiteSettings",
    SiteSettingsSchema
  );

export default SiteSettings;
