"use server";

import { connectDB } from "@/lib/db";
import { requireClient } from "@/lib/auth-utils";
import { Celebrity } from "@/lib/models";
import { ITEMS_PER_PAGE } from "@/lib/constants";

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface AvailableService {
  type: string;
  isActive: boolean;
  basePrice: number;
  description?: string;
  requirements?: string;
}

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  website?: string;
}

interface TicketTier {
  name: string;
  price: number;
  totalSlots: number;
  soldSlots: number;
  perks?: string;
}

interface ConcertDetails {
  title: string;
  venue: string;
  date: string;
  city: string;
  country: string;
  description?: string;
  posterImage?: CloudinaryImage;
  ticketTiers: TicketTier[];
}

interface SerializedPublicCelebrity {
  _id: string;
  name: string;
  slug: string;
  shortBio?: string;
  category: string;
  profileImage?: CloudinaryImage;
  nationality?: string;
  knownFor?: string;
  availableServices: AvailableService[];
  featured: boolean;
  tags?: string[];
}

interface SerializedFullPublicCelebrity {
  _id: string;
  name: string;
  slug: string;
  bio?: string;
  shortBio?: string;
  category: string;
  subcategories?: string[];
  profileImage?: CloudinaryImage;
  coverImage?: CloudinaryImage;
  gallery?: CloudinaryImage[];
  nationality?: string;
  knownFor?: string;
  achievements?: string[];
  languages?: string[];
  socialLinks?: SocialLinks;
  availableServices: AvailableService[];
  concertEnabled: boolean;
  concertDetails?: ConcertDetails;
  featured: boolean;
  tags?: string[];
}

interface BrowseCelebritiesParams {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "featured" | "createdAt";
  sortOrder?: "asc" | "desc";
}

function serializePublicCelebrity(doc: Record<string, unknown>): SerializedPublicCelebrity {
  const services = (doc.availableServices as AvailableService[]) || [];
  
  return {
    _id: String(doc._id),
    name: doc.name as string,
    slug: doc.slug as string,
    shortBio: doc.shortBio as string | undefined,
    category: doc.category as string,
    profileImage: doc.profileImage as CloudinaryImage | undefined,
    nationality: doc.nationality as string | undefined,
    knownFor: doc.knownFor as string | undefined,
    availableServices: services.filter((s) => s.isActive),
    featured: Boolean(doc.featured),
    tags: doc.tags as string[] | undefined,
  };
}

function serializeFullPublicCelebrity(doc: Record<string, unknown>): SerializedFullPublicCelebrity {
  const services = (doc.availableServices as AvailableService[]) || [];
  const concertDetails = doc.concertDetails as ConcertDetails | undefined;
  
  return {
    _id: String(doc._id),
    name: doc.name as string,
    slug: doc.slug as string,
    bio: doc.bio as string | undefined,
    shortBio: doc.shortBio as string | undefined,
    category: doc.category as string,
    subcategories: doc.subcategories as string[] | undefined,
    profileImage: doc.profileImage as CloudinaryImage | undefined,
    coverImage: doc.coverImage as CloudinaryImage | undefined,
    gallery: doc.gallery as CloudinaryImage[] | undefined,
    nationality: doc.nationality as string | undefined,
    knownFor: doc.knownFor as string | undefined,
    achievements: doc.achievements as string[] | undefined,
    languages: doc.languages as string[] | undefined,
    socialLinks: doc.socialLinks as SocialLinks | undefined,
    availableServices: services.filter((s) => s.isActive),
    concertEnabled: Boolean(doc.concertEnabled),
    concertDetails: concertDetails
      ? {
          ...concertDetails,
          date: concertDetails.date
            ? new Date(concertDetails.date).toISOString()
            : "",
        }
      : undefined,
    featured: Boolean(doc.featured),
    tags: doc.tags as string[] | undefined,
  };
}

/**
 * Browse celebrities with filters and pagination
 */
export async function browseCelebrities(params: BrowseCelebritiesParams = {}) {
  try {
    await connectDB();
    await requireClient();

    const {
      query = "",
      category,
      page = 1,
      limit = ITEMS_PER_PAGE,
      sortBy = "featured",
      sortOrder = "desc",
    } = params;

    const filter: Record<string, unknown> = { isActive: true };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { knownFor: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    let sortOptions: Record<string, 1 | -1>;
    if (sortBy === "featured") {
      sortOptions = { featured: -1, sortOrder: 1, name: 1 };
    } else {
      sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    }

    const skip = (page - 1) * limit;

    const [celebrities, total] = await Promise.all([
      Celebrity.find(filter)
        .select("name slug shortBio category profileImage nationality knownFor availableServices featured tags")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Celebrity.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: celebrities.map((c) =>
          serializePublicCelebrity(c as unknown as Record<string, unknown>)
        ),
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error browsing celebrities:", error);
    return {
      success: false,
      error: "Failed to fetch celebrities",
    };
  }
}

/**
 * Get full public celebrity profile by slug
 */
export async function getCelebrityBySlug(slug: string) {
  try {
    await connectDB();
    await requireClient();

    const celebrity = await Celebrity.findOne({ slug, isActive: true })
      .select(
        "name slug bio shortBio category subcategories profileImage coverImage gallery nationality knownFor achievements languages socialLinks availableServices concertEnabled concertDetails featured tags"
      )
      .lean();

    if (!celebrity) {
      return {
        success: false,
        error: "Celebrity not found",
      };
    }

    return {
      success: true,
      data: serializeFullPublicCelebrity(celebrity as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error fetching celebrity:", error);
    return {
      success: false,
      error: "Failed to fetch celebrity",
    };
  }
}

/**
 * Get featured celebrities for dashboard
 */
export async function getFeaturedCelebrities(limit: number = 6) {
  try {
    await connectDB();
    await requireClient();

    const celebrities = await Celebrity.find({ isActive: true, featured: true })
      .select("name slug shortBio category profileImage nationality availableServices")
      .sort({ sortOrder: 1 })
      .limit(limit)
      .lean();

    return {
      success: true,
      data: celebrities.map((c) =>
        serializePublicCelebrity(c as unknown as Record<string, unknown>)
      ),
    };
  } catch (error) {
    console.error("Error fetching featured celebrities:", error);
    return {
      success: false,
      error: "Failed to fetch featured celebrities",
    };
  }
}

/**
 * Get celebrity categories with counts
 */
export async function getCelebrityCategories() {
  try {
    await connectDB();
    await requireClient();

    const categories = await Celebrity.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, category: "$_id", count: 1 } },
    ]);

    return {
      success: true,
      data: categories as { category: string; count: number }[],
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      error: "Failed to fetch categories",
    };
  }
}
