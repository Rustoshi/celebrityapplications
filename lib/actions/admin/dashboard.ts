"use server";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { Celebrity, BookingRequest, User, ContactMessage } from "@/lib/models";

export interface DashboardStats {
  totalCelebrities: number;
  activeCelebrities: number;
  totalBookings: number;
  pendingBookings: number;
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
  unreadMessages: number;
}

export interface RecentBooking {
  _id: string;
  bookingId: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  celebrity: {
    _id: string;
    name: string;
    slug: string;
    profileImage?: {
      url: string;
      publicId: string;
    };
  } | null;
}

export interface RecentClient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  avatar?: { url: string; publicId: string };
  totalBookings: number;
  createdAt: string;
}

export async function getDashboardStats(): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  try {
    await requireAdmin();
    await connectDB();

    const [
      totalCelebrities,
      activeCelebrities,
      totalBookings,
      pendingBookings,
      totalClients,
      activeClients,
      revenueResult,
      unreadMessages,
    ] = await Promise.all([
      Celebrity.countDocuments().catch(() => 0),
      Celebrity.countDocuments({ isActive: true }).catch(() => 0),
      BookingRequest.countDocuments().catch(() => 0),
      BookingRequest.countDocuments({ status: "pending" }).catch(() => 0),
      User.countDocuments().catch(() => 0),
      User.countDocuments({ status: "active" }).catch(() => 0),
      BookingRequest.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).catch(() => []),
      ContactMessage.countDocuments({ status: "unread" }).catch(() => 0),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    return {
      success: true,
      data: {
        totalCelebrities,
        activeCelebrities,
        totalBookings,
        pendingBookings,
        totalClients,
        activeClients,
        totalRevenue,
        unreadMessages,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard stats",
    };
  }
}

export async function getRecentBookings(
  limit = 5
): Promise<{ success: boolean; data?: RecentBooking[]; error?: string }> {
  try {
    await requireAdmin();
    await connectDB();

    const bookings = await BookingRequest.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "firstName lastName email")
      .populate("celebrityId", "name slug profileImage")
      .lean();

    const serializedBookings: RecentBooking[] = bookings.map((booking) => {
      const user = booking.userId as unknown as {
        _id: { toString: () => string };
        firstName: string;
        lastName: string;
        email: string;
      } | null;

      const celebrity = booking.celebrityId as unknown as {
        _id: { toString: () => string };
        name: string;
        slug: string;
        profileImage?: { url: string; publicId: string };
      } | null;

      return {
        _id: booking._id.toString(),
        bookingId: booking.bookingId,
        type: booking.type,
        status: booking.status,
        amount: booking.amount,
        currency: booking.currency || "USD",
        createdAt: booking.createdAt.toISOString(),
        user: user
          ? {
              _id: user._id.toString(),
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            }
          : null,
        celebrity: celebrity
          ? {
              _id: celebrity._id.toString(),
              name: celebrity.name,
              slug: celebrity.slug,
              profileImage: celebrity.profileImage,
            }
          : null,
      };
    });

    return {
      success: true,
      data: serializedBookings,
    };
  } catch (error) {
    console.error("Error fetching recent bookings:", error);
    return {
      success: false,
      error: "Failed to fetch recent bookings",
    };
  }
}

export async function getRecentClients(
  limit = 5
): Promise<{ success: boolean; data?: RecentClient[]; error?: string }> {
  try {
    await requireAdmin();
    await connectDB();

    const clients = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("firstName lastName email status avatar totalBookings createdAt")
      .lean();

    const serializedClients: RecentClient[] = clients.map((client) => ({
      _id: client._id.toString(),
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      status: client.status,
      avatar: client.avatar,
      totalBookings: client.totalBookings || 0,
      createdAt: client.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: serializedClients,
    };
  } catch (error) {
    console.error("Error fetching recent clients:", error);
    return {
      success: false,
      error: "Failed to fetch recent clients",
    };
  }
}
