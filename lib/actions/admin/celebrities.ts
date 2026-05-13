"use server";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { Celebrity } from "@/lib/models";
import { celebritySchema } from "@/lib/validations/celebrity";
import { deleteImage } from "@/lib/cloudinary";
import { generateSlug } from "@/lib/utils";
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

interface TicketTier {
  name: string;
  price: number;
  totalSlots: number;
  availableSlots: number;
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

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  linkedin?: string;
  spotify?: string;
  soundcloud?: string;
}

interface SerializedCelebrity {
  _id: string;
  name: string;
  slug: string;
  bio?: string;
  shortBio?: string;
  category: string;
  subcategories: string[];
  profileImage?: CloudinaryImage;
  coverImage?: CloudinaryImage;
  gallery: Array<{ url: string; publicId: string; caption?: string }>;
  nationality?: string;
  knownFor?: string;
  achievements: string[];
  languages: string[];
  socialLinks: SocialLinks;
  availableServices: AvailableService[];
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
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface SerializedCelebrityListItem {
  _id: string;
  name: string;
  slug: string;
  shortBio?: string;
  category: string;
  profileImage?: CloudinaryImage;
  nationality?: string;
  featured: boolean;
  isActive: boolean;
  totalBookings: number;
  totalRevenue: number;
  servicesCount: number;
  createdAt: string;
}

interface PaginatedResponse {
  data: SerializedCelebrityListItem[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface GetCelebritiesParams {
  query?: string;
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function serializeCelebrity(doc: Record<string, unknown>): SerializedCelebrity {
  return {
    _id: String(doc._id),
    name: doc.name as string,
    slug: doc.slug as string,
    bio: doc.bio as string | undefined,
    shortBio: doc.shortBio as string | undefined,
    category: doc.category as string,
    subcategories: (doc.subcategories as string[]) || [],
    profileImage: doc.profileImage as CloudinaryImage | undefined,
    coverImage: doc.coverImage as CloudinaryImage | undefined,
    gallery: (doc.gallery as Array<{ url: string; publicId: string; caption?: string }>) || [],
    nationality: doc.nationality as string | undefined,
    knownFor: doc.knownFor as string | undefined,
    achievements: (doc.achievements as string[]) || [],
    languages: (doc.languages as string[]) || [],
    socialLinks: (doc.socialLinks as SocialLinks) || {},
    availableServices: (doc.availableServices as AvailableService[]) || [],
    concertEnabled: Boolean(doc.concertEnabled),
    concertDetails: doc.concertDetails
      ? (() => {
          const cd = doc.concertDetails as Record<string, unknown>;
          return {
            title: (cd.title as string) || "",
            venue: (cd.venue as string) || "",
            date: cd.date ? new Date(cd.date as string | Date).toISOString() : "",
            city: (cd.city as string) || "",
            country: (cd.country as string) || "",
            description: cd.description as string | undefined,
            posterImage: cd.posterImage as CloudinaryImage | undefined,
            ticketTiers: (cd.ticketTiers as TicketTier[]) || [],
          };
        })()
      : undefined,
    managerName: doc.managerName as string | undefined,
    managerEmail: doc.managerEmail as string | undefined,
    managerPhone: doc.managerPhone as string | undefined,
    agencyName: doc.agencyName as string | undefined,
    internalNotes: doc.internalNotes as string | undefined,
    featured: Boolean(doc.featured),
    isActive: Boolean(doc.isActive),
    sortOrder: (doc.sortOrder as number) || 0,
    totalBookings: (doc.totalBookings as number) || 0,
    totalRevenue: (doc.totalRevenue as number) || 0,
    tags: (doc.tags as string[]) || [],
    createdAt: doc.createdAt ? new Date(doc.createdAt as Date).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt as Date).toISOString() : new Date().toISOString(),
  };
}

function serializeCelebrityListItem(doc: Record<string, unknown>): SerializedCelebrityListItem {
  const services = (doc.availableServices as AvailableService[]) || [];
  return {
    _id: String(doc._id),
    name: doc.name as string,
    slug: doc.slug as string,
    shortBio: doc.shortBio as string | undefined,
    category: doc.category as string,
    profileImage: doc.profileImage as CloudinaryImage | undefined,
    nationality: doc.nationality as string | undefined,
    featured: Boolean(doc.featured),
    isActive: Boolean(doc.isActive),
    totalBookings: (doc.totalBookings as number) || 0,
    totalRevenue: (doc.totalRevenue as number) || 0,
    servicesCount: services.filter((s) => s.isActive).length,
    createdAt: doc.createdAt ? new Date(doc.createdAt as Date).toISOString() : new Date().toISOString(),
  };
}

export async function getCelebrities(
  params: GetCelebritiesParams = {}
): Promise<{ success: boolean; data?: PaginatedResponse; error?: string }> {
  try {
    await requireAdmin();
    await connectDB();

    const {
      query,
      page = 1,
      limit = ITEMS_PER_PAGE,
      category,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const filter: Record<string, unknown> = {};

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

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status === "featured") {
      filter.featured = true;
      filter.isActive = true;
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const [celebrities, total] = await Promise.all([
      Celebrity.find(filter)
        .select("name slug shortBio category profileImage nationality featured isActive totalBookings totalRevenue availableServices createdAt")
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
        data: celebrities.map((c) => serializeCelebrityListItem(c as unknown as Record<string, unknown>)),
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching celebrities:", error);
    return {
      success: false,
      error: "Failed to fetch celebrities",
    };
  }
}

export async function getCelebrityById(
  id: string
): Promise<{ success: boolean; data?: SerializedCelebrity; error?: string }> {
  try {
    await requireAdmin();
    await connectDB();

    const celebrity = await Celebrity.findById(id).lean();

    if (!celebrity) {
      return {
        success: false,
        error: "Celebrity not found",
      };
    }

    return {
      success: true,
      data: serializeCelebrity(celebrity as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error fetching celebrity:", error);
    return {
      success: false,
      error: "Failed to fetch celebrity",
    };
  }
}

export async function createCelebrity(
  data: Record<string, unknown>,
  profileImage?: { url: string; publicId: string },
  coverImage?: { url: string; publicId: string }
): Promise<{ success: boolean; data?: SerializedCelebrity; error?: string }> {
  try {
    await requireAdmin();
    await connectDB();

    const validation = celebritySchema.safeParse(data);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Validation failed",
      };
    }

    const validatedData = validation.data;

    let slug = generateSlug(validatedData.name);
    const existingSlug = await Celebrity.findOne({ slug });
    if (existingSlug) {
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${slug}-${suffix}`;
    }

    const celebrity = await Celebrity.create({
      ...validatedData,
      slug,
      ...(profileImage && { profileImage }),
      ...(coverImage && { coverImage }),
    } as Record<string, unknown>);

    const celebrityDoc = await Celebrity.findById(celebrity._id).lean();

    return {
      success: true,
      data: serializeCelebrity(celebrityDoc as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error creating celebrity:", error);
    return {
      success: false,
      error: "Failed to create celebrity",
    };
  }
}

export async function updateCelebrity(
  id: string,
  data: Record<string, unknown>,
  profileImage?: { url: string; publicId: string },
  coverImage?: { url: string; publicId: string }
): Promise<{ success: boolean; data?: SerializedCelebrity; error?: string }> {
  try {
    await requireAdmin();
    await connectDB();

    const existingCelebrity = await Celebrity.findById(id);
    if (!existingCelebrity) {
      return {
        success: false,
        error: "Celebrity not found",
      };
    }

    const validation = celebritySchema.safeParse(data);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Validation failed",
      };
    }

    const validatedData = validation.data;
    const updateData: Record<string, unknown> = { ...validatedData };

    if (validatedData.name !== existingCelebrity.name) {
      let slug = generateSlug(validatedData.name);
      const existingSlug = await Celebrity.findOne({ slug, _id: { $ne: id } });
      if (existingSlug) {
        const suffix = Math.random().toString(36).substring(2, 6);
        slug = `${slug}-${suffix}`;
      }
      updateData.slug = slug;
    }

    if (profileImage) {
      if (existingCelebrity.profileImage?.publicId) {
        await deleteImage(existingCelebrity.profileImage.publicId).catch(console.error);
      }
      updateData.profileImage = profileImage;
    }

    if (coverImage) {
      if (existingCelebrity.coverImage?.publicId) {
        await deleteImage(existingCelebrity.coverImage.publicId).catch(console.error);
      }
      updateData.coverImage = coverImage;
    }

    const updatedCelebrity = await Celebrity.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();

    return {
      success: true,
      data: serializeCelebrity(updatedCelebrity as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error updating celebrity:", error);
    return {
      success: false,
      error: "Failed to update celebrity",
    };
  }
}

export async function deleteCelebrity(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await connectDB();

    const celebrity = await Celebrity.findById(id);

    if (!celebrity) {
      return {
        success: false,
        error: "Celebrity not found",
      };
    }

    if (celebrity.profileImage?.publicId) {
      await deleteImage(celebrity.profileImage.publicId);
    }

    if (celebrity.coverImage?.publicId) {
      await deleteImage(celebrity.coverImage.publicId);
    }

    if (celebrity.gallery && celebrity.gallery.length > 0) {
      for (const image of celebrity.gallery) {
        if (image.publicId) {
          await deleteImage(image.publicId);
        }
      }
    }

    await Celebrity.findByIdAndDelete(id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting celebrity:", error);
    return {
      success: false,
      error: "Failed to delete celebrity",
    };
  }
}

export async function toggleCelebrityStatus(
  id: string
): Promise<{ success: boolean; data?: { isActive: boolean }; error?: string }> {
  try {
    await requireAdmin();
    await connectDB();

    const celebrity = await Celebrity.findById(id);

    if (!celebrity) {
      return {
        success: false,
        error: "Celebrity not found",
      };
    }

    celebrity.isActive = !celebrity.isActive;
    await celebrity.save();

    return {
      success: true,
      data: { isActive: celebrity.isActive },
    };
  } catch (error) {
    console.error("Error toggling celebrity status:", error);
    return {
      success: false,
      error: "Failed to toggle celebrity status",
    };
  }
}

export async function toggleCelebrityFeatured(
  id: string
): Promise<{ success: boolean; data?: { featured: boolean }; error?: string }> {
  try {
    await requireAdmin();
    await connectDB();

    const celebrity = await Celebrity.findById(id);

    if (!celebrity) {
      return {
        success: false,
        error: "Celebrity not found",
      };
    }

    celebrity.featured = !celebrity.featured;
    await celebrity.save();

    return {
      success: true,
      data: { featured: celebrity.featured },
    };
  } catch (error) {
    console.error("Error toggling celebrity featured:", error);
    return {
      success: false,
      error: "Failed to toggle celebrity featured status",
    };
  }
}
