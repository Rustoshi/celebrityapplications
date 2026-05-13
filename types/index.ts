/** Booking service type identifiers */
export type BookingType =
  | "dinner_date"
  | "video_call"
  | "live_performance"
  | "private_event"
  | "corporate_event"
  | "charity_event"
  | "photoshoot"
  | "brand_endorsement";

/** Booking status identifiers */
export type BookingStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "payment_pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

/** Celebrity category identifiers */
export type CelebrityCategory =
  | "Actor"
  | "Actress"
  | "Musician"
  | "Singer"
  | "Rapper"
  | "DJ"
  | "Comedian"
  | "TV Personality"
  | "Reality Star"
  | "Athlete"
  | "Model"
  | "Influencer"
  | "YouTuber"
  | "TikToker"
  | "Chef"
  | "Author"
  | "Entrepreneur"
  | "Motivational Speaker"
  | "Politician"
  | "Journalist";

/** Payment method type identifiers */
export type PaymentMethodType =
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "paypal"
  | "crypto"
  | "wire_transfer";

/** User role identifiers */
export type UserRole = "admin" | "client";

/** Social media platform identifiers */
export type SocialPlatform =
  | "instagram"
  | "twitter"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "linkedin"
  | "spotify"
  | "soundcloud";

/** Generic API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Paginated response wrapper for list endpoints */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/** Base document interface for MongoDB documents */
export interface BaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Social media links structure */
export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  linkedin?: string;
  spotify?: string;
  soundcloud?: string;
}

/** Image object structure for Cloudinary uploads */
export interface CloudinaryImage {
  url: string;
  publicId: string;
}

/** Price range for celebrity services */
export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

/** Address structure */
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
}

/** Contact information structure */
export interface ContactInfo {
  email: string;
  phone?: string;
  alternatePhone?: string;
  address?: Address;
}

/** Navigation item structure */
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  disabled?: boolean;
  external?: boolean;
  badge?: string;
}

/** Sidebar navigation group */
export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Search/filter parameters */
export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  category?: string;
  status?: string;
}

/** Fan card order status identifiers */
export type FanCardOrderStatus =
  | "pending"
  | "payment_pending"
  | "confirmed"
  | "delivered"
  | "cancelled";

/** Membership application status identifiers */
export type MembershipStatus =
  | "pending"
  | "active"
  | "expired"
  | "cancelled";

/** Membership billing cycle identifiers */
export type BillingCycle =
  | "monthly"
  | "quarterly"
  | "annually"
  | "lifetime";

/** Date range filter */
export interface DateRange {
  from: Date;
  to: Date;
}
