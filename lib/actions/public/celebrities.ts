"use server";

import { connectDB } from "@/lib/db";
import { Celebrity } from "@/lib/models";

export interface PublicCelebrity {
  _id: string;
  name: string;
  slug: string;
  shortBio?: string;
  category: string;
  profileImage?: { url: string; publicId: string };
  nationality?: string;
  knownFor?: string;
  availableServices: {
    type: string;
    isActive: boolean;
    basePrice: number;
    description?: string;
  }[];
  featured: boolean;
  tags?: string[];
}

export interface PublicCelebrityFull extends PublicCelebrity {
  bio?: string;
  coverImage?: { url: string; publicId: string };
  gallery?: { url: string; publicId: string }[];
  subcategories?: string[];
  achievements?: string[];
  languages?: string[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    facebook?: string;
    website?: string;
  };
  concertEnabled?: boolean;
  concertDetails?: {
    title?: string;
    venue?: string;
    date?: string;
    city?: string;
    country?: string;
    description?: string;
  };
}

export interface PaginatedCelebrities {
  data: PublicCelebrity[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CategoryCount {
  category: string;
  count: number;
}

interface GetPublicCelebritiesParams {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "featured" | "createdAt";
  featured?: boolean;
}

export async function getPublicCelebrities(
  params: GetPublicCelebritiesParams = {}
): Promise<{ success: boolean; data?: PaginatedCelebrities; error?: string }> {
  try {
    await connectDB();

    const {
      query,
      category,
      page = 1,
      limit = 12,
      sortBy = "featured",
      featured,
    } = params;

    const filter: Record<string, unknown> = { isActive: true };

    if (query) {
      const regex = new RegExp(query, "i");
      filter.$or = [
        { name: regex },
        { knownFor: regex },
        { tags: regex },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (featured) {
      filter.featured = true;
    }

    let sortOption: Record<string, 1 | -1> = { featured: -1, sortOrder: 1, name: 1 };
    if (sortBy === "name") {
      sortOption = { name: 1 };
    } else if (sortBy === "createdAt") {
      sortOption = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [celebrities, total] = await Promise.all([
      Celebrity.find(filter)
        .select("name slug shortBio category profileImage nationality knownFor availableServices featured tags")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Celebrity.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    const serialized: PublicCelebrity[] = celebrities.map((celeb) => ({
      _id: celeb._id.toString(),
      name: celeb.name,
      slug: celeb.slug,
      shortBio: celeb.shortBio,
      category: celeb.category,
      profileImage: celeb.profileImage,
      nationality: celeb.nationality,
      knownFor: celeb.knownFor,
      availableServices: celeb.availableServices?.filter((s: { isActive: boolean }) => s.isActive) || [],
      featured: celeb.featured,
      tags: celeb.tags,
    }));

    return {
      success: true,
      data: {
        data: serialized,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching public celebrities:", error);
    return { success: false, error: "Failed to fetch celebrities" };
  }
}

export async function getPublicCelebrityBySlug(
  slug: string
): Promise<{ success: boolean; data?: PublicCelebrityFull; error?: string }> {
  try {
    await connectDB();

    const celebrity = await Celebrity.findOne({ slug, isActive: true })
      .select("-managerName -managerEmail -managerPhone -agencyName -internalNotes -totalBookings -totalRevenue -createdAt -updatedAt -__v")
      .lean();

    if (!celebrity) {
      return { success: false, error: "Celebrity not found" };
    }

    const serialized: PublicCelebrityFull = {
      _id: celebrity._id.toString(),
      name: celebrity.name,
      slug: celebrity.slug,
      bio: celebrity.bio,
      shortBio: celebrity.shortBio,
      category: celebrity.category,
      subcategories: celebrity.subcategories,
      profileImage: celebrity.profileImage,
      coverImage: celebrity.coverImage,
      gallery: celebrity.gallery,
      nationality: celebrity.nationality,
      knownFor: celebrity.knownFor,
      achievements: celebrity.achievements,
      languages: celebrity.languages,
      socialLinks: celebrity.socialLinks,
      availableServices: celebrity.availableServices?.filter((s: { isActive: boolean }) => s.isActive) || [],
      concertEnabled: celebrity.concertEnabled,
      concertDetails: celebrity.concertDetails ? {
        title: celebrity.concertDetails.title,
        venue: celebrity.concertDetails.venue,
        date: celebrity.concertDetails.date?.toISOString(),
        city: celebrity.concertDetails.city,
        country: celebrity.concertDetails.country,
        description: celebrity.concertDetails.description,
      } : undefined,
      featured: celebrity.featured,
      tags: celebrity.tags,
    };

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching celebrity by slug:", error);
    return { success: false, error: "Failed to fetch celebrity" };
  }
}

export async function getPublicFeaturedCelebrities(
  limit = 6
): Promise<{ success: boolean; data?: PublicCelebrity[]; error?: string }> {
  try {
    await connectDB();

    const celebrities = await Celebrity.find({ isActive: true, featured: true })
      .select("name slug shortBio category profileImage nationality")
      .sort({ sortOrder: 1 })
      .limit(limit)
      .lean();

    const serialized: PublicCelebrity[] = celebrities.map((celeb) => ({
      _id: celeb._id.toString(),
      name: celeb.name,
      slug: celeb.slug,
      shortBio: celeb.shortBio,
      category: celeb.category,
      profileImage: celeb.profileImage,
      nationality: celeb.nationality,
      availableServices: [],
      featured: true,
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching featured celebrities:", error);
    return { success: false, error: "Failed to fetch featured celebrities" };
  }
}

export async function getPublicCategories(): Promise<{
  success: boolean;
  data?: CategoryCount[];
  error?: string;
}> {
  try {
    await connectDB();

    const categories = await Celebrity.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const result: CategoryCount[] = categories.map((cat) => ({
      category: cat._id,
      count: cat.count,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}
