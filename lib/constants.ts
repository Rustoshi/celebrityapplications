import {
  UtensilsCrossed,
  Video,
  Mic2,
  PartyPopper,
  Building2,
  Heart,
  Camera,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

/** Application name used across the platform */
export const APP_NAME = "CelebConnect";

/** Default number of items per page for pagination */
export const ITEMS_PER_PAGE = 12;

/** Booking service types with metadata */
export const BOOKING_TYPES: {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "dinner_date",
    label: "Dinner Date",
    description: "An exclusive dining experience with your favorite celebrity",
    icon: UtensilsCrossed,
  },
  {
    value: "video_call",
    label: "Video Call",
    description: "A personal video call session for birthdays, greetings, or advice",
    icon: Video,
  },
  {
    value: "live_performance",
    label: "Live Performance",
    description: "Book a celebrity for a live performance at your event",
    icon: Mic2,
  },
  {
    value: "private_event",
    label: "Private Event",
    description: "Celebrity appearance at your private party or gathering",
    icon: PartyPopper,
  },
  {
    value: "corporate_event",
    label: "Corporate Event",
    description: "Professional appearances for corporate functions and conferences",
    icon: Building2,
  },
  {
    value: "charity_event",
    label: "Charity Event",
    description: "Celebrity participation in charitable causes and fundraisers",
    icon: Heart,
  },
  {
    value: "photoshoot",
    label: "Photoshoot",
    description: "Professional photoshoot session with a celebrity",
    icon: Camera,
  },
  {
    value: "brand_endorsement",
    label: "Brand Endorsement",
    description: "Social media posts, commercials, and brand partnerships",
    icon: MessageSquare,
  },
];

/** Booking status options with display metadata */
export const BOOKING_STATUSES: {
  value: string;
  label: string;
  color: string;
}[] = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-warning/20 text-warning border-warning/30",
  },
  {
    value: "under_review",
    label: "Under Review",
    color: "bg-info/20 text-info border-info/30",
  },
  {
    value: "approved",
    label: "Approved",
    color: "bg-success/20 text-success border-success/30",
  },
  {
    value: "rejected",
    label: "Rejected",
    color: "bg-destructive/20 text-destructive border-destructive/30",
  },
  {
    value: "payment_pending",
    label: "Payment Pending",
    color: "bg-warning/20 text-warning border-warning/30",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    color: "bg-gold/20 text-gold border-gold/30",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-info/20 text-info border-info/30",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-success/20 text-success border-success/30",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-muted/20 text-muted-foreground border-muted/30",
  },
];

/** Celebrity categories for filtering and organization */
export const CELEBRITY_CATEGORIES: string[] = [
  "Actor",
  "Actress",
  "Musician",
  "Singer",
  "Rapper",
  "DJ",
  "Comedian",
  "TV Personality",
  "Reality Star",
  "Athlete",
  "Model",
  "Influencer",
  "YouTuber",
  "TikToker",
  "Chef",
  "Author",
  "Entrepreneur",
  "Motivational Speaker",
  "Politician",
  "Journalist",
];

/** Payment method types */
export const PAYMENT_METHOD_TYPES: {
  value: string;
  label: string;
  icon: string;
}[] = [
  { value: "credit_card", label: "Credit Card", icon: "credit-card" },
  { value: "debit_card", label: "Debit Card", icon: "credit-card" },
  { value: "bank_transfer", label: "Bank Transfer", icon: "building" },
  { value: "paypal", label: "PayPal", icon: "wallet" },
  { value: "crypto", label: "Cryptocurrency", icon: "bitcoin" },
  { value: "wire_transfer", label: "Wire Transfer", icon: "send" },
  { value: "gift_card", label: "Gift Card", icon: "gift" },
];

/** Common gift card types */
export const GIFT_CARD_TYPES: string[] = [
  "Amazon",
  "Apple/iTunes",
  "Google Play",
  "Steam",
  "PlayStation",
  "Xbox",
  "Walmart",
  "Target",
  "Best Buy",
  "Visa Gift Card",
  "Mastercard Gift Card",
  "American Express Gift Card",
  "eBay",
  "Sephora",
  "Nike",
  "Starbucks",
  "Netflix",
  "Spotify",
  "Uber",
  "DoorDash",
  "Other",
];

/** Fan card order status options with display metadata */
export const FAN_CARD_ORDER_STATUSES: {
  value: string;
  label: string;
  color: string;
}[] = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-warning/20 text-warning border-warning/30",
  },
  {
    value: "payment_pending",
    label: "Payment Pending",
    color: "bg-warning/20 text-warning border-warning/30",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    color: "bg-gold/20 text-gold border-gold/30",
  },
  {
    value: "delivered",
    label: "Delivered",
    color: "bg-success/20 text-success border-success/30",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-muted/20 text-muted-foreground border-muted/30",
  },
];

/** Membership application status options with display metadata */
export const MEMBERSHIP_STATUSES: {
  value: string;
  label: string;
  color: string;
}[] = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-warning/20 text-warning border-warning/30",
  },
  {
    value: "active",
    label: "Active",
    color: "bg-success/20 text-success border-success/30",
  },
  {
    value: "expired",
    label: "Expired",
    color: "bg-muted/20 text-muted-foreground border-muted/30",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-destructive/20 text-destructive border-destructive/30",
  },
];

/** Membership billing cycle options */
export const MEMBERSHIP_BILLING_CYCLES: {
  value: string;
  label: string;
  months: number;
}[] = [
  { value: "monthly", label: "Monthly", months: 1 },
  { value: "quarterly", label: "Quarterly", months: 3 },
  { value: "annually", label: "Annually", months: 12 },
  { value: "lifetime", label: "Lifetime", months: 0 },
];

/** Social media platforms for celebrity profiles */
export const SOCIAL_PLATFORMS = [
  "instagram",
  "twitter",
  "tiktok",
  "youtube",
  "facebook",
  "linkedin",
  "spotify",
  "soundcloud",
] as const;
