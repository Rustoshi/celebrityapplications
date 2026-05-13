"use server";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { User, BookingRequest } from "@/lib/models";
import { adminUpdateUserSchema } from "@/lib/validations/user";
import { ITEMS_PER_PAGE } from "@/lib/constants";

interface SerializedClientListItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  avatar?: string;
  phone?: string;
  country?: string;
  totalBookings: number;
  totalSpent: number;
  createdAt: string;
}

interface SerializedClientFull {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  city?: string;
  address?: string;
  bio?: string;
  company?: string;
  status: string;
  emailVerified: boolean;
  totalBookings: number;
  totalSpent: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface GetClientsParams {
  query?: string;
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function serializeClientListItem(doc: Record<string, unknown>): SerializedClientListItem {
  return {
    _id: String(doc._id),
    firstName: doc.firstName as string,
    lastName: doc.lastName as string,
    email: doc.email as string,
    status: doc.status as string,
    avatar: doc.avatar as string | undefined,
    phone: doc.phone as string | undefined,
    country: doc.country as string | undefined,
    totalBookings: (doc.totalBookings as number) || 0,
    totalSpent: (doc.totalSpent as number) || 0,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as Date).toISOString()
      : new Date().toISOString(),
  };
}

function serializeClientFull(doc: Record<string, unknown>): SerializedClientFull {
  return {
    _id: String(doc._id),
    firstName: doc.firstName as string,
    lastName: doc.lastName as string,
    email: doc.email as string,
    phone: doc.phone as string | undefined,
    avatar: doc.avatar as string | undefined,
    dateOfBirth: doc.dateOfBirth
      ? new Date(doc.dateOfBirth as Date).toISOString()
      : undefined,
    gender: doc.gender as string | undefined,
    country: doc.country as string | undefined,
    city: doc.city as string | undefined,
    address: doc.address as string | undefined,
    bio: doc.bio as string | undefined,
    company: doc.company as string | undefined,
    status: doc.status as string,
    emailVerified: Boolean(doc.emailVerified),
    totalBookings: (doc.totalBookings as number) || 0,
    totalSpent: (doc.totalSpent as number) || 0,
    lastLoginAt: doc.lastLoginAt
      ? new Date(doc.lastLoginAt as Date).toISOString()
      : undefined,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as Date).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as Date).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Get paginated, searchable client list
 */
export async function getClients(params: GetClientsParams = {}) {
  try {
    await connectDB();
    await requireAdmin();

    const {
      query = "",
      page = 1,
      limit = ITEMS_PER_PAGE,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const filter: Record<string, unknown> = {};

    if (query) {
      filter.$or = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      User.find(filter)
        .select("firstName lastName email status avatar phone country totalBookings totalSpent createdAt")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: clients.map((c) => serializeClientListItem(c as unknown as Record<string, unknown>)),
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return {
      success: false,
      error: "Failed to fetch clients",
    };
  }
}

/**
 * Get full client document by ID
 */
export async function getClientById(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const client = await User.findById(id).select("-password").lean();

    if (!client) {
      return {
        success: false,
        error: "Client not found",
      };
    }

    return {
      success: true,
      data: serializeClientFull(client as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error fetching client:", error);
    return {
      success: false,
      error: "Failed to fetch client",
    };
  }
}

/**
 * Admin updates client
 */
export async function updateClient(id: string, data: Record<string, unknown>) {
  try {
    await connectDB();
    await requireAdmin();

    const validation = adminUpdateUserSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Invalid data",
      };
    }

    const validatedData = validation.data;

    const existingClient = await User.findById(id);
    if (!existingClient) {
      return {
        success: false,
        error: "Client not found",
      };
    }

    if (validatedData.email !== existingClient.email) {
      const emailExists = await User.findOne({
        email: validatedData.email,
        _id: { $ne: id },
      });
      if (emailExists) {
        return {
          success: false,
          error: "Email already in use",
        };
      }
    }

    const updatedClient = await User.findByIdAndUpdate(id, validatedData, {
      new: true,
    })
      .select("-password")
      .lean();

    return {
      success: true,
      data: serializeClientFull(updatedClient as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error updating client:", error);
    return {
      success: false,
      error: "Failed to update client",
    };
  }
}

/**
 * Toggle client status
 */
export async function toggleClientStatus(id: string, newStatus: string) {
  try {
    await connectDB();
    await requireAdmin();

    if (!["active", "suspended", "pending"].includes(newStatus)) {
      return {
        success: false,
        error: "Invalid status",
      };
    }

    const client = await User.findById(id);
    if (!client) {
      return {
        success: false,
        error: "Client not found",
      };
    }

    await User.findByIdAndUpdate(id, { status: newStatus });

    return {
      success: true,
      data: { status: newStatus },
    };
  } catch (error) {
    console.error("Error toggling client status:", error);
    return {
      success: false,
      error: "Failed to update client status",
    };
  }
}

/**
 * Delete a client and their bookings
 */
export async function deleteClient(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const client = await User.findById(id);
    if (!client) {
      return {
        success: false,
        error: "Client not found",
      };
    }

    await BookingRequest.deleteMany({ userId: id });

    await User.findByIdAndDelete(id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting client:", error);
    return {
      success: false,
      error: "Failed to delete client",
    };
  }
}

/**
 * Get client's bookings
 */
export async function getClientBookings(clientId: string) {
  try {
    await connectDB();
    await requireAdmin();

    const bookings = await BookingRequest.find({ userId: clientId })
      .populate("celebrityId", "name slug profileImage category")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return {
      success: true,
      data: bookings.map((b) => {
        const doc = b as unknown as Record<string, unknown>;
        const celebrity = doc.celebrityId as Record<string, unknown> | null;

        return {
          _id: String(doc._id),
          bookingId: doc.bookingId as string,
          type: doc.type as string,
          status: doc.status as string,
          amount: (doc.amount as number) || 0,
          currency: (doc.currency as string) || "USD",
          createdAt: doc.createdAt
            ? new Date(doc.createdAt as Date).toISOString()
            : new Date().toISOString(),
          celebrity: celebrity
            ? {
                _id: String(celebrity._id),
                name: celebrity.name as string,
                slug: celebrity.slug as string,
                profileImage: celebrity.profileImage as { url: string; publicId: string } | undefined,
                category: celebrity.category as string,
              }
            : null,
        };
      }),
    };
  } catch (error) {
    console.error("Error fetching client bookings:", error);
    return {
      success: false,
      error: "Failed to fetch client bookings",
    };
  }
}
