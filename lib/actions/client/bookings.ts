"use server";

import { connectDB } from "@/lib/db";
import { requireClient } from "@/lib/auth-utils";
import { BookingRequest, Celebrity, PaymentMethod, User } from "@/lib/models";
import { deleteImage } from "@/lib/cloudinary";
import { bookingRequestSchema } from "@/lib/validations/booking";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { sendBookingSubmittedEmail } from "@/lib/email";
import type { BookingType, PaymentMethodType } from "@/types";

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
}

interface SerializedBooking {
  _id: string;
  bookingId: string;
  userId: string;
  celebrityId: string;
  type: string;
  status: string;
  details: BookingDetails;
  amount: number;
  currency: string;
  paymentMethodUsed?: string;
  paymentMethodType?: string;
  paymentReceipt?: string;
  paymentReceiptPublicId?: string;
  paymentUploadedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
  rejectionReason?: string;
  completionNote?: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  celebrity?: {
    _id: string;
    name: string;
    slug: string;
    profileImage?: CloudinaryImage;
    coverImage?: CloudinaryImage;
    category: string;
    nationality?: string;
    availableServices?: {
      type: string;
      isActive: boolean;
      basePrice: number;
      description?: string;
      requirements?: string;
    }[];
  };
}

interface SerializedPaymentMethod {
  _id: string;
  type: string;
  label: string;
  instructions?: string;
  details: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
}

function serializeBooking(doc: Record<string, unknown>): SerializedBooking {
  const celebrity = doc.celebrityId as Record<string, unknown> | null;

  return {
    _id: String(doc._id),
    bookingId: doc.bookingId as string,
    userId: String(doc.userId),
    celebrityId: celebrity ? String(celebrity._id || doc.celebrityId) : String(doc.celebrityId),
    type: doc.type as string,
    status: doc.status as string,
    details: (doc.details as BookingDetails) || {},
    amount: (doc.amount as number) || 0,
    currency: (doc.currency as string) || "USD",
    paymentMethodUsed: doc.paymentMethodUsed as string | undefined,
    paymentMethodType: doc.paymentMethodType as string | undefined,
    paymentReceipt: doc.paymentReceipt as string | undefined,
    paymentReceiptPublicId: doc.paymentReceiptPublicId as string | undefined,
    paymentUploadedAt: doc.paymentUploadedAt
      ? new Date(doc.paymentUploadedAt as Date).toISOString()
      : undefined,
    reviewedBy: doc.reviewedBy ? String(doc.reviewedBy) : undefined,
    reviewedAt: doc.reviewedAt
      ? new Date(doc.reviewedAt as Date).toISOString()
      : undefined,
    adminNote: doc.adminNote as string | undefined,
    rejectionReason: doc.rejectionReason as string | undefined,
    completionNote: doc.completionNote as string | undefined,
    submittedAt: doc.submittedAt
      ? new Date(doc.submittedAt as Date).toISOString()
      : new Date().toISOString(),
    approvedAt: doc.approvedAt
      ? new Date(doc.approvedAt as Date).toISOString()
      : undefined,
    rejectedAt: doc.rejectedAt
      ? new Date(doc.rejectedAt as Date).toISOString()
      : undefined,
    completedAt: doc.completedAt
      ? new Date(doc.completedAt as Date).toISOString()
      : undefined,
    cancelledAt: doc.cancelledAt
      ? new Date(doc.cancelledAt as Date).toISOString()
      : undefined,
    cancellationReason: doc.cancellationReason as string | undefined,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as Date).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as Date).toISOString()
      : new Date().toISOString(),
    celebrity: celebrity
      ? {
          _id: String(celebrity._id),
          name: celebrity.name as string,
          slug: celebrity.slug as string,
          profileImage: celebrity.profileImage as CloudinaryImage | undefined,
          coverImage: celebrity.coverImage as CloudinaryImage | undefined,
          category: celebrity.category as string,
          nationality: celebrity.nationality as string | undefined,
          availableServices: (celebrity as unknown as { availableServices?: { type: string; isActive: boolean; basePrice: number; description?: string; requirements?: string }[] }).availableServices,
        }
      : undefined,
  };
}

function serializePaymentMethod(doc: Record<string, unknown>): SerializedPaymentMethod {
  return {
    _id: String(doc._id),
    type: doc.type as string,
    label: doc.label as string,
    instructions: doc.instructions as string | undefined,
    details: (doc.details as Record<string, unknown>) || {},
    isActive: Boolean(doc.isActive),
    sortOrder: (doc.sortOrder as number) || 0,
  };
}

/**
 * Create a new booking request
 */
export async function createBooking(data: Record<string, unknown>) {
  try {
    await connectDB();
    const session = await requireClient();

    const validation = bookingRequestSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Invalid booking data",
      };
    }

    const { celebrityId, type, details, amount, message } = validation.data;

    const celebrity = await Celebrity.findById(celebrityId).lean();
    if (!celebrity) {
      return {
        success: false,
        error: "Celebrity not found",
      };
    }

    if (!celebrity.isActive) {
      return {
        success: false,
        error: "This celebrity is not currently available for bookings",
      };
    }

    const services = celebrity.availableServices as {
      type: string;
      isActive: boolean;
      basePrice: number;
    }[];
    const service = services?.find((s) => s.type === type && s.isActive);

    if (!service) {
      return {
        success: false,
        error: "This service is not available for this celebrity",
      };
    }

    if (amount < service.basePrice) {
      return {
        success: false,
        error: `Amount must be at least ${service.basePrice}`,
      };
    }

    const bookingDoc = new BookingRequest({
      userId: session.user.id,
      celebrityId,
      type: type as BookingType,
      details: {
        ...details,
        message,
      },
      amount,
      currency: "USD",
      status: "pending",
      submittedAt: new Date(),
    });

    await bookingDoc.save();
    const bookingObj = bookingDoc.toObject();

    // Send email notification (non-blocking)
    const user = await User.findById(session.user.id).lean();
    if (user?.email) {
      sendBookingSubmittedEmail(
        user.email as string,
        user.firstName as string,
        bookingDoc.bookingId,
        celebrity.name as string,
        type,
      ).catch(() => {});
    }

    return {
      success: true,
      data: serializeBooking(bookingObj as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error creating booking:", error);
    return {
      success: false,
      error: "Failed to create booking",
    };
  }
}

interface GetMyBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Get current user's bookings with pagination
 */
export async function getMyBookings(params: GetMyBookingsParams = {}) {
  try {
    await connectDB();
    const session = await requireClient();

    const {
      page = 1,
      limit = ITEMS_PER_PAGE,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const filter: Record<string, unknown> = { userId: session.user.id };

    if (status && status !== "all") {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const [bookings, total] = await Promise.all([
      BookingRequest.find(filter)
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
        data: bookings.map((b) =>
          serializeBooking(b as unknown as Record<string, unknown>)
        ),
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
 * Get full booking detail for current user
 */
export async function getMyBookingById(id: string) {
  try {
    await connectDB();
    const session = await requireClient();

    const booking = await BookingRequest.findOne({
      _id: id,
      userId: session.user.id,
    })
      .populate(
        "celebrityId",
        "name slug profileImage coverImage category nationality availableServices"
      )
      .lean();

    if (!booking) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    return {
      success: true,
      data: serializeBooking(booking as unknown as Record<string, unknown>),
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
 * Upload payment receipt for a booking
 */
export async function uploadPaymentReceipt(
  bookingId: string,
  receipt: { url: string; publicId: string },
  paymentMethodUsed: string,
  paymentMethodType: string
) {
  try {
    await connectDB();
    const session = await requireClient();

    const booking = await BookingRequest.findOne({
      _id: bookingId,
      userId: session.user.id,
    });

    if (!booking) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    if (!["approved", "payment_pending"].includes(booking.status)) {
      return {
        success: false,
        error: "Payment cannot be uploaded for this booking status",
      };
    }

    if (booking.paymentReceiptPublicId) {
      await deleteImage(booking.paymentReceiptPublicId).catch(console.error);
    }

    booking.paymentReceipt = receipt.url;
    booking.paymentReceiptPublicId = receipt.publicId;
    booking.paymentMethodUsed = paymentMethodUsed;
    booking.paymentMethodType = paymentMethodType as PaymentMethodType;
    booking.paymentUploadedAt = new Date();

    if (booking.status === "approved") {
      booking.status = "payment_pending";
    }

    await booking.save();

    const updatedBooking = await BookingRequest.findById(booking._id)
      .populate(
        "celebrityId",
        "name slug profileImage coverImage category nationality availableServices"
      )
      .lean();

    return {
      success: true,
      data: serializeBooking(updatedBooking as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error uploading payment receipt:", error);
    return {
      success: false,
      error: "Failed to upload payment receipt",
    };
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(id: string, reason?: string) {
  try {
    await connectDB();
    const session = await requireClient();

    const booking = await BookingRequest.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!booking) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    const cancellableStatuses = [
      "pending",
      "under_review",
      "approved",
      "payment_pending",
    ];

    if (!cancellableStatuses.includes(booking.status)) {
      return {
        success: false,
        error: "This booking cannot be cancelled",
      };
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    if (reason) {
      booking.cancellationReason = reason;
    }

    await booking.save();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return {
      success: false,
      error: "Failed to cancel booking",
    };
  }
}

/**
 * Get active payment methods for client use
 */
export async function getActivePaymentMethods() {
  try {
    await connectDB();
    await requireClient();

    const methods = await PaymentMethod.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    return {
      success: true,
      data: methods.map((m) =>
        serializePaymentMethod(m as unknown as Record<string, unknown>)
      ),
    };
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return {
      success: false,
      error: "Failed to fetch payment methods",
    };
  }
}
