"use server";

import { connectDB } from "@/lib/db";
import { requireAdmin, getCurrentAdmin } from "@/lib/auth-utils";
import { BookingRequest, Celebrity, User } from "@/lib/models";
import { deleteImage } from "@/lib/cloudinary";
import { bookingReviewSchema, bookingStatusUpdateSchema } from "@/lib/validations/booking";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import {
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  sendBookingCompletedEmail,
  sendBookingCancelledEmail,
  sendBookingConfirmedEmail,
} from "@/lib/email";
import { formatCurrency } from "@/lib/utils";

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface BookingDetails {
  preferredDate?: string;
  preferredEndDate?: string;
  preferredCity?: string;
  preferredCountry?: string;
  venue?: string;
  specialRequests?: string;
  message?: string;
  guestCount?: number;
  eventType?: string;
  eventName?: string;
  duration?: string;
  companyName?: string;
  ticketTier?: string;
  ticketQuantity?: number;
  attendeeNames?: string[];
  occasion?: string;
  recipientName?: string;
  platform?: string;
  campaignDetails?: string;
  deliverables?: string;
  [key: string]: unknown;
}

interface PopulatedUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  country?: string;
  city?: string;
}

interface PopulatedCelebrity {
  _id: string;
  name: string;
  slug: string;
  profileImage?: CloudinaryImage;
  category: string;
  nationality?: string;
  availableServices?: Array<{
    type: string;
    isActive: boolean;
    basePrice: number;
    description?: string;
  }>;
}

interface SerializedBookingListItem {
  _id: string;
  bookingId: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  submittedAt: string;
  user: PopulatedUser | null;
  celebrity: {
    _id: string;
    name: string;
    slug: string;
    profileImage?: CloudinaryImage;
    category: string;
  } | null;
}

interface SerializedBookingFull {
  _id: string;
  bookingId: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  details: BookingDetails;
  paymentMethodUsed?: string;
  paymentMethodType?: string;
  paymentReceipt?: string;
  paymentReceiptPublicId?: string;
  paymentUploadedAt?: string;
  giftCardType?: string;
  giftCardAmount?: number;
  giftCardCode?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
  rejectionReason?: string;
  completionNote?: string;
  cancellationReason?: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  user: PopulatedUser | null;
  celebrity: PopulatedCelebrity | null;
}

interface GetBookingsParams {
  query?: string;
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  userId?: string;
}

function serializeBookingListItem(doc: Record<string, unknown>): SerializedBookingListItem {
  const user = doc.userId as Record<string, unknown> | null;
  const celebrity = doc.celebrityId as Record<string, unknown> | null;

  return {
    _id: String(doc._id),
    bookingId: doc.bookingId as string,
    type: doc.type as string,
    status: doc.status as string,
    amount: (doc.amount as number) || 0,
    currency: (doc.currency as string) || "USD",
    createdAt: doc.createdAt ? new Date(doc.createdAt as Date).toISOString() : new Date().toISOString(),
    submittedAt: doc.submittedAt ? new Date(doc.submittedAt as Date).toISOString() : new Date().toISOString(),
    user: user
      ? {
          _id: String(user._id),
          firstName: user.firstName as string,
          lastName: user.lastName as string,
          email: user.email as string,
          avatar: user.avatar as string | undefined,
        }
      : null,
    celebrity: celebrity
      ? {
          _id: String(celebrity._id),
          name: celebrity.name as string,
          slug: celebrity.slug as string,
          profileImage: celebrity.profileImage as CloudinaryImage | undefined,
          category: celebrity.category as string,
        }
      : null,
  };
}

function serializeBookingDetails(details: Record<string, unknown>): BookingDetails {
  const result: BookingDetails = {};

  if (details.preferredDate) {
    result.preferredDate = new Date(details.preferredDate as Date).toISOString();
  }
  if (details.preferredEndDate) {
    result.preferredEndDate = new Date(details.preferredEndDate as Date).toISOString();
  }
  if (details.preferredCity) result.preferredCity = details.preferredCity as string;
  if (details.preferredCountry) result.preferredCountry = details.preferredCountry as string;
  if (details.venue) result.venue = details.venue as string;
  if (details.specialRequests) result.specialRequests = details.specialRequests as string;
  if (details.message) result.message = details.message as string;
  if (details.guestCount) result.guestCount = details.guestCount as number;
  if (details.eventType) result.eventType = details.eventType as string;
  if (details.eventName) result.eventName = details.eventName as string;
  if (details.duration) result.duration = details.duration as string;
  if (details.companyName) result.companyName = details.companyName as string;
  if (details.ticketTier) result.ticketTier = details.ticketTier as string;
  if (details.ticketQuantity) result.ticketQuantity = details.ticketQuantity as number;
  if (details.attendeeNames) result.attendeeNames = details.attendeeNames as string[];
  if (details.occasion) result.occasion = details.occasion as string;
  if (details.recipientName) result.recipientName = details.recipientName as string;
  if (details.platform) result.platform = details.platform as string;
  if (details.campaignDetails) result.campaignDetails = details.campaignDetails as string;
  if (details.deliverables) result.deliverables = details.deliverables as string;

  return result;
}

function serializeBookingFull(doc: Record<string, unknown>): SerializedBookingFull {
  const user = doc.userId as Record<string, unknown> | null;
  const celebrity = doc.celebrityId as Record<string, unknown> | null;
  const details = (doc.details as Record<string, unknown>) || {};

  return {
    _id: String(doc._id),
    bookingId: doc.bookingId as string,
    type: doc.type as string,
    status: doc.status as string,
    amount: (doc.amount as number) || 0,
    currency: (doc.currency as string) || "USD",
    details: serializeBookingDetails(details),
    paymentMethodUsed: doc.paymentMethodUsed as string | undefined,
    paymentMethodType: doc.paymentMethodType as string | undefined,
    paymentReceipt: doc.paymentReceipt as string | undefined,
    paymentReceiptPublicId: doc.paymentReceiptPublicId as string | undefined,
    paymentUploadedAt: doc.paymentUploadedAt
      ? new Date(doc.paymentUploadedAt as Date).toISOString()
      : undefined,
    giftCardType: doc.giftCardType as string | undefined,
    giftCardAmount: doc.giftCardAmount as number | undefined,
    giftCardCode: doc.giftCardCode as string | undefined,
    reviewedBy: doc.reviewedBy as string | undefined,
    reviewedAt: doc.reviewedAt ? new Date(doc.reviewedAt as Date).toISOString() : undefined,
    adminNote: doc.adminNote as string | undefined,
    rejectionReason: doc.rejectionReason as string | undefined,
    completionNote: doc.completionNote as string | undefined,
    cancellationReason: doc.cancellationReason as string | undefined,
    submittedAt: doc.submittedAt
      ? new Date(doc.submittedAt as Date).toISOString()
      : new Date().toISOString(),
    approvedAt: doc.approvedAt ? new Date(doc.approvedAt as Date).toISOString() : undefined,
    rejectedAt: doc.rejectedAt ? new Date(doc.rejectedAt as Date).toISOString() : undefined,
    completedAt: doc.completedAt ? new Date(doc.completedAt as Date).toISOString() : undefined,
    cancelledAt: doc.cancelledAt ? new Date(doc.cancelledAt as Date).toISOString() : undefined,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as Date).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as Date).toISOString()
      : new Date().toISOString(),
    user: user
      ? {
          _id: String(user._id),
          firstName: user.firstName as string,
          lastName: user.lastName as string,
          email: user.email as string,
          avatar: user.avatar as string | undefined,
          phone: user.phone as string | undefined,
          country: user.country as string | undefined,
          city: user.city as string | undefined,
        }
      : null,
    celebrity: celebrity
      ? {
          _id: String(celebrity._id),
          name: celebrity.name as string,
          slug: celebrity.slug as string,
          profileImage: celebrity.profileImage as CloudinaryImage | undefined,
          category: celebrity.category as string,
          nationality: celebrity.nationality as string | undefined,
          availableServices: celebrity.availableServices as PopulatedCelebrity["availableServices"],
        }
      : null,
  };
}

/**
 * Get paginated, filterable booking list
 */
export async function getBookings(params: GetBookingsParams = {}) {
  try {
    await connectDB();
    await requireAdmin();

    const {
      query = "",
      page = 1,
      limit = ITEMS_PER_PAGE,
      status,
      type,
      sortBy = "createdAt",
      sortOrder = "desc",
      userId,
    } = params;

    const filter: Record<string, unknown> = {};

    if (query) {
      filter.bookingId = { $regex: query, $options: "i" };
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (userId) {
      filter.userId = userId;
    }

    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      BookingRequest.find(filter)
        .populate("userId", "firstName lastName email avatar")
        .populate("celebrityId", "name slug profileImage category")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      BookingRequest.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: bookings.map((b) => serializeBookingListItem(b as unknown as Record<string, unknown>)),
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return {
      success: false,
      error: "Failed to fetch bookings",
    };
  }
}

/**
 * Get full booking by ID with populated refs
 */
export async function getBookingById(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const booking = await BookingRequest.findById(id)
      .populate("userId", "firstName lastName email phone avatar country city")
      .populate("celebrityId", "name slug profileImage category nationality availableServices")
      .lean();

    if (!booking) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    return {
      success: true,
      data: serializeBookingFull(booking as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error fetching booking:", error);
    return {
      success: false,
      error: "Failed to fetch booking",
    };
  }
}

/**
 * Admin review action (approve, reject, complete, cancel)
 */
export async function reviewBooking(id: string, data: Record<string, unknown>) {
  try {
    await connectDB();
    const admin = await getCurrentAdmin();

    const validation = bookingReviewSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Invalid data",
      };
    }

    const { action, adminNote, rejectionReason, completionNote } = validation.data;

    const booking = await BookingRequest.findById(id);
    if (!booking) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      reviewedBy: String(admin._id),
      reviewedAt: now,
    };

    if (adminNote) {
      updateData.adminNote = adminNote;
    }

    switch (action) {
      case "approve":
        updateData.status = "approved";
        updateData.approvedAt = now;
        break;

      case "reject":
        updateData.status = "rejected";
        updateData.rejectedAt = now;
        updateData.rejectionReason = rejectionReason;
        break;

      case "complete":
        updateData.status = "completed";
        updateData.completedAt = now;
        if (completionNote) {
          updateData.completionNote = completionNote;
        }

        await Celebrity.findByIdAndUpdate(booking.celebrityId, {
          $inc: {
            totalBookings: 1,
            totalRevenue: booking.amount,
          },
        });

        await User.findByIdAndUpdate(booking.userId, {
          $inc: {
            totalBookings: 1,
            totalSpent: booking.amount,
          },
        });
        break;

      case "cancel":
        updateData.status = "cancelled";
        updateData.cancelledAt = now;
        break;
    }

    const updatedBooking = await BookingRequest.findByIdAndUpdate(id, updateData, { new: true })
      .populate("userId", "firstName lastName email phone avatar country city")
      .populate("celebrityId", "name slug profileImage category nationality availableServices")
      .lean();

    // Send email notification (non-blocking)
    if (updatedBooking) {
      const populatedUser = updatedBooking.userId as unknown as { firstName: string; email: string };
      if (populatedUser?.email) {
        const email = populatedUser.email;
        const firstName = populatedUser.firstName;
        const bid = booking.bookingId as string;

        switch (action) {
          case "approve":
            sendBookingApprovedEmail(email, firstName, bid, formatCurrency(booking.amount)).catch(() => {});
            break;
          case "reject":
            sendBookingRejectedEmail(email, firstName, bid, rejectionReason).catch(() => {});
            break;
          case "complete":
            sendBookingCompletedEmail(email, firstName, bid).catch(() => {});
            break;
          case "cancel":
            sendBookingCancelledEmail(email, firstName, bid).catch(() => {});
            break;
        }
      }
    }

    return {
      success: true,
      data: serializeBookingFull(updatedBooking as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error reviewing booking:", error);
    return {
      success: false,
      error: "Failed to review booking",
    };
  }
}

/**
 * Direct status update
 */
export async function updateBookingStatus(id: string, data: Record<string, unknown>) {
  try {
    await connectDB();
    const admin = await getCurrentAdmin();

    const validation = bookingStatusUpdateSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Invalid data",
      };
    }

    const { status, adminNote } = validation.data;

    const now = new Date();
    const updateData: Record<string, unknown> = {
      status,
      reviewedBy: String(admin._id),
      reviewedAt: now,
    };

    if (adminNote) {
      updateData.adminNote = adminNote;
    }

    switch (status) {
      case "approved":
        updateData.approvedAt = now;
        break;
      case "rejected":
        updateData.rejectedAt = now;
        break;
      case "completed":
        updateData.completedAt = now;
        break;
      case "cancelled":
        updateData.cancelledAt = now;
        break;
    }

    const booking = await BookingRequest.findById(id);
    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    const updatedBooking = await BookingRequest.findByIdAndUpdate(id, updateData, { new: true })
      .populate("userId", "firstName lastName email phone avatar country city")
      .populate("celebrityId", "name slug profileImage category nationality availableServices")
      .lean();

    if (!updatedBooking) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    // Send email notification (non-blocking)
    const populatedUser = updatedBooking.userId as unknown as { firstName: string; email: string };
    if (populatedUser?.email) {
      const email = populatedUser.email;
      const firstName = populatedUser.firstName;
      const bid = booking.bookingId as string;

      switch (status) {
        case "approved":
          sendBookingApprovedEmail(email, firstName, bid, formatCurrency(booking.amount)).catch(() => {});
          break;
        case "rejected":
          sendBookingRejectedEmail(email, firstName, bid, adminNote).catch(() => {});
          break;
        case "completed":
          sendBookingCompletedEmail(email, firstName, bid).catch(() => {});
          break;
        case "cancelled":
          sendBookingCancelledEmail(email, firstName, bid).catch(() => {});
          break;
        case "confirmed":
          sendBookingConfirmedEmail(email, firstName, bid).catch(() => {});
          break;
      }
    }

    return {
      success: true,
      data: serializeBookingFull(updatedBooking as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error updating booking status:", error);
    return {
      success: false,
      error: "Failed to update booking status",
    };
  }
}

/**
 * Delete a booking
 */
export async function deleteBooking(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const booking = await BookingRequest.findById(id);
    if (!booking) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    if (booking.paymentReceiptPublicId) {
      try {
        await deleteImage(booking.paymentReceiptPublicId);
      } catch (err) {
        console.error("Failed to delete payment receipt image:", err);
      }
    }

    await BookingRequest.findByIdAndDelete(id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting booking:", error);
    return {
      success: false,
      error: "Failed to delete booking",
    };
  }
}
